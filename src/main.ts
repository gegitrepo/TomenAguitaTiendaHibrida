import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { registerAppIcons } from './app/core/icons';

registerAppIcons();

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
