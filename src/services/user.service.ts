import { api } from '../api/axio';
import type { User, CreateUserPayload, UserPermissions } from '../types/user';

/**
 * INTERFACES DEL BACKEND (DTOs)
 * Definimos cómo llegan los datos del servidor para no contaminar los tipos del Frontend.
 */
interface BackendUser {
    id: string;
    fullName: string;
    email: string;
    role: 'ADMINISTRADOR' | 'SUPERVISOR' | 'OPERADOR';
    isActive: boolean;
    permissions: string[]; // ['MANAGE_TIME', 'MANAGE_SURVEY', ...]
    lastLogin?: string;
}

/**
 * ADAPTADORES (Mappers)
 */
const PERMISSION_MAP: Record<string, keyof UserPermissions> = {
    'MANAGE_TIME': 'canManageTimes',
    'MANAGE_SURVEY': 'canEditSurveys',
    'VIEW_ADMIN_STATS': 'canViewGlobalStats',
    'MANAGE_USERS': 'canManageUsers'
};

// Invertimos el mapa para usarlo al enviar al backend
const REVERSE_PERMISSION_MAP: Record<string, string> = Object.entries(PERMISSION_MAP).reduce((acc, [back, front]) => {
    acc[front] = back;
    return acc;
}, {} as Record<string, string>);

/**
 * Convierte el usuario del Backend (Array de strings) al Frontend (Objeto de booleans)
 */
const mapBackendUserToFrontend = (backendUser: BackendUser): User => {
    const permissions: UserPermissions = {
        canManageTimes: false,
        canEditSurveys: false,
        canViewGlobalStats: false,
        canManageUsers: false
    };

    if (backendUser.permissions) {
        backendUser.permissions.forEach(p => {
            const frontendKey = PERMISSION_MAP[p];
            if (frontendKey) {
                permissions[frontendKey] = true;
            }
        });
    }

    return {
        id: backendUser.id,
        fullName: backendUser.fullName,
        email: backendUser.email,
        role: backendUser.role,
        isActive: backendUser.isActive,
        permissions: permissions,
        lastLogin: backendUser.lastLogin
    };
};

/**
 * Convierte el payload del Frontend al formato que espera el Backend
 */
const mapFrontendToBackendPayload = (user: CreateUserPayload | Partial<User>) => {
    const payload: any = { ...user };

    // Si viene permissions, lo transformamos a array de strings
    if (user.permissions) {
        const permissionsArray: string[] = [];
        (Object.keys(user.permissions) as Array<keyof UserPermissions>).forEach(key => {
            if (user.permissions![key]) {
                const backendKey = REVERSE_PERMISSION_MAP[key];
                if (backendKey) permissionsArray.push(backendKey);
            }
        });
        payload.permissions = permissionsArray;
    }

    return payload;
};

export const UserService = {
    getAll: async (): Promise<User[]> => {
        try {
            const { data } = await api.get<BackendUser[]>('/users');
            return data.map(mapBackendUserToFrontend);
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    create: async (user: CreateUserPayload): Promise<User> => {
        try {
            const backendPayload = mapFrontendToBackendPayload(user);
            const { data } = await api.post<BackendUser>('/users', backendPayload);
            return mapBackendUserToFrontend(data);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    update: async (id: string, user: Partial<User>): Promise<User> => {
        try {
            const backendPayload = mapFrontendToBackendPayload(user);
            const { data } = await api.patch<BackendUser>(`/users/${id}`, backendPayload);
            return mapBackendUserToFrontend(data);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            await api.delete(`/users/${id}`);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
};
