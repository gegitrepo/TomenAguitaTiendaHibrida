import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
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
  IonToolbar,
  AlertController,
} from '@ionic/angular';

import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/cart-item.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
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
    IonButton,
    IonIcon,
    EmptyStateComponent,
  ],
})
export class CartPage {
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);

  // Signal en vez de campo plano: CartService.clear() persiste en
  // @capacitor/preferences, cuya promesa puede resolver fuera del zone de
  // Angular. Un campo normal dejaría el botón deshabilitado para siempre.
  readonly checkingOut = signal(false);

  async increment(item: CartItem): Promise<void> {
    if (item.cantidad < item.product.stock) {
      await this.cartService.updateQuantity(item.product.id, item.cantidad + 1);
    }
  }

  async decrement(item: CartItem): Promise<void> {
    await this.cartService.updateQuantity(item.product.id, item.cantidad - 1);
  }

  async remove(item: CartItem): Promise<void> {
    await this.cartService.removeItem(item.product.id);
  }

  async checkout(): Promise<void> {
    this.checkingOut.set(true);
    const orderNumber = `TA-${Date.now()}`;
    await this.cartService.clear();
    this.checkingOut.set(false);

    const alert = await this.alertController.create({
      header: '¡Compra simulada exitosa!',
      message: `Tu pedido ${orderNumber} fue confirmado. Este es un checkout de demostración, no se realizó ningún cobro real.`,
      buttons: [
        {
          text: 'Volver al catálogo',
          handler: () => this.router.navigateByUrl('/catalog', { replaceUrl: true }),
        },
      ],
    });
    await alert.present();
  }
}
