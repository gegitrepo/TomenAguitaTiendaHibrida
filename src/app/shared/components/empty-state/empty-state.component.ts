import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  standalone: true,
  imports: [IonIcon],
})
export class EmptyStateComponent {
  @Input() icon = 'alert-circle-outline';
  @Input() message = 'No hay elementos para mostrar.';
}
