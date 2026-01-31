import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  LinearProgress, 
  Chip,
  Button,
  CircularProgress
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { MainLayout } from '../layouts/MainLayout';
import { api } from '../api/axio'; 

// 1. DEFINIMOS LA INTERFAZ DE LOS DATOS QUE VIENEN DEL BACKEND
interface GlobalCaseStat {
  id: string;
  code: string;
  client: string;
  advisor: string;
  status: string;
  stageLabel: string;
  progress: number;
}

export const GlobalStatisticsPage = () => {
  const navigate = useNavigate();
  
  // 2. TIPAMOS EL ESTADO
  const [rows, setRows] = useState<GlobalCaseStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cases/global-stats')
      .then(res => {
        setRows(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // 3. CORREGIMOS EL ERROR: AGREGAMOS ": number"
  const getProgressColor = (value: number): "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    if (value < 30) return 'error';
    if (value < 70) return 'warning';
    return 'success';
  };

  if (loading) return (
    <MainLayout>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    </MainLayout>
  );

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Tablero General de Avance
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitoreo de progreso por etapas de cada caso activo.
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Código Caso</strong></TableCell>
              <TableCell><strong>Cliente</strong></TableCell>
              <TableCell><strong>Asesor</strong></TableCell>
              <TableCell><strong>Etapa Actual</strong></TableCell>
              <TableCell sx={{ width: '25%' }}><strong>Progreso de Etapa</strong></TableCell>
              <TableCell align="center"><strong>Acción</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.code}</TableCell>
                <TableCell sx={{ fontWeight: 'medium' }}>{row.client}</TableCell>
                <TableCell>{row.advisor}</TableCell>
                
                {/* Chip de Estado */}
                <TableCell>
                  <Chip 
                    label={row.stageLabel} 
                    size="small" 
                    sx={{ 
                      bgcolor: '#e8f5e9', 
                      color: '#2e7d32', 
                      fontWeight: 'bold' 
                    }} 
                  />
                </TableCell>

                {/* Barra de Progreso */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={row.progress} 
                        color={getProgressColor(row.progress)}
                        sx={{ height: 8, borderRadius: 5 }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight="bold">
                        {row.progress}%
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                {/* Botón para ir al detalle */}
                <TableCell align="center">
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Visibility />}
                    // Al dar clic, vamos al caso y forzamos la pestaña 4 (Estadísticas)
                    onClick={() => navigate(`/cases/${row.id}`, { state: { initialTab: 4 } })}
                  >
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  No hay casos activos para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </MainLayout>
  );
};