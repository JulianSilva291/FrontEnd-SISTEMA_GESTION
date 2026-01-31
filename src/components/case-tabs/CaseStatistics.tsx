import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  LinearProgress, 
  FormControlLabel, 
  Checkbox, 
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'; // Iconos nuevos
import { api } from '../../api/axio'; 

// CONFIGURACIÓN DE ETAPAS
const STAGES_CONFIG = [
  {
    id: 'pendientes',
    title: 'Pendientes',
    activities: [
      { key: 'cliente_creado', label: 'Cliente Creado', weight: 30 },
      { key: 'busqueda_familiares', label: 'Búsqueda de posibles familiares', weight: 70 },
    ]
  },
  {
    id: 'ubicado',
    title: 'Ubicado',
    activities: [
      { key: 'sube_ubica', label: 'Se sube el Ubica', weight: 40 },
      { key: 'asignacion_asesor', label: 'Asignación Asesor', weight: 60 },
    ]
  },
  {
    id: 'contactado',
    title: 'Contactado',
    activities: [
      { key: 'carta_presentacion', label: 'Enviar carta de presentación', weight: 50 },
      { key: 'contacto_efectivo', label: 'Contacto efectivo', weight: 50 },
    ]
  },
  {
    id: 'contrato_enviado',
    title: 'Contrato Enviado',
    activities: [
      { key: 'descargar_enviar', label: 'Descargar contrato y enviarlo (PDF)', weight: 100 },
    ]
  },
  {
    id: 'contrato_firmado',
    title: 'Contrato Firmado',
    activities: [
      { key: 'recibir_firmado', label: 'Recibir contrato Firmado', weight: 70 },
      { key: 'subir_software_contrato', label: 'Subirlo al Software', weight: 30 },
    ]
  },
  {
    id: 'documentos',
    title: 'Documentos',
    type: 'SPECIAL_DOCS',
    activities: [
      { key: 'docs_subido_software', label: 'Subirlo al Software', weight: 20 }
    ]
  },
  {
    id: 'radicado',
    title: 'Radicado Entidad',
    activities: [
      { key: 'conformacion', label: 'Se hace Conformación', weight: 30 },
      { key: 'pedir_cita', label: 'Pedir Cita', weight: 10 },
      { key: 'asistir_cita', label: 'Asistir a la cita', weight: 10 },
      { key: 'radicar', label: 'Radicar', weight: 50 },
    ]
  }
];

interface DocDetail {
    name: string;
    isUploaded: boolean;
}

interface CaseStatisticsProps {
  caseId: string;
}

export const CaseStatistics: React.FC<CaseStatisticsProps> = ({ caseId }) => {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  
  // Estado actualizado para recibir el detalle
  const [docStats, setDocStats] = useState<{
      total: number; 
      uploaded: number; 
      details: DocDetail[] 
  }>({ total: 1, uploaded: 0, details: [] });
  
  const [loading, setLoading] = useState(true);

  // 1. CARGAR DATOS
  useEffect(() => {
    api.get(`/cases/${caseId}/statistics`)
      .then((res) => {
        setChecklist(res.data.checklist);
        setDocStats(res.data.documents);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando estadísticas:", err);
        setLoading(false);
      });
  }, [caseId]);

  // 2. MANEJAR CLIC
  const handleToggle = async (key: string) => {
    const newValue = !checklist[key];
    setChecklist(prev => ({ ...prev, [key]: newValue }));

    try {
      await api.patch(`/cases/${caseId}/statistics`, { 
        activity: key, 
        value: newValue 
      });
    } catch (error) {
      console.error("Error guardando:", error);
      setChecklist(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const calculateProgress = (stage: any) => {
    let progress = 0;

    if (stage.type === 'SPECIAL_DOCS') {
      const docPercentage = (docStats.uploaded / docStats.total);
      const safeDocPercentage = isNaN(docPercentage) ? 0 : docPercentage;
      const mathScore = safeDocPercentage * 100 * 0.8; 
      
      const checkboxKey = stage.activities[0].key;
      const checkboxScore = checklist[checkboxKey] ? 20 : 0;
      progress = mathScore + checkboxScore;
    } else {
      stage.activities.forEach((act: any) => {
        if (checklist[act.key]) {
          progress += act.weight;
        }
      });
    }
    return Math.min(Math.round(progress), 100);
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100%' }}>
      <Grid container spacing={3}>
        {STAGES_CONFIG.map((stage) => {
          const progress = calculateProgress(stage);
          const isComplete = progress >= 99;

          return (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={stage.id}>
              <Paper 
                elevation={2} 
                sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column' 
                }}
              >
                {/* HEADER VERDE */}
                <Box sx={{ 
                    bgcolor: '#4CAF50', 
                    color: 'white', 
                    px: 2, 
                    py: 1.5, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {stage.title}
                  </Typography>
                  <Chip 
                    label={`${progress}%`} 
                    size="small" 
                    sx={{ 
                      bgcolor: isComplete ? 'white' : 'rgba(255,255,255,0.2)', 
                      color: isComplete ? '#4CAF50' : 'white', 
                      fontWeight: 'bold' 
                    }} 
                  />
                </Box>

                {/* BARRA PROGRESO */}
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 8, 
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': { bgcolor: '#2e7d32' }
                  }} 
                />

                {/* CONTENIDO */}
                <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  
                  {/* --- LISTA DE DOCUMENTOS (Solo para etapa Documentos) --- */}
                  {stage.type === 'SPECIAL_DOCS' && (
                    <Box sx={{ mb: 2, bgcolor: '#f1f5f9', borderRadius: 1, p: 1, maxHeight: 200, overflowY: 'auto' }}>
                      <Typography variant="caption" fontWeight="bold" sx={{ mb: 1, display: 'block', color: '#475569' }}>
                        REQUISITOS DETECTADOS ({docStats.uploaded}/{docStats.total})
                      </Typography>
                      
                      <List dense disablePadding>
                        {docStats.details && docStats.details.map((doc, idx) => (
                          <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                                {doc.isUploaded 
                                    ? <CheckCircle color="success" fontSize="small" />
                                    : <RadioButtonUnchecked color="disabled" fontSize="small" />
                                }
                            </ListItemIcon>
                            <ListItemText 
                                primary={doc.name} 
                                primaryTypographyProps={{ 
                                    variant: 'caption', 
                                    color: doc.isUploaded ? 'text.primary' : 'text.secondary',
                                    sx: { textDecoration: doc.isUploaded ? 'none' : 'none' }
                                }}
                            />
                          </ListItem>
                        ))}
                        {(!docStats.details || docStats.details.length === 0) && (
                            <Typography variant="caption" color="text.disabled" fontStyle="italic">
                                No hay requisitos de encuesta aún.
                            </Typography>
                        )}
                      </List>
                    </Box>
                  )}

                  <Divider sx={{ my: 1, opacity: 0.5 }} />

                  {/* CHECKBOXES (El resto de actividades normales) */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {stage.activities.map((act) => (
                      <FormControlLabel
                        key={act.key}
                        control={
                          <Checkbox 
                            checked={!!checklist[act.key]} 
                            onChange={() => handleToggle(act.key)}
                            color="success"
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ color: checklist[act.key] ? 'text.primary' : 'text.secondary' }}>
                            {act.label} <Typography component="span" variant="caption" color="text.disabled">({act.weight}%)</Typography>
                          </Typography>
                        }
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};