export type UserRole = 'comprador' | 'vendedor' | 'administrador';

export interface AppUser {
  uid: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: UserRole;
  activo: boolean;
  direccion: string;
  fotoUrl: string;
  createdAt: number;
  updatedAt: number;
}
