import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Link
} from '@mui/material';
import {
  PersonOutline,
  VpnKeyOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axio';

const LOGO_URL = "/Logo.png";

/**
 * PÁGINA: Login
 * 
 * Es la primera pantalla que ve el usuario.
 * Concepto de "Controlled Components": Los inputs (email, password) están
 * atados a variables de estado (useState). Si cambia el estado, cambia el input y viceversa.
 */
export const Login = () => {
  const navigate = useNavigate(); // Hook para navegar sin recargar la página

  // VARIABLES DE ESTADO (State)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estado para manejar feedback visual (si hubo error al loguearse)
  const [error, setError] = useState(false);

  /**
   * Enviamos los datos al Backend.
   * "async/await" nos permite esperar la respuesta del servidor antes de continuar.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que se recargue la página al enviar el form
    setError(false);
    try {
      // POST: Enviamos credenciales
      const response = await api.post('/auth/login', { email, password });

      // Si llegamos aquí, el login fue exitoso. Guardamos el token en "LocalStorage" del navegador.
      localStorage.setItem('token', response.data.accessToken);

      // Redirigimos al Panel Principal
      navigate('/dashboard');
    } catch (err) {
      // Si falla (ej. 401 Unauthorized), mostramos el mensaje de error
      setError(true);
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #eff6ff 0%, #1e293b 100%)',
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 5,
          width: '100%',
          maxWidth: 400,
          borderRadius: 5,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
          <img
            src={LOGO_URL}
            alt="DYNAMIS OA S.A.S"
            style={{ height: 80, objectFit: 'contain' }}
          />
        </Box>

        <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
          DYNAMIS OA S.A.S
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>

          <Box sx={{ textAlign: 'left', mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Login</Typography>
            <TextField
              fullWidth
              placeholder="Escribe tu correo Electronico"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
          </Box>

          <Box sx={{ textAlign: 'left', mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Password</Typography>
            <TextField
              fullWidth
              type="password"
              placeholder="Escribe tu contraseña"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKeyOutlined />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Link href="#" underline="hover" color="inherit" variant="body2">
              ¿Olvidaste Contraseña?
            </Link>
          </Box>

          {/* 3. AQUÍ MOSTRAMOS EL MENSAJE DE ERROR SI EXISTE */}
          {error && (
            <Typography
              color="error"
              variant="body2"
              sx={{ mb: 2, fontWeight: 'bold' }}
            >
              correo o contraseña incorrecta
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              background: 'linear-gradient(90deg, #3b82f6 0%, #1e40af 100%)',
              '&:hover': {
                opacity: 0.9
              }
            }}
          >
            INICIAR SESION
          </Button>

        </Box>
      </Paper>
    </Box>
  );
};