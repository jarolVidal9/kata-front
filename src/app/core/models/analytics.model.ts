/**
 * Modelos para analytics y estadísticas de encuestas
 */

export interface QuestionAnalytics {
  questionId: number;
  questionTitle: string;
  questionType: 'TEXT' | 'TEXTAREA' | 'RADIO' | 'CHECKBOX' | 'SELECT';
  totalAnswers: number;
  answers: string[];
}

export interface SurveyAnalytics {
  survey: {
    id: number;
    title: string;
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  };
  totalResponses: number;
  analytics: QuestionAnalytics[];
}

/**
 * Datos procesados para visualización de opciones
 */
export interface OptionCount {
  option: string;
  count: number;
  percentage: number;
}

/**
 * Respuesta individual completa
 */
export interface ResponseDetail {
  id: number;
  surveyId: number;
  respondentName?: string;
  respondentEmail?: string;
  ipAddress?: string;
  createdAt: string;
  answers: {
    id: number;
    questionId: number;
    value: string;
    question: {
      id: number;
      title: string;
      type: string;
    };
  }[];
}
