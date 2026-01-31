import axios from 'axios';

/**
 * Instancia de Axios pre-configurada para la API del Backend.
 * 
 * CONCEPTOS CLAVE:
 * - Axios: Librería estándar para hacer peticiones HTTP (get, post, put, delete).
 * - baseURL: Define la raíz de todas las peticiones (e.g. http://localhost:3000/api).
 *   Esto evita tener que escribir la URL completa en cada petición.
 */
export const api = axios.create({
  // import.meta.env accede a variables de entorno en Vite (ver archivo .env)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

/**
 * INTERCEPTOR DE PETICIONES (REQUEST)
 * 
 * Se ejecuta ANTES de que cualquier petición salga hacia el servidor.
 * 
 * Uso común: Inyectar el Token de Autorización (JWT) en los headers.
 * Así, el backend sabe quién es el usuario que hace la petición.
 */
api.interceptors.request.use(
  (config) => {
    // 1. Buscamos el token guardado en el navegador (LocalStorage)
    const token = localStorage.getItem('token');

    // 2. Si existe, lo agregamos al Header 'Authorization'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * INTERCEPTOR DE RESPUESTAS (RESPONSE)
 * 
 * Se ejecuta cuando el servidor responde, ANTES de que la promesa llegue a nuestro código.
 * 
 * Uso común: Manejar errores globales, como cuando la sesión expira (401).
 */
api.interceptors.response.use(
  (response) => response, // Si todo sale bien, solo pasa la respuesta
  (error) => {
    // Si el error es 401 (No Autorizado), significa que el token venció o es inválido
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token'); // Borramos el token malo
      window.location.href = '/login';  // Redirigimos al Login forzosamente
    }
    return Promise.reject(error);
  }
);