import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonBadge,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    ProductCardComponent,
    EmptyStateComponent,
  ],
})
export class CatalogPage implements OnInit {
  readonly productService = inject(ProductService);
  readonly cartService = inject(CartService);

  ngOnInit(): void {
    void this.productService.loadProducts();
  }

  async onRefresh(event: CustomEvent): Promise<void> {
    await this.productService.loadProducts();
    (event.target as HTMLIonRefresherElement).complete();
  }

  async onAddToCart(product: Product): Promise<void> {
    await this.cartService.addItem(product, 1);
  }
}
