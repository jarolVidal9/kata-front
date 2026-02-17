import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ResponseService } from '../../../core/services/response.service';
import { ModalService } from '../../../shared/services/modal.service';
import { SurveyAnalytics, QuestionAnalytics, OptionCount, ResponseDetail } from '../../../core/models/analytics.model';

/**
 * Componente para visualizar resultados y estadísticas de encuestas
 * Single Responsibility: Muestra analytics y respuestas individuales
 */
@Component({
  selector: 'app-survey-results',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ModalComponent],
  templateUrl: './survey-results.component.html',
  styleUrl: './survey-results.component.css'
})
export class SurveyResultsComponent implements OnInit {
  surveyId: number | null = null;
  analytics: SurveyAnalytics | null = null;
  responses: ResponseDetail[] = [];
  
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Vista activa: 'analytics' o 'responses'
  activeView: 'analytics' | 'responses' = 'analytics';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private responseService: ResponseService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.surveyId = +params['id'];
      if (this.surveyId) {
        this.loadAnalytics();
      }
    });
  }

  /**
   * Carga las estadísticas de la encuesta
   */
  loadAnalytics(): void {
    if (!this.surveyId) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.responseService.getSurveyAnalytics(this.surveyId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.analytics = data;
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar las estadísticas';
        }
      });
  }

  /**
   * Carga las respuestas individuales
   */
  loadResponses(): void {
    if (!this.surveyId) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.responseService.getResponsesBySurvey(this.surveyId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.responses = data;
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar las respuestas';
        }
      });
  }

  /**
   * Cambia entre vista de analytics y respuestas
   */
  switchView(view: 'analytics' | 'responses'): void {
    this.activeView = view;
    if (view === 'responses' && this.responses.length === 0) {
      this.loadResponses();
    }
  }

  /**
   * Procesa las respuestas de opciones múltiples (RADIO, CHECKBOX, SELECT)
   * y calcula conteos y porcentajes
   */
  processOptionsData(question: QuestionAnalytics): OptionCount[] {
    const optionCounts = new Map<string, number>();
    
    // Contar cada opción
    question.answers.forEach(answer => {
      // Para CHECKBOX, la respuesta viene como JSON array
      if (question.questionType === 'CHECKBOX') {
        try {
          const options = JSON.parse(answer);
          if (Array.isArray(options)) {
            options.forEach(opt => {
              optionCounts.set(opt, (optionCounts.get(opt) || 0) + 1);
            });
          }
        } catch {
          // Si no es JSON válido, tratar como texto simple
          optionCounts.set(answer, (optionCounts.get(answer) || 0) + 1);
        }
      } else {
        // RADIO y SELECT: respuesta simple
        optionCounts.set(answer, (optionCounts.get(answer) || 0) + 1);
      }
    });

    // Convertir a array y calcular porcentajes
    const total = question.totalAnswers;
    const result: OptionCount[] = [];

    optionCounts.forEach((count, option) => {
      result.push({
        option,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      });
    });

    // Ordenar por count descendente
    return result.sort((a, b) => b.count - a.count);
  }

  /**
   * Verifica si una pregunta tiene opciones (no es texto libre)
   */
  hasOptions(type: string): boolean {
    return ['RADIO', 'CHECKBOX', 'SELECT'].includes(type);
  }

  /**
   * Obtiene el label del tipo de pregunta
   */
  getQuestionTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'TEXT': 'Texto Corto',
      'TEXTAREA': 'Texto Largo',
      'RADIO': 'Opción Única',
      'CHECKBOX': 'Opción Múltiple',
      'SELECT': 'Lista Desplegable'
    };
    return types[type] || type;
  }

  /**
   * Calcula el ancho de la barra de progreso
   */
  getBarWidth(percentage: number): string {
    return `${Math.round(percentage)}%`;
  }

  /**
   * Volver al dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Parsea una respuesta de checkbox (JSON array)
   */
  parseCheckboxAnswer(value: string): string[] {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }

  /**
   * Elimina una respuesta individual
   */
  async deleteResponse(responseId: number): Promise<void> {
    const confirmed = await this.modalService.showConfirm(
      'Eliminar respuesta',
      '¿Estás seguro de eliminar esta respuesta? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    this.responseService.deleteResponse(responseId).subscribe({
      next: async () => {
        await this.modalService.showSuccess(
          'Respuesta eliminada',
          'La respuesta ha sido eliminada exitosamente.'
        );
        // Recargar datos
        if (this.activeView === 'analytics') {
          this.loadAnalytics();
        } else {
          this.loadResponses();
        }
      },
      error: async (error) => {
        await this.modalService.showError(
          'Error al eliminar',
          'No se pudo eliminar la respuesta. Por favor, intenta nuevamente.'
        );
      }
    });
  }
}
