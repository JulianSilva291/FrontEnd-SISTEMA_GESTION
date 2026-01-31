import { api } from '../api/axio';
import type { SurveyConfig } from '../types/survey';

export const SurveyService = {
    /**
     * Obtiene la lista de preguntas.
     * Ajustado para consumir GET /api/surveys
     */
    getSurveyConfig: async (): Promise<SurveyConfig> => {
        try {
            // 1. Obtenemos el array crudo del backend
            const { data } = await api.get<any[]>('/surveys');

            // 2. Extraemos todas las preguntas de todas las secciones
            // Estructura esperada data: [{ title: '...', questions: [...] }, ...]
            const allQuestions = data.flatMap((section: any) => section.questions || []);

            // 3. ADAPTADOR: Transformamos el Array en el Objeto SurveyConfig
            return {
                title: data[0]?.title || "Información General y Familiar",
                description: "Encuesta dinámica de producción",
                questions: allQuestions.map((q: any) => ({
                    ...q,
                    // Aseguramos compatibilidad si el back manda 'statement' pero front usaba 'title' antes
                    statement: q.statement || q.title,
                    inputType: mapBackendTypeToFrontend(q.inputType || q.type), // Adapter
                }))
            };
        } catch (error) {
            console.error('Error obteniendo la encuesta:', error);
            throw error;
        }
    },

    /**
     * Guarda la configuración.
     * Ajustado para consumir POST /api/surveys
     * NOTA: Verifica si tu backend soporta recibir TODAS las preguntas de golpe.
     */
    saveSurveyConfig: async (config: SurveyConfig): Promise<void> => {
        try {
            // Enviamos solo el array de preguntas al endpoint de estructura
            // Verificado en backend: SurveysController @Put('structure') recibe UpdateQuestionDto[]
            await api.put('/surveys/structure', config.questions);
        } catch (error) {
            console.error('Error guardando la encuesta:', error);
            throw error;
        }
    },

    /**
     * Guarda la configuración de una pregunta específica.
     * Consumido por el modal de edición de preguntas.
     */
    saveQuestionConfig: async (questionId: string, config: any): Promise<void> => {
        try {
            // Mapea los datos si es necesario, pero asumimos que el componente manda la estructura correcta
            await api.patch(`/surveys/questions/${questionId}`, config);
        } catch (error) {
            console.error(`Error guardando la pregunta ${questionId}:`, error);
            throw error;
        }
    }
};

// Función helper para mapear tipos del backend al frontend
function mapBackendTypeToFrontend(backendType: string): string {
    switch (backendType) {
        case 'SINGLE_CHOICE':
        case 'MULTIPLE_CHOICE': // Si quisieras manejar multi-select igual
            return 'SELECT';
        case 'YES_NO':
            return 'BOOLEAN';
        default:
            return backendType; // TEXT, NUMBER, DATE, BOOLEAN pasan igual
    }
}