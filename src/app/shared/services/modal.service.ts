import { Injectable, NgZone, ApplicationRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ModalConfig {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

/**
 * Servicio para gestionar modales de la aplicación
 * Single Responsibility: Maneja el estado y la lógica de modales
 */
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new BehaviorSubject<ModalConfig | null>(null);
  private resolveCallback: ((result: boolean) => void) | null = null;

  modal$: Observable<ModalConfig | null> = this.modalSubject.asObservable();

  constructor(
    private ngZone: NgZone,
    private appRef: ApplicationRef
  ) {}

  /**
   * Muestra un modal de información
   */
  showInfo(title: string, message: string): Promise<boolean> {
    return this.show({
      title,
      message,
      type: 'info',
      confirmText: 'Aceptar'
    });
  }

  /**
   * Muestra un modal de éxito
   */
  showSuccess(title: string, message: string): Promise<boolean> {
    return this.show({
      title,
      message,
      type: 'success',
      confirmText: 'Aceptar'
    });
  }

  /**
   * Muestra un modal de advertencia
   */
  showWarning(title: string, message: string): Promise<boolean> {
    return this.show({
      title,
      message,
      type: 'warning',
      confirmText: 'Aceptar'
    });
  }

  /**
   * Muestra un modal de error
   */
  showError(title: string, message: string): Promise<boolean> {
    return this.show({
      title,
      message,
      type: 'error',
      confirmText: 'Aceptar'
    });
  }

  /**
   * Muestra un modal de confirmación
   */
  showConfirm(title: string, message: string, confirmText = 'Confirmar', cancelText = 'Cancelar'): Promise<boolean> {
    return this.show({
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText
    });
  }

  /**
   * Muestra un modal genérico
   */
  private show(config: ModalConfig): Promise<boolean> {
    return this.ngZone.run(() => {
      this.modalSubject.next(config);
      this.appRef.tick(); // Forzar detección de cambios
      
      return new Promise<boolean>((resolve) => {
        this.resolveCallback = resolve;
      });
    });
  }

  /**
   * Confirma el modal (resultado positivo)
   */
  confirm(): void {
    this.ngZone.run(() => {
      if (this.resolveCallback) {
        this.resolveCallback(true);
        this.resolveCallback = null;
      }
      this.close();
    });
  }

  /**
   * Cancela el modal (resultado negativo)
   */
  cancel(): void {
    this.ngZone.run(() => {
      if (this.resolveCallback) {
        this.resolveCallback(false);
        this.resolveCallback = null;
      }
      this.close();
    });
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.ngZone.run(() => {
      this.modalSubject.next(null);
      this.appRef.tick(); // Forzar detección de cambios
    });
  }
}
