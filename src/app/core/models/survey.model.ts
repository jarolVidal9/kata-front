export interface Question {
  id: number;
  surveyId: number;
  title: string;
  type: 'TEXT' | 'TEXTAREA' | 'RADIO' | 'CHECKBOX' | 'SELECT';
  options: string | null;
  order: number;
  required: boolean;
}

export interface Creator {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Survey {
  id: number;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  createdBy: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];  // Opcional: solo viene en detalle, no en listado
  creator: Creator;
  questionsCount?: number;  // Contador de preguntas
  responsesCount?: number;  // Contador de respuestas
}

export interface CreateSurveyRequest {
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  expiresAt?: string;
  questions: CreateQuestionRequest[];
}

export interface CreateQuestionRequest {
  title: string;
  type: 'TEXT' | 'TEXTAREA' | 'RADIO' | 'CHECKBOX' | 'SELECT';
  options?: string[];  // Array de strings, el backend lo convierte a JSON
  order: number;
  required: boolean;
}

export interface UpdateSurveyRequest {
  title?: string;
  description?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  expiresAt?: string;
  questions?: CreateQuestionRequest[];  // Incluir preguntas en update
}
