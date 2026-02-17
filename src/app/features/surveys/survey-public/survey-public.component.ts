import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SurveyService } from '../../../core/services/survey.service';
import { ResponseService } from '../../../core/services/response.service';
import { Survey, Question } from '../../../core/models/survey.model';
import { QuestionAnswer, SubmitResponseRequest } from '../../../core/models/response.model';

/**
 * Componente para mostrar y responder encuestas públicas
 * Single Responsibility: Gestiona únicamente la presentación y envío de respuestas a encuestas públicas
 * Open/Closed: Extendible mediante inyección de dependencias
 */
@Component({
  selector: 'app-survey-public',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './survey-public.component.html',
  styleUrl: './survey-public.component.css'
})
export class SurveyPublicComponent implements OnInit {
  survey: Survey | null = null;
  questionAnswers: QuestionAnswer[] = [];
  
  // Estados del componente
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  isSubmitted: boolean = false;
  errorMessage: string = '';
  
  // Datos opcionales del encuestado
  respondentName: string = '';
  respondentEmail: string = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,  // Hacer público para usar en template
    private surveyService: SurveyService,
    private responseService: ResponseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const surveyId = +params['id'];
      if (surveyId) {
        this.loadPublicSurvey(surveyId);
      }
    });
  }

  /**
   * Carga la encuesta pública desde el backend
   * @param id ID de la encuesta
   */
  private loadPublicSurvey(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.surveyService.getPublicSurvey(id)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (survey) => {
          this.survey = survey;
          this.initializeQuestionAnswers(survey.questions || []);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = this.getErrorMessage(error);
        }
      });
  }

  /**
   * Inicializa el array de respuestas basado en las preguntas de la encuesta
   * @param questions Array de preguntas de la encuesta
   */
  private initializeQuestionAnswers(questions: Question[]): void {
    this.questionAnswers = questions.map(q => ({
      questionId: q.id,
      questionTitle: q.title,
      questionType: q.type,
      required: q.required,
      options: this.parseOptions(q.options),
      textValue: '',
      selectedOption: '',
      selectedOptions: []
    }));
  }

  /**
   * Parsea las opciones de una pregunta desde JSON string a array
   * @param options Opciones en formato JSON string
   * @returns Array de strings con las opciones
   */
  private parseOptions(options: string | null): string[] | undefined {
    if (!options) return undefined;
    
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Valida que todas las preguntas requeridas tengan respuesta
   * @returns true si el formulario es válido
   */
  private validateForm(): boolean {
    for (const qa of this.questionAnswers) {
      if (!qa.required) continue;

      const hasAnswer = this.hasValidAnswer(qa);
      
      if (!hasAnswer) {
        this.errorMessage = `La pregunta "${qa.questionTitle}" es obligatoria`;
        return false;
      }
    }

    this.errorMessage = '';
    return true;
  }

  /**
   * Verifica si una pregunta tiene una respuesta válida
   * @param qa Respuesta de pregunta a validar
   * @returns true si tiene respuesta válida
   */
  private hasValidAnswer(qa: QuestionAnswer): boolean {
    switch (qa.questionType) {
      case 'TEXT':
      case 'TEXTAREA':
        return !!qa.textValue?.trim();
      
      case 'RADIO':
      case 'SELECT':
        return !!qa.selectedOption;
      
      case 'CHECKBOX':
        return (qa.selectedOptions?.length || 0) > 0;
      
      default:
        return false;
    }
  }

  /**
   * Convierte las respuestas del formulario al formato requerido por el backend
   * @returns Array de respuestas en el formato del DTO
   */
  private buildAnswersPayload(): Array<{ questionId: number; value: string }> {
    return this.questionAnswers
      .filter(qa => this.hasValidAnswer(qa))
      .map(qa => ({
        questionId: qa.questionId,
        value: this.getAnswerValue(qa)
      }));
  }

  /**
   * Obtiene el valor de la respuesta según el tipo de pregunta
   * @param qa Respuesta de pregunta
   * @returns Valor formateado como string
   */
  private getAnswerValue(qa: QuestionAnswer): string {
    switch (qa.questionType) {
      case 'TEXT':
      case 'TEXTAREA':
        return qa.textValue || '';
      
      case 'RADIO':
      case 'SELECT':
        return qa.selectedOption || '';
      
      case 'CHECKBOX':
        // Para checkbox, guardar como JSON array
        return JSON.stringify(qa.selectedOptions || []);
      
      default:
        return '';
    }
  }

  /**
   * Maneja el cambio de estado de un checkbox
   * @param qa Respuesta de pregunta
   * @param option Opción seleccionada/deseleccionada
   * @param event Evento del checkbox
   */
  onCheckboxChange(qa: QuestionAnswer, option: string, event: any): void {
    if (!qa.selectedOptions) {
      qa.selectedOptions = [];
    }

    if (event.target.checked) {
      if (!qa.selectedOptions.includes(option)) {
        qa.selectedOptions.push(option);
      }
    } else {
      qa.selectedOptions = qa.selectedOptions.filter(opt => opt !== option);
    }
  }

  /**
   * Verifica si una opción de checkbox está seleccionada
   * @param qa Respuesta de pregunta
   * @param option Opción a verificar
   * @returns true si está seleccionada
   */
  isCheckboxChecked(qa: QuestionAnswer, option: string): boolean {
    return qa.selectedOptions?.includes(option) || false;
  }

  /**
   * Envía la respuesta al backend
   */
  submitResponse(): void {
    if (!this.survey) return;

    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload: SubmitResponseRequest = {
      surveyId: this.survey.id,
      respondentName: this.respondentName.trim() || undefined,
      respondentEmail: this.respondentEmail.trim() || undefined,
      answers: this.buildAnswersPayload()
    };

    this.responseService.submitResponse(payload)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.isSubmitted = true;
        },
        error: (error) => {
          this.errorMessage = this.getErrorMessage(error);
        }
      });
  }

  /**
   * Extrae el mensaje de error apropiado del objeto de error HTTP
   * @param error Error de HTTP
   * @returns Mensaje de error legible para el usuario
   */
  private getErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'Encuesta no encontrada o no disponible';
    } else if (error.status === 410) {
      return 'Esta encuesta ha expirado';
    } else if (error.error?.message) {
      return error.error.message;
    } else {
      return 'Ocurrió un error. Por favor, intenta nuevamente';
    }
  }

  /**
   * Reinicia el formulario para responder nuevamente
   */
  resetForm(): void {
    this.isSubmitted = false;
    this.respondentName = '';
    this.respondentEmail = '';
    
    if (this.survey?.questions) {
      this.initializeQuestionAnswers(this.survey.questions);
    }
  }
}
