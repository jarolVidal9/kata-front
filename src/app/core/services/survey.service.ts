import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Survey, CreateSurveyRequest, UpdateSurveyRequest } from '../models/survey.model';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private readonly API_URL = `${environment.apiUrl}/surveys`;

  constructor(private http: HttpClient) {
    console.log('SurveyService inicializado. API_URL:', this.API_URL);
  }

  /**
   * Obtener todas las encuestas
   */
  getAllSurveys(): Observable<Survey[]> {
    console.log('Llamando a getAllSurveys:', this.API_URL);
    return this.http.get<Survey[]>(this.API_URL).pipe(
      tap(surveys => console.log('Respuesta del servidor:', surveys))
    );
  }

  /**
   * Obtener una encuesta por ID (requiere autenticación)
   */
  getSurveyById(id: number): Observable<Survey> {
    return this.http.get<Survey>(`${this.API_URL}/${id}`);
  }

  /**
   * Obtener una encuesta pública (sin autenticación)
   */
  getPublicSurvey(id: number): Observable<Survey> {
    return this.http.get<Survey>(`${this.API_URL}/public/${id}`);
  }

  /**
   * Crear una nueva encuesta
   */
  createSurvey(data: CreateSurveyRequest): Observable<Survey> {
    return this.http.post<Survey>(this.API_URL, data);
  }

  /**
   * Actualizar una encuesta existente
   */
  updateSurvey(id: number, data: UpdateSurveyRequest): Observable<Survey> {
    return this.http.put<Survey>(`${this.API_URL}/${id}`, data);
  }

  /**
   * Eliminar una encuesta
   */
  deleteSurvey(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
