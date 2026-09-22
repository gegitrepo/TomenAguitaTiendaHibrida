import { Injectable, inject } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';

import { firebaseAuth, firestore } from '../firebase';
import { AppUser } from '../models/user.model';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../storage-keys';

export interface RegisterData {
  nombre: string;
  email: string;
  telefono: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private resolveAuthReady!: () => void;
  readonly authReady: Promise<void> = new Promise((resolve) => {
    this.resolveAuthReady = resolve;
  });

  private readonly storage = inject(StorageService);

  constructor() {
    void this.restoreCachedSession();

    onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await this.loadUserDoc(firebaseUser.uid);
        this.currentUserSubject.next(appUser);
        if (appUser) {
          await this.storage.set(STORAGE_KEYS.session, appUser);
        }
      } else {
        this.currentUserSubject.next(null);
        await this.storage.remove(STORAGE_KEYS.session);
      }
      this.resolveAuthReady();
    });
  }

  get currentUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  async login(email: string, password: string): Promise<AppUser> {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const appUser = await this.loadUserDoc(credential.user.uid);
    if (!appUser) {
      throw new Error('No se encontró el perfil del usuario en la base de datos.');
    }
    this.currentUserSubject.next(appUser);
    await this.storage.set(STORAGE_KEYS.session, appUser);
    return appUser;
  }

  async register(data: RegisterData): Promise<AppUser> {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password);
    const now = Date.now();
    const appUser: AppUser = {
      uid: credential.user.uid,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      rol: 'comprador',
      activo: true,
      direccion: '',
      fotoUrl: '',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(firestore, 'usuarios', credential.user.uid), appUser);
    this.currentUserSubject.next(appUser);
    await this.storage.set(STORAGE_KEYS.session, appUser);
    return appUser;
  }

  async logout(): Promise<void> {
    await signOut(firebaseAuth);
    this.currentUserSubject.next(null);
    await this.storage.remove(STORAGE_KEYS.session);
  }

  async getIdToken(): Promise<string | null> {
    return firebaseAuth.currentUser ? firebaseAuth.currentUser.getIdToken() : null;
  }

  private async restoreCachedSession(): Promise<void> {
    const cached = await this.storage.get<AppUser>(STORAGE_KEYS.session);
    if (cached) {
      this.currentUserSubject.next(cached);
    }
  }

  private async loadUserDoc(uid: string): Promise<AppUser | null> {
    const snapshot = await getDoc(doc(firestore, 'usuarios', uid));
    return snapshot.exists() ? (snapshot.data() as AppUser) : null;
  }
}
