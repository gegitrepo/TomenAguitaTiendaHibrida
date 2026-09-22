import { Injectable, signal } from '@angular/core';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

import { firestore } from '../firebase';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const productsQuery = query(
        collection(firestore, 'productos'),
        where('disponible', '==', true),
        where('eliminado', '==', false),
      );
      const snapshot = await getDocs(productsQuery);
      const products = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Product, 'id'>),
      }));
      this.products.set(products);
    } catch {
      this.error.set('No se pudo cargar el catálogo. Verifica tu conexión e intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    const cached = this.products().find((product) => product.id === id);
    if (cached) {
      return cached;
    }
    const snapshot = await getDoc(doc(firestore, 'productos', id));
    if (!snapshot.exists()) {
      return null;
    }
    return { id: snapshot.id, ...(snapshot.data() as Omit<Product, 'id'>) };
  }
}
