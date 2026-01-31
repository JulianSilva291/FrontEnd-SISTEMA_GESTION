import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
    Box, Typography, Paper, Button, IconButton, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Switch, FormControlLabel, Grid
} from '@mui/material';
import {
    Add, Edit, Delete, Save, DragIndicator, ExpandMore, Description
} from '@mui/icons-material';
import { MainLayout } from '../../layouts/MainLayout';
import { SurveyService } from '../../services/survey.service';
import type { SurveyConfig, SurveyQuestion } from '../../types/survey';
import { api } from '../../api/axio';

// Helper component for individual question row (avoids Accordion button nesting issues)
import { Collapse } from '@mui/material';

const QuestionItem = ({ field, index, onEdit, onRemove }: { field: SurveyQuestion; index: number; onEdit: () => void; onRemove: () => void }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Paper variant="outlined" sx={{ mb: 1, overflow: 'hidden' }}>
            {/* Header Row - NOT a button, just a flex container */}
            <Box sx={{ p: 1, pl: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f8fafc' }}>
                <DragIndicator color="action" />
                <Typography fontWeight="bold">P{index + 1}. {field.title}</Typography>

                <Chip label={field.inputType} size="small" color="primary" variant="outlined" />
                {field.required && <Chip label="Obligatoria" size="small" color="error" />}
                {field.options && field.options.length > 0 && (
                    <Chip label={`${field.options.length} opciones`} size="small" />
                )}

                <Box sx={{ flexGrow: 1 }} />

                {/* Actions Grouped */}
                <IconButton size="small" onClick={onEdit} title="Editar">
                    <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={onRemove} title="Eliminar">
                    <Delete fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}
                >
                    <ExpandMore />
                </IconButton>
            </Box>

            {/* Collapsible Details */}
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" color="text.secondary">ID: {field.id}</Typography>
                    {field.inputType === 'SELECT' && (
                        <Box sx={{ mt: 1, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                            <Typography variant="caption" fontWeight="bold">Opciones configuradas:</Typography>
                            {field.options?.map(opt => (
                                <Box key={opt.id} sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                    <Typography variant="body2">• {opt.label}</Typography>
                                    {opt.conditions?.[0]?.requiredDocumentType && (
                                        <Chip icon={<Description style={{ fontSize: 14 }} />} label="Pide Documento" size="small" color="warning" sx={{ height: 20 }} />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
};


export const SurveyConfigEditor = () => {
    const [loading, setLoading] = useState(true);
    // const [docTypes, setDocTypes] = useState<any[]>([]); // Deshabilitado temporalmente

    // React Hook Form Principal
    const { control, handleSubmit, register, reset } = useForm<SurveyConfig>({
        defaultValues: {
            title: '',
            description: '',
            questions: [],
            isActive: true
        }
    });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "questions"
    });

    // --- MODAL STATE ---
    const [modalOpen, setModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempQuestion, setTempQuestion] = useState<SurveyQuestion | null>(null);

    // Carga Inicial
    useEffect(() => {
        const fetchData = async () => {
            try {
                // const [config, docsRes] = await Promise.all([
                const config = await SurveyService.getSurveyConfig();
                /*
                    api.get('/document-types').catch(err => {
                        console.error("Error loading document types", err);
                        return { data: [] };
                    })
                ]);
                */

                reset(config);
                // Aseguramos que data sea un array
                // const docs = Array.isArray(docsRes.data) ? docsRes.data : [];
                // setDocTypes(docs);
                setLoading(false);
            } catch (error: any) {
                console.error("Error loading initial data", error);
                setLoading(false);
            }
        };
        fetchData();
    }, [reset]);

    const handleOpenModal = (index: number | null) => {
        setEditingIndex(index);
        if (index !== null) {
            setTempQuestion(fields[index]);
        } else {
            setTempQuestion({
                id: crypto.randomUUID(),
                statement: '',
                inputType: 'TEXT',
                required: false,
                order: fields.length + 1,
                options: [] // Inicializar opciones vacío
            });
        }
        setModalOpen(true);
    };

    const saveQuestionFromModal = async () => {
        if (!tempQuestion) return;

        try {
            // Identificar qué IDs de opciones ya existían en la BD (para saber si es Update o Create)
            const originalQuestion = editingIndex !== null ? fields[editingIndex] : null;
            const originalOptionIds = new Set(originalQuestion?.options?.map(o => o.id) || []);

            // Construir Payload Limpio (Whitelist estricto)
            const sanitizedPayload: any = {
                statement: tempQuestion.statement,
                required: tempQuestion.required,
                order: tempQuestion.order,
                // Opciones: Mapeo y limpieza
                options: tempQuestion.options?.map(opt => {

                    const cleanOpt: any = {
                        label: opt.label,
                        // order: opt.order, // Si el backend soporta order
                        requiredDocumentType: null // Deshabilitado por requerimiento
                    };

                    // Lógica Crítica: ID vs Value
                    // Si el ID de la opción ya existía en la pregunta original -> Es UPDATE -> Enviamos ID, NO value
                    if (opt.id && originalOptionIds.has(opt.id)) {
                        cleanOpt.id = opt.id;
                    } else {
                        // Si NO existía (o es nuevo) -> Es CREATE -> Enviamos VALUE, NO ID
                        cleanOpt.value = opt.value;
                    }
                    return cleanOpt;
                }) || []
            };

            // Guardamos directamente en el backend SOLO si es edición de una existente
            // Si es nueva (editingIndex === null), no intentamos PATCH porque fallará (404).
            // Se guardará al dar "Guardar Todo".
            if (editingIndex !== null) {
                try {
                    await SurveyService.saveQuestionConfig(tempQuestion.id, sanitizedPayload);
                } catch (error: any) {
                    // Si es 404, asumimos que es nueva (local) y ignoramos
                    if (error.response?.status === 404) {
                        console.warn("Pregunta no encontrada en backend (posiblemente local). Se sincronizará al guardar todo.");
                    } else {
                        throw error;
                    }
                }
            } else {
                console.log("Nueva pregunta creada localmente. Pendiente guardar en estructura.");
            }

            // ✅ PASO 3: ACTUALIZAR UI (Siempre se ejecuta si es éxito o 404)
            if (editingIndex !== null) {
                update(editingIndex, tempQuestion);
            } else {
                append(tempQuestion);
            }
            setModalOpen(false);

        } catch (error: any) {
            console.error("Error al guardar la pregunta:", error);
            const serverMessage = error.response?.data?.message
                ? (Array.isArray(error.response.data.message)
                    ? error.response.data.message.join(', ')
                    : error.response.data.message)
                : "Error desconocido";
            alert(`No se pudo guardar: ${serverMessage}`);
        }
    };
    const onSubmit = async (data: SurveyConfig) => {
        setLoading(true);
        await SurveyService.saveSurveyConfig(data);
        setLoading(false);
        alert('Configuración guardada exitosamente');
    };

    // --- MANEJO INTERNO DE LAS OPCIONES EN EL MODAL ---
    // Nota: Esto podría ser otro useFieldArray si fuera un componente separado, 
    // pero para simplificar lo manejaremos con estado local del tempQuestion.
    const addOptionToTemp = () => {
        if (!tempQuestion) return;
        const newOpt = { id: crypto.randomUUID(), label: 'Nueva Opción', value: 'VAL', order: 0, conditions: [] };
        setTempQuestion({
            ...tempQuestion,
            options: [...(tempQuestion.options || []), newOpt]
        });
    };

    const updateOption = (idx: number, field: string, val: string) => {
        if (!tempQuestion || !tempQuestion.options) return;
        const newOpts = [...tempQuestion.options];
        newOpts[idx] = { ...newOpts[idx], [field]: val };
        setTempQuestion({ ...tempQuestion, options: newOpts });
    };

    const removeOption = (idx: number) => {
        if (!tempQuestion || !tempQuestion.options) return;
        const newOpts = tempQuestion.options.filter((_, i) => i !== idx);
        setTempQuestion({ ...tempQuestion, options: newOpts });
    };

    return (
        <MainLayout>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Editor de Encuestas</Typography>
                    <Typography variant="body1" color="text.secondary">Configura las preguntas de la Ficha Social.</Typography>
                </Box>
                <Button variant="contained" startIcon={<Save />} onClick={handleSubmit(onSubmit)} disabled={loading}>
                    Guardar Todo
                </Button>
            </Box>

            {/* CABECERA FORMULARIO */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <TextField fullWidth label="Título de la Encuesta" {...register("title", { required: true })} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                    label="Encuesta Activa"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField fullWidth multiline rows={2} label="Descripción" {...register("description")} />
                    </Grid>
                </Grid>
            </Paper>

            {/* LISTA DE PREGUNTAS (FIELD ARRAY) */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Preguntas ({fields.length})</Typography>
                <Button variant="outlined" startIcon={<Add />} onClick={() => handleOpenModal(null)}>
                    Agregar Pregunta
                </Button>
            </Box>

            {fields.map((field, index) => (
                <QuestionItem
                    key={field.id}
                    field={field}
                    index={index}
                    onEdit={() => handleOpenModal(index)}
                    onRemove={() => remove(index)}
                />
            ))}

            {/* --- MODAL DE EDICIÓN DE PREGUNTA --- */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingIndex !== null ? 'Editar Pregunta' : 'Nueva Pregunta'}
                </DialogTitle>
                <DialogContent dividers>
                    {tempQuestion && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <TextField
                                    fullWidth
                                    label="Texto de la Pregunta"
                                    value={tempQuestion.statement}
                                    onChange={(e) => setTempQuestion({ ...tempQuestion, statement: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={tempQuestion.required}
                                            onChange={(e) => setTempQuestion({ ...tempQuestion, required: e.target.checked })}
                                        />
                                    }
                                    label="Respuesta Obligatoria"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Tipo de Entrada"
                                    value={tempQuestion.inputType}
                                    onChange={(e) => setTempQuestion({ ...tempQuestion, inputType: e.target.value as any })}
                                >
                                    <MenuItem value="TEXT">Texto Abierto</MenuItem>
                                    <MenuItem value="NUMBER">Numérico</MenuItem>
                                    <MenuItem value="DATE">Fecha</MenuItem>
                                    <MenuItem value="SELECT">Selección Única</MenuItem>
                                    <MenuItem value="BOOLEAN">Si / No</MenuItem>
                                </TextField>
                            </Grid>

                            {/* ZONA DE OPCIONES (SOLO SI ES SELECT) */}
                            {tempQuestion.inputType === 'SELECT' && (
                                <Grid size={{ xs: 12 }}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fffbf0' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="subtitle2" fontWeight="bold">Configuración de Opciones</Typography>
                                            <Button size="small" startIcon={<Add />} onClick={addOptionToTemp}>Agregar Opción</Button>
                                        </Box>

                                        <TableContainer sx={{ bgcolor: 'white' }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Etiqueta Visible</TableCell>
                                                        <TableCell>Valor Interno (Obligatorio)</TableCell>
                                                        {/* <TableCell>Documento Requerido (Opcional)</TableCell> Deshabilitado temporalmente */}
                                                        <TableCell width={50}></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {tempQuestion.options?.map((opt, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>
                                                                <TextField
                                                                    variant="standard"
                                                                    value={opt.label}
                                                                    onChange={(e) => updateOption(idx, 'label', e.target.value)}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField
                                                                    variant="standard"
                                                                    value={opt.value || ''}
                                                                    onChange={(e) => updateOption(idx, 'value', e.target.value)}
                                                                    placeholder="Ej: SI / NO"
                                                                />
                                                            </TableCell>
                                                            {/*
                                                            <TableCell>
                                                                <Select ...> ... </Select>
                                                            </TableCell>
                                                            */}
                                                            <TableCell>
                                                                <IconButton color="error" size="small" onClick={() => removeOption(idx)}><Delete fontSize="inherit" /></IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={saveQuestionFromModal} disabled={!tempQuestion?.statement}>
                        Guardar Cambios
                    </Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
};
