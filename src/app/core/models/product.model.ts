export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  presentacion: string;
  precio: number;
  stock: number;
  disponible: boolean;
  vendedorId: string;
  eliminado: boolean;
  imagenUrl: string;
}
