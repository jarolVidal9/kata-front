import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css'
})
export class DashboardHeaderComponent {
  @Input() currentUser: User | null = null;
  @Output() createSurvey = new EventEmitter<void>();

  onCreateSurvey(): void {
    this.createSurvey.emit();
  }
}
