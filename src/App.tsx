import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DocumentsManager } from './pages/DocumentsManager';
import { CaseDetail } from './pages/CaseDetail';
import { GlobalStatisticsPage } from './pages/GlobalStaticsPage';
import { GlobalTimesPage } from './pages/GlobalTimesPage';
import { MainLayout } from './layouts/MainLayout';
import { StatesAdminPage } from './pages/Admin/StatesAdminPage';
import { SurveyConfigEditor } from './pages/Admin/SurveyConfigEditor'; // [NEW]
import { AdminUsersPage } from './pages/Admin/AdminUsersPage'; // [NEW]

/**
 * COMPONENTE PRINCIPAL: App
 * 
 * Este es el punto de entrada de la navegación.
 * Define qué "Página" se muestra según la URL que escriba el usuario.
 */
function App() {
  return (
    // BrowserRouter: Habilita el sistema de rutas en toda la app
    <BrowserRouter>
      {/* Routes: Contenedor que busca la primera ruta que coincida con la URL */}
      <Routes>

        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />

        {/* Redirección por defecto: Si entra a raíz "/", lo mandamos al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas Principales */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents" element={<DocumentsManager />} />

        {/* Ruta Dinámica: :id representa el número del caso (ej. /cases/123) */}
        <Route path="/cases/:id" element={<CaseDetail />} />

        {/* Estadísticas Globales */}
        <Route path="/estadisticas" element={<GlobalStatisticsPage />} />

        {/* --- MÓDULOS ADMINISTRATIVOS --- */}

        {/* 1. Admin Estados (El componente ya incluye el MainLayout por dentro) */}
        <Route path="/admin/states" element={<StatesAdminPage />} />

        {/* 2. Gestión de Tiempos (Este componente parece requerir el Layout aquí) */}
        <Route
          path="/admin/times"
          element={
            <MainLayout>
              <GlobalTimesPage />
            </MainLayout>
          }
        />

        {/* 3. Constructor de Encuestas */}
        <Route path="/admin/survey-builder" element={<SurveyConfigEditor />} />

        {/* 4. Gestión de Usuarios */}
        <Route path="/admin/users" element={<AdminUsersPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;