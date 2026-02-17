import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SurveyService } from '../../core/services/survey.service';
import { ModalService } from '../../shared/services/modal.service';
import { User } from '../../core/models/auth.model';
import { Survey } from '../../core/models/survey.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { DashboardStatsComponent, DashboardStats } from './components/dashboard-stats/dashboard-stats.component';
import { SurveyTableComponent } from './components/survey-table/survey-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    NavbarComponent, 
    ModalComponent,
    DashboardHeaderComponent,
    DashboardStatsComponent,
    SurveyTableComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  
  // Estadísticas
  stats: DashboardStats = {
    totalSurveys: 0,
    totalResponses: 0,
    activeSurveys: 0,
    draftSurveys: 0
  };
  
  // Listado de encuestas
  surveys: Survey[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private surveyService: SurveyService,
    private modalService: ModalService,
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
    
    this.surveyService.getAllSurveys()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (surveys) => {
          this.surveys = surveys;
          this.calculateStatistics();
        },
        error: () => {
          this.errorMessage = 'Error al cargar las encuestas. Por favor, intenta nuevamente.';
        }
      });
  }

  calculateStatistics(): void {
    this.stats = {
      totalSurveys: this.surveys.length,
      totalResponses: this.surveys.reduce((sum, survey) => sum + (survey.responsesCount || 0), 0),
      activeSurveys: this.surveys.filter(s => s.status === 'PUBLISHED').length,
      draftSurveys: this.surveys.filter(s => s.status === 'DRAFT').length
    };
  }
  
  editSurvey(surveyId: number): void {
    this.router.navigate(['/surveys/edit', surveyId]);
  }
  
  async copyPublicLink(surveyId: number): Promise<void> {
    const publicUrl = `${window.location.origin}/survey/${surveyId}`;
    
    try {
      await navigator.clipboard.writeText(publicUrl);
      await this.modalService.showSuccess(
        'Enlace Copiado',
        `El enlace ha sido copiado al portapapeles:\n${publicUrl}\n\nCompártelo para que otros respondan la encuesta.`
      );
    } catch {
      await this.modalService.showInfo(
        'Enlace Público',
        `Copia este enlace:\n${publicUrl}`
      );
    }
  }
  
  viewResults(surveyId: number): void {
    this.router.navigate(['/surveys/results', surveyId]);
  }
  
  createNewSurvey(): void {
    this.router.navigate(['/surveys/new']);
  }
  
  async deleteSurvey(surveyId: number): Promise<void> {
    const confirmed = await this.modalService.showConfirm(
      'Eliminar Encuesta',
      '¿Estás seguro de que deseas eliminar esta encuesta? Esta acción no se puede deshacer.',
      'Eliminar',
      'Cancelar'
    );

    if (confirmed) {
      this.surveyService.deleteSurvey(surveyId).subscribe({
        next: async () => {
          await this.modalService.showSuccess(
            'Encuesta Eliminada',
            'La encuesta ha sido eliminada exitosamente.'
          );
          this.loadSurveys();
        },
        error: async () => {
          await this.modalService.showError(
            'Error',
            'No se pudo eliminar la encuesta. Por favor, intenta nuevamente.'
          );
        }
      });
    }
  }
}
