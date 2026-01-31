import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import {
    Box, Typography, Button, TextField, Paper,
    CircularProgress, Alert, Snackbar, MenuItem,
    FormControl, Select, FormHelperText,
    Chip, Stack
} from '@mui/material';
import { Save as SaveIcon, Description } from '@mui/icons-material';
import { api } from '../../api/axio';
import { SurveyService } from '../../services/survey.service';
import type { SurveyAnswers } from '../../types/case';
import type { SurveyConfig, SurveyQuestion } from '../../types/survey';

interface Props {
    caseId: string;
    initialData?: SurveyAnswers;
    onUpdate?: () => void;
}

// Mapa para búsqueda rápida: OptionID -> { questionId, value, label }
type OptionMap = Record<string, { questionId: string; value: string; label: string }>;

export const SurveyTab = ({ caseId, initialData, onUpdate }: Props) => {
    const [config, setConfig] = useState<SurveyConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

    const { control, handleSubmit, reset } = useForm<SurveyAnswers>({
        defaultValues: initialData || {}
    });

    // Carga de Configuración
    useEffect(() => {
        SurveyService.getSurveyConfig()
            .then(data => {
                setConfig(data);
                if (initialData) reset(initialData);
            })
            .catch(err => console.error("Error loading survey config", err))
            .finally(() => setLoading(false));
    }, [initialData, reset]);

    // Construir el mapa de opciones para la lógica de visibilidad
    const optionMap = useMemo(() => {
        const map: OptionMap = {};
        if (!config) return map;

        config.questions.forEach(q => {
            if (q.options) {
                q.options.forEach(opt => {
                    map[opt.id] = { questionId: q.id, value: opt.value, label: opt.label };
                });
            }
        });
        return map;
    }, [config]);

    const onSubmit = async (data: SurveyAnswers) => {
        setSaving(true);
        try {
            await api.patch(`/cases/${caseId}`, { surveyAnswers: data });
            setFeedback({ open: true, message: 'Información guardada correctamente', type: 'success' });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            setFeedback({ open: true, message: 'Error al guardar', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
    if (!config) return <Alert severity="error">No se pudo cargar la configuración de la encuesta.</Alert>;

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">{config.title || 'Ficha del Caso'}</Typography>
                    <Typography variant="body2" color="text.secondary">{config.description}</Typography>
                </Box>
                <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={saving}
                >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </Box>

            <Paper variant="outlined" sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {config.questions.sort((a, b) => a.order - b.order).map(question => (
                    <QuestionRenderer
                        key={question.id}
                        question={question}
                        control={control}
                        optionMap={optionMap}
                    />
                ))}
            </Paper>

            <Snackbar
                open={feedback.open}
                autoHideDuration={4000}
                onClose={() => setFeedback({ ...feedback, open: false })}
            >
                <Alert severity={feedback.type}>{feedback.message}</Alert>
            </Snackbar>
        </Box>
    );
};

// Componente hijo para renderizar cada pregunta individualmente con su lógica
const QuestionRenderer = ({
    question, control, optionMap
}: {
    question: SurveyQuestion, control: any, optionMap: OptionMap
}) => {
    // 1. VISIBILIDAD (Branching Logic)
    // Si tiene activationOptionId, necesitamos observar la pregunta padre
    const activationData = question.activationOptionId ? optionMap[question.activationOptionId] : null;

    // Obtenemos el valor de la pregunta padre (si existe)
    const parentValue = useWatch({
        control,
        name: activationData?.questionId || '',
        exact: true
    });

    // Si hay regla de activación y no coincide, no renderizamos nada
    if (activationData && parentValue !== activationData.value) {
        return null;
    }

    // 2. RENDERIZADO DEL INPUT
    return (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                {question.statement} {question.required && <span style={{ color: 'red' }}>*</span>}
            </Typography>

            <Controller
                name={question.id}
                control={control}
                defaultValue={question.inputType === 'BOOLEAN' ? false : ''}
                rules={{ required: question.required ? 'Este campo es obligatorio' : false }}
                render={({ field, fieldState: { error } }) => {
                    const selectedOption = question.options?.find(o => o.value === field.value);

                    return (
                        <>
                            {question.inputType === 'TEXT' && (
                                <TextField {...field} fullWidth size="small" error={!!error} helperText={error?.message} />
                            )}

                            {question.inputType === 'NUMBER' && (
                                <TextField {...field} fullWidth type="number" size="small" error={!!error} helperText={error?.message} />
                            )}

                            {question.inputType === 'DATE' && (
                                <TextField {...field} fullWidth type="date" size="small" InputLabelProps={{ shrink: true }} error={!!error} helperText={error?.message} />
                            )}

                            {question.inputType === 'SELECT' && (
                                <>
                                    {/* Si son pocas opciones (ej. Si/No), mostramos botones tipo "Segmented Control" */}
                                    {question.options && question.options.length <= 3 ? (
                                        <Stack direction="row" spacing={1}>
                                            {question.options.map(opt => (
                                                <Button
                                                    key={opt.id}
                                                    variant={field.value === opt.value ? "contained" : "outlined"}
                                                    onClick={() => field.onChange(opt.value)}
                                                    sx={{ textTransform: 'none', minWidth: 100 }}
                                                >
                                                    {opt.label}
                                                </Button>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <FormControl fullWidth size="small" error={!!error}>
                                            <Select {...field} displayEmpty>
                                                <MenuItem value="" disabled><em>Seleccione...</em></MenuItem>
                                                {question.options?.map(opt => (
                                                    <MenuItem key={opt.id} value={opt.value}>
                                                        {opt.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {error && <FormHelperText>{error.message}</FormHelperText>}
                                        </FormControl>
                                    )}
                                </>
                            )}

                            {question.inputType === 'BOOLEAN' && (
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        variant={field.value === true ? "contained" : "outlined"}
                                        color={field.value === true ? "success" : "inherit"}
                                        onClick={() => field.onChange(true)}
                                        sx={{ minWidth: 100 }}
                                    >
                                        Sí
                                    </Button>
                                    <Button
                                        variant={field.value === false ? "contained" : "outlined"}
                                        color={field.value === false ? "error" : "inherit"}
                                        onClick={() => field.onChange(false)}
                                        sx={{ minWidth: 100 }}
                                    >
                                        No
                                    </Button>
                                </Stack>
                            )}

                            {/* Mensaje de documento requerido si aplica */}
                            {selectedOption?.conditions?.[0]?.requiredDocumentType && (
                                <Chip
                                    icon={<Description style={{ fontSize: 16 }} />}
                                    label="Esta respuesta requiere adjuntar soporte documental"
                                    size="small"
                                    color="warning"
                                    sx={{ mt: 1 }}
                                />
                            )}
                        </>
                    );
                }}
            />
        </Box>
    );
};