import { useState, useEffect, useCallback } from 'react';
import { type Case } from '../types/case';
import { CaseService, type DashboardStats } from '../services/case.service';

/**
 * CUSTOM HOOK: useDashboard
 * 
 * En React, un Custom Hook es una función que encapsula lógica reutilizable (que no es UI).
 * Aquí centralizamos la carga de datos del Dashboard para que la Vista (Dashboard.tsx)
 * sea más limpia y solo se encargue de mostrar (renderizar) los datos.
 */
export const useDashboard = () => {
    // STATE (Estado): Variables que React "observa". Si cambian, se repinta la pantalla.
    const [cases, setCases] = useState<Case[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        activeCases: 0,
        pendingDocuments: 0,
        upcomingExpirations: 0,
        closedMonth: 0
    });
    const [loading, setLoading] = useState(true); // Controla el spinner de carga
    const [error, setError] = useState('');

    /**
     * useCallback: Memoriza esta función para que no se re-cree en cada render.
     * Es buena práctica cuando la función se usa dentro de un useEffect.
     */
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // Promise.all: Ejecuta ambas peticiones en PARALELO para ser más rápido
            const [casesData, statsData] = await Promise.all([
                CaseService.getAll(),
                CaseService.getStats()
            ]);

            setCases(casesData);
            setStats(statsData);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Error conectando al servidor.');
        } finally {
            // finally siempre se ejecuta, haya error o no (apaga el spinner)
            setLoading(false);
        }
    }, []);

    /**
     * useEffect: Efecto Secundario.
     * Se ejecuta cuando el componente se MONTA (nace) por primera vez, 
     * gracias al array de dependencias [fetchData] (o [] si estuviera vacía).
     * Equivale a "ngOnInit" en Angular o "OnLoad".
     */
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // El Hook devuelve los datos y funciones que la Vista necesita usar
    return {
        cases,
        stats,
        loading,
        error,
        refreshDashboard: fetchData // Exponemos la función por si queremos recargar manualment
    };
};
