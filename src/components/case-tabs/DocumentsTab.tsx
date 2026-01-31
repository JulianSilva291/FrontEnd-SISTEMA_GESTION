import React, { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Button, TableContainer, Paper, Table, TableHead,
    TableRow, TableCell, TableBody, Chip, Tooltip, IconButton, CircularProgress,
    Divider, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import {
    CloudUpload, Visibility, CheckCircle, Description, Delete as DeleteIcon, AddCircleOutline, Edit as EditIcon
} from '@mui/icons-material';
import { api } from '../../api/axio';
import type { Case, SurveyAnswers } from '../../types/case';
// import { DocumentGenerator } from './DocumentGenerator'; // Removed as per request

// ...
{/* 1. SECCIÓN DE GENERACIÓN (MOVIDA A FAMILIARES) */ }
{/* <DocumentGenerator ... /> Eliminated */ }
const ADDITIONAL_DOC_OPTS = [
    "Cédula de Ciudadanía (Ambas caras)",
    "Copia del RUT",
    "Poder de Representación Firmado",
    "Certificado Laboral",
    "Certificado de Libertad y Tradición",
    "Tarjeta de Propiedad del Vehículo",
    "Relación de Inventario de Bienes",
    "Desprendibles de Nómina",
    "Registro Civil de Nacimiento",
    "Registro Civil de Matrimonio",
    "Registro Civil de Defunción",
    "Declaración Extrajuicio de Convivencia",
    "Registro de Matrimonio / Prueba Unión (Fallecido)",
    "Copia de Escritura Pública del Testamento",
    "Certificado Bancario de Saldos",
    "Póliza de Seguro",
    "Acta de Conciliación / Resolución",
    "Medida de Protección / Denuncia",
    "Copia de la Denuncia (Fiscalía)",
    "Sentencia Judicial",
    "Copia del Contrato (Laboral/Arrendamiento)",
    "Copia del Título Valor Original",
    "Carta de Despido",
    "Impresión de Pantallazos o Correos",
    "Otro Documento"
];

interface DocumentsTabProps {
    caseData: Case;
    surveyAnswers: SurveyAnswers;
    onUpdate?: () => void;
}

export const DocumentsTab = ({ caseData, surveyAnswers, onUpdate }: DocumentsTabProps) => {

    const [localDocuments, setLocalDocuments] = useState<any[]>(caseData.documents || []);
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

    // --- ESTADOS PARA EL MODAL DE CARGA MANUAL ---
    const [openModal, setOpenModal] = useState(false);
    const [manualType, setManualType] = useState('');
    const [manualFile, setManualFile] = useState<File | null>(null);
    const [isManualUploading, setIsManualUploading] = useState(false);

    useEffect(() => {
        if (caseData.documents) {
            setLocalDocuments(caseData.documents);
        }
    }, [caseData.documents]);

    // --- LÓGICA DE DOCUMENTOS REQUERIDOS ---
    const requiredDocs = useMemo(() => {
        const docs: { id: number; name: string; required: boolean }[] = [];
        let idCounter = 1;
        const addDoc = (name: string) => docs.push({ id: idCounter++, name, required: true });

        if (surveyAnswers.hasId === 'si') addDoc('Cédula de Ciudadanía (Ambas caras)');
        if (surveyAnswers.hasRut === 'si') addDoc('Copia del RUT');
        if (surveyAnswers.hasJob === 'si') addDoc('Certificado Laboral (< 30 días)');
        if (surveyAnswers.hasProperties === 'si') addDoc('Certificado de Libertad y Tradición');
        if (surveyAnswers.hasVehicle === 'si') addDoc('Tarjeta de Propiedad del Vehículo');
        if (surveyAnswers.needsPower === 'si') addDoc('Poder de Representación Firmado');

        if (surveyAnswers.relationshipType === 'casado') addDoc('Registro Civil de Matrimonio');
        if (surveyAnswers.relationshipType === 'union_libre') addDoc('Declaración Extrajuicio de Convivencia');
        if (surveyAnswers.hasMinorChildren === 'si') addDoc('Registros Civiles de Nacimiento (Hijos Menores)');
        if (surveyAnswers.hasAdultChildren === 'si') addDoc('Registros Civiles de Nacimiento (Hijos Mayores)');
        if (surveyAnswers.sharedAssets === 'si') addDoc('Relación de Inventario de Bienes');
        if (surveyAnswers.hasAgreement === 'si') addDoc('Acta de Conciliación / Resolución');
        if (surveyAnswers.hasViolence === 'si') addDoc('Medida de Protección / Denuncia');

        if (surveyAnswers.hasDeathCert === 'si') addDoc('Registro Civil de Defunción');
        if (surveyAnswers.hasWill === 'si') addDoc('Copia de Escritura Pública del Testamento');
        if (surveyAnswers.deceasedMarital === 'si') addDoc('Registro de Matrimonio / Prueba Unión (Fallecido)');
        if (surveyAnswers.hasOtherHeirs === 'si') addDoc('Registros Civiles de los Herederos');
        if (surveyAnswers.hasBankAccounts === 'si') addDoc('Certificado Bancario de Saldos');
        if (surveyAnswers.hasInsurance === 'si') addDoc('Póliza de Seguro');

        if (surveyAnswers.hasContract === 'si') addDoc('Copia del Contrato (Laboral/Arrendamiento)');
        if (surveyAnswers.debtTitle === 'si') addDoc('Copia del Título Valor Original');
        if (surveyAnswers.hasEvidence === 'si') addDoc('Impresión de Pantallazos o Correos');
        if (surveyAnswers.hasTermination === 'si') addDoc('Carta de Despido');
        if (surveyAnswers.hasPayStubs === 'si') addDoc('Desprendibles de Nómina');
        if (surveyAnswers.hasPoliceReport === 'si') addDoc('Copia de la Denuncia (Fiscalía)');

        return docs;
    }, [surveyAnswers]);

    // --- FILTROS ---
    const generatedDocs = useMemo(() => {
        return localDocuments.filter(doc => ['PODER', 'CONTRATO', 'CARTA'].includes(doc.type));
    }, [localDocuments]);

    const additionalUploadedDocs = useMemo(() => {
        const requiredNames = requiredDocs.map(d => d.name);
        return localDocuments.filter(doc =>
            !['PODER', 'CONTRATO', 'CARTA'].includes(doc.type) &&
            !requiredNames.includes(doc.name)
        );
    }, [localDocuments, requiredDocs]);


    // --- FUNCIONES DE SUBIDA ---
    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, docName: string) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await uploadToBackend(file, docName);
    };

    const handleManualSubmit = async () => {
        if (!manualFile || !manualType) return;
        setIsManualUploading(true);
        await uploadToBackend(manualFile, manualType);
        setIsManualUploading(false);
        setOpenModal(false);
        setManualFile(null);
        setManualType('');
    };

    const uploadToBackend = async (file: File, docName: string) => {
        if (file.size > 5 * 1024 * 1024) {
            alert("El archivo es demasiado grande (Máx 5MB)");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('docName', docName);

        setUploadingDoc(docName);

        try {
            const response = await api.post(`/cases/${caseData.id}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Creamos objeto del nuevo documento
            const newDoc = {
                id: response.data.id || Date.now(),
                name: docName,
                status: 'UPLOADED',
                path: response.data.path,
                type: 'UPLOADED'
            };

            // ACTUALIZAMOS ESTADO: Filtramos el anterior (si existía) y agregamos el nuevo
            setLocalDocuments(prev => [
                ...prev.filter(d => d.name !== docName && d.id !== newDoc.id),
                newDoc
            ]);

            if (onUpdate) onUpdate();

        } catch (error) {
            console.error("Error subiendo archivo", error);
            alert("Error al subir el documento. Intente nuevamente.");
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleView = (path: string | undefined) => {
        if (!path) return;
        let cleanPath = path;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        if (path.includes('uploads')) {
            const parts = path.split('uploads');
            if (parts.length > 1) cleanPath = '/uploads' + parts[1];
        }
        cleanPath = cleanPath.replace(/\\/g, '/');
        if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;
        const fullUrl = `${baseUrl}${cleanPath}`;
        window.open(fullUrl, '_blank');
    };

    const handleDelete = async (docId: string) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este documento?")) return;
        try {
            await api.delete(`/documents/${docId}`);
            setLocalDocuments(prev => prev.filter(d => d.id !== docId));
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar el documento.");
        }
    };

    return (
        <Box sx={{ p: 3 }}>

            {/* 1. SECCIÓN DE GENERACIÓN (MOVIDA A FAMILIARES) */}

            {/* 2. BORRADORES GENERADOS */}
            {generatedDocs.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                        Borradores Generados (Disponibles para descarga)
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#e3f2fd' }}>
                                <TableRow>
                                    <TableCell><strong>Documento</strong></TableCell>
                                    <TableCell><strong>Fecha</strong></TableCell>
                                    <TableCell align="center"><strong>Acción</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {generatedDocs.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Description color="action" fontSize="small" />
                                            {doc.originalName || doc.name}
                                        </TableCell>
                                        <TableCell>
                                            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Hoy'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Ver">
                                                <IconButton color="primary" onClick={() => handleView(doc.path || doc.url)}>
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            {/* Los borradores generados también se pueden borrar si se quiere regenerar */}
                                            <Tooltip title="Eliminar">
                                                <IconButton color="error" onClick={() => handleDelete(doc.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Divider sx={{ my: 4 }} />
                </Box>
            )}

            {/* 3. SECCIÓN DE EXPEDIENTE DIGITAL */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                    Expediente Digital ({requiredDocs.length} Requeridos)
                </Typography>

                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddCircleOutline />}
                    onClick={() => setOpenModal(true)}
                    size="small"
                >
                    Agregar Documento Adicional
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell><strong>Documento</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acción</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* A. REQUERIDOS */}
                        {requiredDocs.map((doc) => {
                            const uploaded = localDocuments.find(d => d.name === doc.name);
                            const isUploading = uploadingDoc === doc.name;
                            return (
                                <TableRow key={doc.id}>
                                    <TableCell>
                                        {doc.name}
                                        {doc.required && <Chip label="Requerido" color="warning" size="small" sx={{ ml: 1, fontSize: '0.6rem', height: 20 }} />}
                                    </TableCell>
                                    <TableCell>
                                        {uploaded ? <Chip icon={<CheckCircle />} label="Cargado" color="success" size="small" /> : <Chip label="Pendiente" size="small" />}
                                    </TableCell>
                                    <TableCell align="center">
                                        {isUploading ? <CircularProgress size={24} /> : uploaded ? (
                                            <>
                                                {/* BOTÓN 1: VER */}
                                                <Tooltip title="Ver Documento">
                                                    <IconButton color="primary" onClick={() => handleView(uploaded.path || uploaded.url)}>
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>

                                                {/* BOTÓN 2: EDITAR / REEMPLAZAR (NUEVO) */}
                                                <Tooltip title="Reemplazar archivo (Editar)">
                                                    <IconButton component="label" color="primary">
                                                        <EditIcon />
                                                        <input
                                                            type="file"
                                                            hidden
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => handleUpload(e, doc.name)}
                                                        />
                                                    </IconButton>
                                                </Tooltip>

                                                {/* BOTÓN 3: ELIMINAR */}
                                                <Tooltip title="Eliminar">
                                                    <IconButton color="error" onClick={() => handleDelete(uploaded.id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        ) : (
                                            <Button component="label" size="small" startIcon={<CloudUpload />}>
                                                Subir
                                                <input type="file" hidden onChange={(e) => handleUpload(e, doc.name)} accept=".pdf,.jpg,.png" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {/* B. ADICIONALES */}
                        {additionalUploadedDocs.map((doc, index) => (
                            <TableRow key={doc.id || index} sx={{ bgcolor: '#f1f8e9' }}>
                                <TableCell>
                                    {doc.name}
                                    <Chip label="Adicional" color="info" size="small" sx={{ ml: 1, fontSize: '0.6rem', height: 20 }} />
                                </TableCell>
                                <TableCell>
                                    <Chip icon={<CheckCircle />} label="Cargado" color="success" size="small" />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Ver">
                                        <IconButton onClick={() => handleView(doc.path || doc.url)} color="primary"><Visibility /></IconButton>
                                    </Tooltip>

                                    {/* EDITAR TAMBIÉN EN ADICIONALES */}
                                    <Tooltip title="Reemplazar archivo">
                                        <IconButton component="label" color="primary">
                                            <EditIcon />
                                            <input
                                                type="file"
                                                hidden
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleUpload(e, doc.name)}
                                            />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Eliminar">
                                        <IconButton onClick={() => handleDelete(doc.id)} color="error"><DeleteIcon /></IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 4. MODAL DE AGREGAR ADICIONAL */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Agregar Documento Adicional</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Seleccione el tipo de documento y suba el archivo correspondiente.
                        </Typography>

                        <FormControl fullWidth>
                            <InputLabel>Tipo de Documento</InputLabel>
                            <Select
                                value={manualType}
                                label="Tipo de Documento"
                                onChange={(e) => setManualType(e.target.value)}
                            >
                                {ADDITIONAL_DOC_OPTS.map((opt) => (
                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{ height: 56, borderStyle: 'dashed' }}
                            startIcon={manualFile ? <CheckCircle color="success" /> : <CloudUpload />}
                        >
                            {manualFile ? manualFile.name : "Seleccionar Archivo (PDF, JPG, PNG)"}
                            <input
                                type="file"
                                hidden
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                            />
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)} color="inherit">Cancelar</Button>
                    <Button
                        onClick={handleManualSubmit}
                        variant="contained"
                        disabled={!manualType || !manualFile || isManualUploading}
                    >
                        {isManualUploading ? "Subiendo..." : "Guardar Documento"}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};