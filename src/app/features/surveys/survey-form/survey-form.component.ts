import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SurveyService } from '../../../core/services/survey.service';
import { ModalService } from '../../../shared/services/modal.service';
import { Survey as SurveyModel, CreateSurveyRequest } from '../../../core/models/survey.model';

interface Question {
  id?: number;
  title: string;
  type: 'TEXT' | 'TEXTAREA' | 'RADIO' | 'CHECKBOX' | 'SELECT';
  options: string[];  // Ahora es un array para mejor manejo
  order: number;
  required: boolean;
  isEditing?: boolean;
  tempOption?: string;  // Input temporal para agregar nueva opción
}

interface Survey {
  id?: number;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  expiresAt: string;
  questions: Question[];
}

@Component({
  selector: 'app-survey-form',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ModalComponent],
  templateUrl: './survey-form.component.html',
  styleUrl: './survey-form.component.css'
})
export class SurveyFormComponent implements OnInit {
  isEditMode: boolean = false;
  surveyId: number | null = null;
  isLoading: boolean = false;
  isSaving: boolean = false;
  hasUnsavedChanges: boolean = false;
  initialSurveyState: string = '';

  survey: Survey = {
    title: '',
    description: '',
    status: 'DRAFT',
    expiresAt: '',
    questions: []
  };

  questionTypes = [
    { value: 'TEXT', label: 'Texto Corto' },
    { value: 'TEXTAREA', label: 'Texto Largo' },
    { value: 'RADIO', label: 'Opción Única (Radio)' },
    { value: 'CHECKBOX', label: 'Opción Múltiple (Checkbox)' },
    { value: 'SELECT', label: 'Lista Desplegable (Select)' }
  ];

  statusOptions = [
    { value: 'DRAFT', label: 'Borrador' },
    { value: 'PUBLISHED', label: 'Publicada' },
    { value: 'CLOSED', label: 'Cerrada' }
  ];

  // Nueva pregunta en proceso de creación
  newQuestion: Question = this.getEmptyQuestion();
  
