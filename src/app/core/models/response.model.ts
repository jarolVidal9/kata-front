/**
 * Modelos para el manejo de respuestas a encuestas
 */

export interface Answer {
  id: number;
  responseId: number;
  questionId: number;
  value: string;
}

export interface Response {
  id: number;
  surveyId: number;
  respondentName?: string;
  respondentEmail?: string;
  ipAddress?: string;
  createdAt: string;
  answers: Answer[];
}

/**
 * DTO para crear una respuesta a una encuesta
 */
export interface SubmitResponseRequest {
  surveyId: number;
  respondentName?: string;
  respondentEmail?: string;
  answers: CreateAnswerRequest[];
}

/**
 * DTO para cada respuesta individual a una pregunta
 */
export interface CreateAnswerRequest {
  questionId: number;
  value: string;
}

/**
 * Interfaz para el formulario de respuesta (uso interno del componente)
 */
export interface QuestionAnswer {
  questionId: number;
  questionTitle: string;
  questionType: 'TEXT' | 'TEXTAREA' | 'RADIO' | 'CHECKBOX' | 'SELECT';
  required: boolean;
  options?: string[];
  
  // Valores del formulario
  textValue?: string;
  selectedOption?: string;
  selectedOptions?: string[];  // Para checkbox (múltiple selección)
}
