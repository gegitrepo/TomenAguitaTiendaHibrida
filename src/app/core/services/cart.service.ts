import { Injectable, computed, inject, signal } from '@angular/core';

import { CartItem } from '../models/cart-item.model';
import { Product } from '../models/product.model';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../storage-keys';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  readonly subtotal = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.product.precio * item.cantidad, 0),
  );
  readonly totalItems = computed(() => this.itemsSignal().reduce((sum, item) => sum + item.cantidad, 0));

  private readonly storage = inject(StorageService);

  constructor() {
    void this.restore();
  }

  async restore(): Promise<void> {
    const cached = await this.storage.get<CartItem[]>(STORAGE_KEYS.cart);
    if (cached) {
      this.itemsSignal.set(cached);
    }
  }

  async addItem(product: Product, cantidad = 1): Promise<void> {
    const items = [...this.itemsSignal()];
    const existing = items.find((item) => item.product.id === product.id);
    if (existing) {
      existing.cantidad += cantidad;
    } else {
      items.push({ product, cantidad });
    }
    await this.persist(items);
  }

  async updateQuantity(productId: string, cantidad: number): Promise<void> {
    if (cantidad <= 0) {
      await this.removeItem(productId);
      return;
    }
    const items = this.itemsSignal().map((item) =>
      item.product.id === productId ? { ...item, cantidad } : item,
    );
    await this.persist(items);
  }

  async removeItem(productId: string): Promise<void> {
    const items = this.itemsSignal().filter((item) => item.product.id !== productId);
    await this.persist(items);
  }

  async clear(): Promise<void> {
    await this.persist([]);
  }

  private async persist(items: CartItem[]): Promise<void> {
    this.itemsSignal.set(items);
    await this.storage.set(STORAGE_KEYS.cart, items);
  }
}
