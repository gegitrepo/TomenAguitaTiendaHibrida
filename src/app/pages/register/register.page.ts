import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonSpinner,
  IonText,
} from '@ionic/angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonText,
  ],
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    telefono: ['', [Validators.required, Validators.pattern(/^3\d{9}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Signals en vez de campos planos: AuthService usa el SDK de Firebase
  // directamente (sin @angular/fire), cuyas promesas pueden resolver fuera
  // del zone de Angular. Un campo normal no dispara el redibujado de la
  // vista aunque su valor sí quede actualizado (el botón se ve bloqueado
  // para siempre y el error nunca aparece).
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    const { nombre, telefono, email, password } = this.form.getRawValue();

    try {
      await this.authService.register({ nombre, telefono, email, password });
      await this.router.navigateByUrl('/catalog', { replaceUrl: true });
    } catch (error) {
      this.errorMessage.set(this.mapError(error));
    } finally {
      this.loading.set(false);
    }
  }

  private mapError(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';
    if (code === 'auth/email-already-in-use') {
      return 'Ese correo ya está registrado. Intenta iniciar sesión.';
    }
    if (code === 'auth/weak-password') {
      return 'La contraseña es muy débil (mínimo 6 caracteres).';
    }
    return 'No se pudo crear la cuenta. Intenta de nuevo.';
  }
}
