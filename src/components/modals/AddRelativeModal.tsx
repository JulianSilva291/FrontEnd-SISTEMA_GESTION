import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Typography, Divider 
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { PersonAdd, Edit } from '@mui/icons-material';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  initialData?: any;
}

const RELATIONSHIPS = ['Conyuge', 'Hijo', 'Padre', 'Hermano', 'Otro'];

export const AddRelativeModal: React.FC<Props> = ({ open, onClose, onConfirm, initialData }) => {
  
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    relationship: '', 
    age: '',
    identification: '',
    // Nuevos campos
    phone: '',
    email: '',
    address: '',
    pob: ''
  });

  // Efecto para cargar datos si es edición
  useEffect(() => {
    if (open) {
        if (initialData) {
            setFormData({
                firstName: initialData.firstName || '',
                lastName: initialData.lastName || '',
                relationship: initialData.relationship || '',
                age: initialData.age || '',
                identification: initialData.identification || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                address: initialData.address || '',
                pob: initialData.pob || ''
            });
        } else {
            // Limpiar si es nuevo
            setFormData({ 
                firstName: '', lastName: '', relationship: '', age: '', identification: '',
                phone: '', email: '', address: '', pob: ''
            });
        }
    }
  }, [open, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (formData.firstName && formData.relationship) {
        const payload = {
            ...formData,
            age: formData.age ? parseInt(formData.age.toString()) : null
        };
        onConfirm(payload);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc' }}>
        {initialData ? <Edit color="primary"/> : <PersonAdd color="primary" />} 
        {initialData ? 'Editar Familiar' : 'Agregar Familiar'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 1 }}>
            
            {/* --- SECCIÓN 1: DATOS BÁSICOS --- */}
            <Grid size={{ xs: 12 }}><Typography variant="caption" fontWeight="bold" color="text.secondary">DATOS PERSONALES</Typography></Grid>
            
            <Grid size={{ xs: 12, md: 6 }}> 
                <TextField fullWidth label="Nombres" name="firstName" value={formData.firstName} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Apellidos" name="lastName" value={formData.lastName} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="No. Identificación" name="identification" value={formData.identification} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Edad" name="age" type="number" value={formData.age} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <TextField select fullWidth label="Parentesco" name="relationship" value={formData.relationship} onChange={handleChange}>
                    {RELATIONSHIPS.map((rel) => <MenuItem key={rel} value={rel}>{rel}</MenuItem>)}
                </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /></Grid>

            {/* --- SECCIÓN 2: CONTACTO --- */}
            <Grid size={{ xs: 12 }}><Typography variant="caption" fontWeight="bold" color="text.secondary">INFORMACIÓN DE CONTACTO (NUEVO)</Typography></Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Teléfono / Celular" name="phone" value={formData.phone} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Correo Electrónico" name="email" value={formData.email} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Dirección Residencia" name="address" value={formData.address} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Lugar de Nacimiento" name="pob" value={formData.pob} onChange={handleChange} />
            </Grid>

        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
            {initialData ? 'Guardar Cambios' : 'Agregar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};