  // Input temporal para agregar opción a nueva pregunta
  newQuestionOptionInput: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private surveyService: SurveyService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Revisar si estamos en modo edición
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode = true;
        this.surveyId = +params['id'];
        this.loadSurvey(this.surveyId);
      } else {
        // Capturar estado inicial para nuevas encuestas
        this.captureInitialState();
      }
    });
  }

  async loadSurvey(id: number): Promise<void> {
    this.isLoading = true;
    
    this.surveyService.getSurveyById(id)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (survey) => {
          // Convertir del formato backend al formato del formulario
          this.survey = {
            id: survey.id,
            title: survey.title,
            description: survey.description,
            status: survey.status,
            expiresAt: survey.expiresAt ? survey.expiresAt.split('T')[0] : '', // Formato YYYY-MM-DD
            questions: (survey.questions || []).map(q => ({
              id: q.id,
              title: q.title,
              type: q.type,
              options: this.convertOptionsFromBackend(q.options),
              order: q.order,
              required: q.required,
              isEditing: false,
              tempOption: ''
            }))
          };
          
          this.cdr.detectChanges();
          // Capturar el estado inicial después de cargar
          this.captureInitialState();
        },
        error: async (error) => {
          await this.modalService.showError(
            'Error al cargar',
            'No se pudo cargar la encuesta. Regresando al dashboard.'
          );
          this.router.navigate(['/dashboard']);
        }
      });
  }

  /**
   * Captura el estado inicial del survey para detectar cambios
   */
  private captureInitialState(): void {
    this.initialSurveyState = JSON.stringify({
      title: this.survey.title,
      description: this.survey.description,
      status: this.survey.status,
      expiresAt: this.survey.expiresAt,
      questions: this.survey.questions
    });
    this.hasUnsavedChanges = false;
  }

  /**
   * Marca que hay cambios sin guardar
   */
  markAsChanged(): void {
    const currentState = JSON.stringify({
      title: this.survey.title,
      description: this.survey.description,
      status: this.survey.status,
      expiresAt: this.survey.expiresAt,
      questions: this.survey.questions
    });
    this.hasUnsavedChanges = this.initialSurveyState !== currentState;
  }

  /**
   * Convierte las opciones del backend (JSON string) al formato del formulario (array)
   * Backend: "[\"Opcion1\",\"Opcion2\"]"
   * Frontend: ["Opcion1", "Opcion2"]
   */
  convertOptionsFromBackend(options: string | null | undefined): string[] {
    if (!options) return [];
    
    try {
      // Intentar parsear como JSON
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      // Si no es JSON válido, devolver array vacío
      return [];
    }
  }

  /**
   * Convierte las opciones del formulario al formato del backend
   * Frontend: ["Opcion1", "Opcion2"]
   * Backend: ["Opcion1", "Opcion2"] (el backend lo convierte a JSON internamente)
   */
  convertOptionsToBackend(options: string[]): string[] | undefined {
    if (!options || options.length === 0) return undefined;
    
    const filteredOptions = options
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);
    
    return filteredOptions.length > 0 ? filteredOptions : undefined;
  }

  getEmptyQuestion(): Question {
    return {
      title: '',
      type: 'TEXT',
      options: [],
      order: this.survey.questions.length + 1,
      required: false,
      isEditing: false,
      tempOption: ''
    };
  }

  needsOptions(type: string): boolean {
    return ['RADIO', 'CHECKBOX', 'SELECT'].includes(type);
  }

  async addQuestion(): Promise<void> {
    if (!this.newQuestion.title.trim()) {
      await this.modalService.showWarning(
        'Campo requerido',
        'El título de la pregunta es obligatorio.'
      );
      return;
    }

    if (this.needsOptions(this.newQuestion.type) && this.newQuestion.options.length === 0) {
      await this.modalService.showWarning(
        'Opciones requeridas',
        'Debes agregar al menos una opción para este tipo de pregunta.'
      );
      return;
    }

    this.survey.questions.push({
      ...this.newQuestion,
      order: this.survey.questions.length + 1,
      tempOption: ''
    });

    this.newQuestion = this.getEmptyQuestion();
    this.newQuestionOptionInput = '';
    this.markAsChanged();
  }

  editQuestion(question: Question): void {
    question.isEditing = true;
  }

  async saveQuestionEdit(question: Question): Promise<void> {
    if (!question.title.trim()) {
      await this.modalService.showWarning(
        'Campo requerido',
        'El título de la pregunta es obligatorio.'
      );
      return;
    }

    if (this.needsOptions(question.type) && question.options.length === 0) {
      await this.modalService.showWarning(
        'Opciones requeridas',
        'Debes agregar al menos una opción para este tipo de pregunta.'
      );
      return;
    }

    question.isEditing = false;
    this.markAsChanged();
  }

  cancelQuestionEdit(question: Question): void {
    question.isEditing = false;
  }

  async removeQuestion(index: number): Promise<void> {
    const confirmed = await this.modalService.showConfirm(
      'Eliminar pregunta',
      '¿Estás seguro de eliminar esta pregunta? Esta acción no se puede deshacer.'
    );
    if (confirmed) {
      this.survey.questions.splice(index, 1);
      // Reordenar
      this.survey.questions.forEach((q, i) => {
        q.order = i + 1;
      });
      this.markAsChanged();
    }
  }

  moveQuestionUp(index: number): void {
    if (index > 0) {
      const temp = this.survey.questions[index];
      this.survey.questions[index] = this.survey.questions[index - 1];
      this.survey.questions[index - 1] = temp;
      
      // Actualizar orden
      this.survey.questions.forEach((q, i) => {
        q.order = i + 1;
      });
      this.markAsChanged();
    }
  }

  moveQuestionDown(index: number): void {
    if (index < this.survey.questions.length - 1) {
      const temp = this.survey.questions[index];
      this.survey.questions[index] = this.survey.questions[index + 1];
      this.survey.questions[index + 1] = temp;
      
      // Actualizar orden
      this.survey.questions.forEach((q, i) => {
        q.order = i + 1;
      });
      this.markAsChanged();
    }
  }

  async saveSurvey(): Promise<void> {
    if (!this.survey.title.trim()) {
      await this.modalService.showWarning(
        'Campo requerido',
        'El título de la encuesta es obligatorio.'
      );
      return;
    }

    if (this.survey.questions.length === 0) {
      await this.modalService.showWarning(
        'Sin preguntas',
        'Debes agregar al menos una pregunta a la encuesta.'
      );
      return;
    }

    this.isSaving = true;

    // Preparar el payload para el backend
    const payload: CreateSurveyRequest = {
      title: this.survey.title.trim(),
      description: this.survey.description?.trim() || '',
      status: this.survey.status,
      expiresAt: this.survey.expiresAt ? new Date(this.survey.expiresAt).toISOString() : undefined,
      questions: this.survey.questions.map(q => ({
        title: q.title.trim(),
        type: q.type,
        options: this.convertOptionsToBackend(q.options),
        order: q.order,
        required: q.required
      }))
    };

    const request$ = this.isEditMode && this.surveyId
      ? this.surveyService.updateSurvey(this.surveyId, payload)
      : this.surveyService.createSurvey(payload);

    request$.subscribe({
      next: async (survey) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        
        await this.modalService.showSuccess(
          'Encuesta guardada',
          this.isEditMode ? 'La encuesta ha sido actualizada exitosamente.' : 'La encuesta ha sido creada exitosamente.'
        );
        this.router.navigate(['/dashboard']);
      },
      error: async (error) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        
        await this.modalService.showError(
          'Error al guardar',
          'No se pudo guardar la encuesta. Por favor, intenta nuevamente.'
        );
      }
    });
  }

  async cancel(): Promise<void> {
    // Si no hay cambios, navegar directamente
    if (!this.hasUnsavedChanges) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Si hay cambios, pedir confirmación
    const confirmed = await this.modalService.showConfirm(
      'Cancelar edición',
      '¿Estás seguro de cancelar? Los cambios no guardados se perderán.'
    );
    if (confirmed) {
      this.router.navigate(['/dashboard']);
    }
  }

  getQuestionTypeLabel(type: string): string {
    const found = this.questionTypes.find(qt => qt.value === type);
    return found ? found.label : type;
  }

  // ========== Gestión de Opciones ==========

  /**
   * Agrega una opción a la nueva pregunta
   */
  addOptionToNewQuestion(): void {
    const option = this.newQuestionOptionInput.trim();
    if (option) {
      this.newQuestion.options.push(option);
      this.newQuestionOptionInput = '';
    }
  }

  /**
   * Elimina una opción de la nueva pregunta
   */
  removeOptionFromNewQuestion(index: number): void {
    this.newQuestion.options.splice(index, 1);
  }

  /**
   * Sube una opción de la nueva pregunta
   */
  moveOptionUpInNewQuestion(index: number): void {
    if (index > 0) {
      const temp = this.newQuestion.options[index];
      this.newQuestion.options[index] = this.newQuestion.options[index - 1];
      this.newQuestion.options[index - 1] = temp;
    }
  }

  /**
   * Baja una opción de la nueva pregunta
   */
  moveOptionDownInNewQuestion(index: number): void {
    if (index < this.newQuestion.options.length - 1) {
      const temp = this.newQuestion.options[index];
      this.newQuestion.options[index] = this.newQuestion.options[index + 1];
      this.newQuestion.options[index + 1] = temp;
    }
  }

  /**
   * Agrega una opción a una pregunta en edición
   */
  addOptionToQuestion(question: Question): void {
    const option = question.tempOption?.trim();
    if (option) {
      question.options.push(option);
      question.tempOption = '';
      this.markAsChanged();
    }
  }

  /**
   * Elimina una opción de una pregunta
   */
  removeOptionFromQuestion(question: Question, index: number): void {
    question.options.splice(index, 1);
    this.markAsChanged();
  }

  /**
   * Sube una opción en el orden
   */
  moveOptionUpInQuestion(question: Question, index: number): void {
    if (index > 0) {
      const temp = question.options[index];
      question.options[index] = question.options[index - 1];
      question.options[index - 1] = temp;
      this.markAsChanged();
    }
  }

  /**
   * Baja una opción en el orden
   */
  moveOptionDownInQuestion(question: Question, index: number): void {
    if (index < question.options.length - 1) {
      const temp = question.options[index];
      question.options[index] = question.options[index + 1];
      question.options[index + 1] = temp;
      this.markAsChanged();
    }
  }

  /**
   * Maneja la tecla Enter en el input de opciones
   */
  onOptionKeyPress(event: KeyboardEvent, question?: Question): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (question) {
        this.addOptionToQuestion(question);
      } else {
        this.addOptionToNewQuestion();
      }
    }
  }
}
