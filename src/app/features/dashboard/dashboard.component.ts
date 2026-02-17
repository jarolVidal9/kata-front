import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SurveyService } from '../../core/services/survey.service';
import { User } from '../../core/models/auth.model';
import { Survey } from '../../core/models/survey.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  
  // Estadísticas
  totalSurveys: number = 0;
  totalResponses: number = 0;
  activeSurveys: number = 0;
  draftSurveys: number = 0;
  
  // Listado de encuestas
  surveys: Survey[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private surveyService: SurveyService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Cargar encuestas del backend
    this.loadSurveys();
  }

  loadSurveys(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.surveys = [];
    
    console.log('=== Iniciando carga de encuestas ===');
    console.log('isLoading:', this.isLoading);
    
    this.surveyService.getAllSurveys()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          console.log('=== Finalize ejecutado, isLoading:', this.isLoading);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (surveys) => {
          console.log('=== Respuesta recibida ===');
          console.log('Encuestas recibidas:', surveys);
          console.log('Cantidad:', surveys.length);
          
          this.surveys = surveys;
          this.calculateStatistics();
          
          console.log('surveys.length:', this.surveys.length);
        },
        error: (error) => {
          console.error('=== Error al cargar las encuestas ===', error);
          this.errorMessage = 'Error al cargar las encuestas. Por favor, intenta nuevamente.';
        }
      });
  }

  calculateStatistics(): void {
    this.totalSurveys = this.surveys.length;
    this.totalResponses = this.surveys.reduce((sum, survey) => sum + (survey.responsesCount || 0), 0);
    this.activeSurveys = this.surveys.filter(s => s.status === 'PUBLISHED').length;
    this.draftSurveys = this.surveys.filter(s => s.status === 'DRAFT').length;
  }
  
  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'PUBLISHED': return 'bg-success';
      case 'DRAFT': return 'bg-warning text-dark';
      case 'CLOSED': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }
  
  getStatusLabel(status: string): string {
    switch(status) {
      case 'PUBLISHED': return 'Publicada';
      case 'DRAFT': return 'Borrador';
      case 'CLOSED': return 'Cerrada';
      default: return status;
    }
  }
  
  editSurvey(surveyId: number): void {
    console.log('Editar encuesta:', surveyId);
    // TODO: Navegar a formulario de edición
    this.router.navigate(['/surveys/edit', surveyId]);
  }
  
  viewResults(surveyId: number): void {
    console.log('Ver resultados:', surveyId);
    // TODO: Navegar a resultados
    this.router.navigate(['/surveys/results', surveyId]);
  }
  
  createNewSurvey(): void {
    console.log('Crear nueva encuesta');
    // TODO: Navegar a formulario de creación
    this.router.navigate(['/surveys/new']);
  }
  
  deleteSurvey(surveyId: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta encuesta?')) {
      this.surveyService.deleteSurvey(surveyId).subscribe({
        next: () => {
          console.log('Encuesta eliminada exitosamente');
          // Recargar la lista de encuestas
          this.loadSurveys();
        },
        error: (error) => {
          console.error('Error al eliminar la encuesta:', error);
          alert('Error al eliminar la encuesta. Por favor, intenta nuevamente.');
        }
      });
    }
  }
}
