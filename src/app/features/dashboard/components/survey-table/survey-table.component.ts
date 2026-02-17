import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Survey } from '../../../../core/models/survey.model';

@Component({
  selector: 'app-survey-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './survey-table.component.html',
  styleUrl: './survey-table.component.css'
})
export class SurveyTableComponent {
  @Input() surveys: Survey[] = [];
  @Input() isLoading: boolean = false;
  @Input() errorMessage: string = '';
  
  @Output() editSurvey = new EventEmitter<number>();
  @Output() copyPublicLink = new EventEmitter<number>();
  @Output() viewResults = new EventEmitter<number>();
  @Output() deleteSurvey = new EventEmitter<number>();
  @Output() createNewSurvey = new EventEmitter<void>();
  @Output() reloadSurveys = new EventEmitter<void>();

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

  onEditSurvey(surveyId: number): void {
    this.editSurvey.emit(surveyId);
  }

  onCopyPublicLink(surveyId: number): void {
    this.copyPublicLink.emit(surveyId);
  }

  onViewResults(surveyId: number): void {
    this.viewResults.emit(surveyId);
  }

  onDeleteSurvey(surveyId: number): void {
    this.deleteSurvey.emit(surveyId);
  }

  onCreateNewSurvey(): void {
    this.createNewSurvey.emit();
  }

  onReloadSurveys(): void {
    this.reloadSurveys.emit();
  }
}
