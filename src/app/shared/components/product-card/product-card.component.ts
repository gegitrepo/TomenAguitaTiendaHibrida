import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonBadge, IonButton, IonCard, IonCardContent, IonIcon } from '@ionic/angular';

import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, IonCard, IonCardContent, IonButton, IonIcon, IonBadge],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() addToCart = new EventEmitter<Product>();

  onAddToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.addToCart.emit(this.product);
  }
}
