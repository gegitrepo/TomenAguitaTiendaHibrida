import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

import { StorageService } from './core/services/storage.service';
import { STORAGE_KEYS } from './core/storage-keys';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private readonly storage = inject(StorageService);

  async ngOnInit(): Promise<void> {
    const savedTheme = await this.storage.get<'dark' | 'light'>(STORAGE_KEYS.theme);
    document.documentElement.classList.toggle('ion-palette-dark', savedTheme === 'dark');
  }
}
