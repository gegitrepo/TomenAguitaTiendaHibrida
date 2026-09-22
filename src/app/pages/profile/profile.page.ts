import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService } from '../../core/services/auth.service';
import { AppUser } from '../../core/models/user.model';
import { StorageService } from '../../core/services/storage.service';
import { STORAGE_KEYS } from '../../core/storage-keys';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonButton,
    IonIcon,
    IonToggle,
  ],
})
export class ProfilePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  user: AppUser | null = null;
  darkMode = false;

  async ngOnInit(): Promise<void> {
    this.user = this.authService.currentUser;
    const savedTheme = await this.storage.get<'dark' | 'light'>(STORAGE_KEYS.theme);
    this.darkMode = savedTheme === 'dark';
  }

  async toggleTheme(event: CustomEvent): Promise<void> {
    this.darkMode = (event.detail as { checked: boolean }).checked;
    document.documentElement.classList.toggle('ion-palette-dark', this.darkMode);
    await this.storage.set(STORAGE_KEYS.theme, this.darkMode ? 'dark' : 'light');
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
