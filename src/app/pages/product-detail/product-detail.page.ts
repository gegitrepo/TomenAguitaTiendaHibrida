import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class ProductDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  // Signals en vez de campos planos: getProductById() usa el SDK de Firebase
  // directamente (sin @angular/fire), cuyas promesas pueden resolver fuera
  // del zone de Angular. Un campo normal no dispara el redibujado de la
  // vista aunque su valor sí quede actualizado.
  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  quantity = 1;
  added = false;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    const product = await this.productService.getProductById(id);
    this.product.set(product);
    this.notFound.set(product === null);
    this.loading.set(false);
  }

  increment(): void {
    const product = this.product();
    if (product && this.quantity < product.stock) {
      this.quantity++;
    }
  }

  decrement(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  async addToCart(): Promise<void> {
    const product = this.product();
    if (!product) {
      return;
    }
    await this.cartService.addItem(product, this.quantity);
    this.added = true;
    setTimeout(() => {
      this.router.navigateByUrl('/catalog');
    }, 800);
  }
}
