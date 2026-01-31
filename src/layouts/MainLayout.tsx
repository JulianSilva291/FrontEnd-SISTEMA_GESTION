import { type ReactNode, useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Button,
  Container,
  Menu,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ExitToApp, AdminPanelSettings, ArrowDropDown, Settings } from '@mui/icons-material';

/**
 * INTERFACE PROPS:
 * Definimos qué parámetros recibe este componente.
 * 'children' es una palabra reservada en React que representa el contenido que va DENTRO de las etiquetas.
 * Ej: <MainLayout> <Hijo /> </MainLayout>
 */
interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Función auxiliar para leer los datos del usuario desde el JWT (Token).
 * Nota: Lo ideal es hacer esto en el Backend o usar una librería como 'jwt-decode',
 * pero aquí se hace manualmente para evitar dependencias extra.
 */
const getUserFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return { name: '', role: '' };

  try {
    // Decodificación manual de Base64 (Parte 2 del JWT es el payload)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    const payload = JSON.parse(jsonPayload);

    let userRole = 'Operador';
    // Lógica para detectar el rol si viene como array o string
    if (Array.isArray(payload.roles) && payload.roles.length > 0) {
      userRole = payload.roles[0];
    } else if (payload.roles) {
      userRole = payload.roles;
    } else if (payload.role) {
      userRole = payload.role;
    }

    return {
      name: payload.fullName || payload.name || payload.email || 'Usuario',
      role: userRole
    };
  } catch (e) {
    return { name: 'Usuario', role: 'Desconocido' };
  }
};

/**
 * COMPONENTE: MainLayout
 * 
 * Plantilla maestra que envuelve a todas las páginas internas.
 * Contiene elementos fijos: Navbar (arriba) y el fondo.
 */
export const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate(); // Hook para redirigir al usuario programáticamente
  const [user, setUser] = useState({ name: 'Cargando...', role: '...' });
  const [anchorElAdmin, setAnchorElAdmin] = useState<null | HTMLElement>(null);
  const [anchorElConfig, setAnchorElConfig] = useState<null | HTMLElement>(null);

  // Handlers para el menú de ADMINISTRACIÓN (Usuarios)
  const handleOpenAdminMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElAdmin(event.currentTarget);
  };
  const handleCloseAdminMenu = () => {
    setAnchorElAdmin(null);
  };

  // Handlers para el menú de CONFIGURACIÓN (Encuestas, Estados, Tiempos)
  const handleOpenConfigMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElConfig(event.currentTarget);
  };
  const handleCloseConfigMenu = () => {
    setAnchorElConfig(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleCloseAdminMenu();
    handleCloseConfigMenu();
  };

  useEffect(() => {
    const userData = getUserFromToken();
    setUser(userData.name ? userData : { name: 'Usuario', role: 'Operador' });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token'); // Cerrar sesión es tan simple como borrar el token
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)' }}>

      {/* NAVBAR */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>

          {/* LOGO Y MENÚ IZQUIERDO */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>

            {/* LOGO */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
              <Box
                component="img"
                src="/Logo.png"
                alt="Logo"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  objectFit: 'cover'
                }}
              />
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a', display: { xs: 'none', sm: 'block' } }}>
                DYNAMIS OA S.A.S
              </Typography>
            </Box>

            {/* BOTONES DE NAVEGACIÓN */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button color="inherit" onClick={() => navigate('/dashboard')}>
                Inicio
              </Button>

              {/* Lógica de roles */}
              {user.role !== 'Operador' && (
                <>
                  {/* MENÚ ADMINISTRACIÓN */}
                  <Button
                    color="inherit"
                    endIcon={<ArrowDropDown />}
                    startIcon={<AdminPanelSettings />}
                    onClick={handleOpenAdminMenu}
                  >
                    Administración
                  </Button>
                  <Menu
                    anchorEl={anchorElAdmin}
                    open={Boolean(anchorElAdmin)}
                    onClose={handleCloseAdminMenu}
                  >
                    <MenuItem onClick={() => handleNavigate('/admin/users')}>Usuarios y Permisos</MenuItem>
                  </Menu>

                  {/* MENÚ CONFIGURACIÓN */}
                  <Button
                    color="inherit"
                    endIcon={<ArrowDropDown />}
                    startIcon={<Settings />}
                    onClick={handleOpenConfigMenu}
                  >
                    Configuración
                  </Button>
                  <Menu
                    anchorEl={anchorElConfig}
                    open={Boolean(anchorElConfig)}
                    onClose={handleCloseConfigMenu}
                  >
                    <MenuItem onClick={() => handleNavigate('/admin/survey-builder')}>Encuesta Única</MenuItem>
                    <MenuItem divider />
                    <MenuItem onClick={() => handleNavigate('/admin/states')}>Estados del Caso</MenuItem>
                    <MenuItem onClick={() => handleNavigate('/admin/times')}>Tiempos (SLA)</MenuItem>
                  </Menu>
                </>
              )}
            </Box>

          </Box>
          {/* CIERRE DE LOGO Y MENÚ IZQUIERDO */}

          {/* PERFIL Y SALIR (DERECHA) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                {user.role}
              </Typography>
            </Box>

            <Avatar sx={{ bgcolor: '#0f172a', color: 'white' }}>
              {user.name.charAt(0).toUpperCase()}
            </Avatar>

            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<ExitToApp />}
              onClick={handleLogout}
              sx={{ textTransform: 'none', fontWeight: 'bold' }}
            >
              Salir
            </Button>
          </Box>

        </Toolbar>
      </AppBar>

      {/* CONTENIDO PRINCIPAL */}
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 5 } }}>
        {children}
      </Container>
    </Box>
  );
};