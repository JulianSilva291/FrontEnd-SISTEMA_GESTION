import { api } from '../api/axio';


export interface DashboardStats {
    activeCases: number;
    pendingDocuments: number;
    upcomingExpirations: number;
    closedMonth: number;
}

/**
 * SERVICIO: CaseService
 * 
 * Patrón "Service Layer":
 * Separamos la lógica de llamadas a la API de la interfaz de usuario (Componentes).
 * Los componentes solo llaman a estas funciones (ej. `getAll()`) y no se preocupan por URLs o Axios.
 */
export const CaseService = {
    /**
     * Obtiene todos los casos del sistema.
     * @returns {Promise<Case[]>}
     */
    getAll: async () => {
        // Hace un GET a /cases (gracias a la baseURL en api/axio.ts)
        const response = await api.get('/cases');
        // Validación defensiva: asegura que siempre devolvamos un Array
        return Array.isArray(response.data) ? response.data : (response.data as any).data || [];
    },

    /**
     * Obtiene las estadísticas numéricas para el Dashboard.
     * @returns {Promise<DashboardStats>}
     */
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/cases/dashboard-stats');
        return response.data;
    },

    /**
     * Busca un único caso por su ID.
     * @param {string} id - Identificador único del caso
     */
    getById: async (id: string) => {
        const response = await api.get(`/cases/${id}`);
        return response.data;
    },

    // Future methods can be added here (create, update, delete)
};
