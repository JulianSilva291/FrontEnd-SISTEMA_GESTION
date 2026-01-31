export type InputType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'BOOLEAN';

export interface SurveyCondition {
    id: string;
    requiredDocumentType?: string; // El ID o código del documento requerido
    // Otras reglas futuras
}

export interface SurveyOption {
    id: string;
    label: string;
    value: string;
    order: number;
    conditions?: SurveyCondition[]; // ✅ Relación con condiciones
    // Compatibility helpers for frontend if needed, otherwise rely on conditions
    requiredDocumentId?: string; // Optional/Deprecated in favor of conditions
}

export interface SurveyQuestion {
    id: string;
    statement: string; // Título de la pregunta
    inputType: InputType;
    required: boolean;
    order: number;
    options?: SurveyOption[]; // ✅ Ahora es opcional pero tipado
    activationOptionId?: string; // Para lógica padre-hijo
    sectionId?: string;

    // Compatibility alias if needed during refactor, strictly mapped to statement in UI
    title?: string;
}

export interface SurveyConfig {
    id?: string;
    title: string;
    description?: string;
    questions: SurveyQuestion[];
    isActive?: boolean;
}
