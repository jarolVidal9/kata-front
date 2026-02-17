import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DashboardStats {
  totalSurveys: number;
  totalResponses: number;
  activeSurveys: number;
  draftSurveys: number;
}

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-stats.component.html',
  styleUrl: './dashboard-stats.component.css'
})
export class DashboardStatsComponent {
  @Input() stats: DashboardStats = {
    totalSurveys: 0,
    totalResponses: 0,
    activeSurveys: 0,
    draftSurveys: 0
  };
}
