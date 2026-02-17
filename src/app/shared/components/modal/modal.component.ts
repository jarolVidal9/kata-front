import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, ModalConfig } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent implements OnInit {
  modal: ModalConfig | null = null;

  constructor(
    public modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.modalService.modal$.subscribe(modal => {
      this.modal = modal;
      this.cdr.detectChanges();
    });
  }

  onConfirm(): void {
    this.modalService.confirm();
  }

  onCancel(): void {
    this.modalService.cancel();
  }

  getIconClass(): string {
    if (!this.modal) return '';
    
    switch (this.modal.type) {
      case 'success':
        return 'bi-check-circle-fill text-success';
      case 'error':
        return 'bi-x-circle-fill text-danger';
      case 'warning':
        return 'bi-exclamation-triangle-fill text-warning';
      case 'confirm':
        return 'bi-question-circle-fill text-primary';
      default:
        return 'bi-info-circle-fill text-info';
    }
  }

  getHeaderClass(): string {
    if (!this.modal) return '';
    
    switch (this.modal.type) {
      case 'success':
        return 'border-success';
      case 'error':
        return 'border-danger';
      case 'warning':
        return 'border-warning';
      default:
        return 'border-primary';
    }
  }
}
