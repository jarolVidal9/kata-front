import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Response, SubmitResponseRequest } from '../models/response.model';
import { SurveyAnalytics } from '../models/analytics.model';

/**
 * Servicio para gestionar respuestas a encuestas
 * Single Responsibility: Maneja únicamente la comunicación HTTP relacionada con respuestas
 */
@Injectable({
  providedIn: 'root'
})
export class ResponseService {
  private readonly API_URL = `${environment.apiUrl}/responses`;

  constructor(private http: HttpClient) {}

  /**
   * Envía una respuesta a una encuesta pública
   * @param data Datos de la respuesta incluyendo answers
   * @returns Observable con la respuesta creada
   */
  submitResponse(data: SubmitResponseRequest): Observable<Response> {
    return this.http.post<Response>(`${this.API_URL}/submit`, data);
  }

  /**
   * Obtiene todas las respuestas de una encuesta (requiere autenticación)
   * @param surveyId ID de la encuesta
   * @returns Observable con array de respuestas
   */
  getResponsesBySurvey(surveyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/survey/${surveyId}`);
  }

  /**
   * Obtiene una respuesta por ID (requiere autenticación)
   * @param id ID de la respuesta
   * @returns Observable con la respuesta
   */
  getResponseById(id: number): Observable<Response> {
    return this.http.get<Response>(`${this.API_URL}/${id}`);
  }

  /**
   * Elimina una respuesta (requiere autenticación)
   * @param id ID de la respuesta
   * @returns Observable vacío
   */
  deleteResponse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  /**
   * Obtiene analytics de una encuesta (requiere autenticación)
   * @param surveyId ID de la encuesta
   * @returns Observable con los datos analíticos procesados
   */
  getSurveyAnalytics(surveyId: number): Observable<SurveyAnalytics> {
    return this.http.get<SurveyAnalytics>(`${this.API_URL}/survey/${surveyId}/analytics`);
  }
}
