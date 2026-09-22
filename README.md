# Tomen Agüita — Tienda Híbrida

> **Proyecto académico** — Fundación Universitaria Compensar · Desarrollo de Aplicaciones Móviles Híbridas, Actividad 6.
> App híbrida de e-commerce (Ionic + Angular + Capacitor) para la tienda de agua embotellada "Tomen Agüita", construida a partir del proyecto Android nativo original (`actividad6/proyecto-nativo/`). No constituye una tienda real; los pagos son simulados.

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Qué se reutilizó del proyecto nativo](#qué-se-reutilizó-del-proyecto-nativo)
4. [Decisiones de diseño](#decisiones-de-diseño)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Cómo correr en desarrollo](#cómo-correr-en-desarrollo)
7. [Cómo compilar para Android](#cómo-compilar-para-android)
8. [Firmar el .aab (pasos manuales)](#firmar-el-aab-pasos-manuales)
9. [iOS](#ios)
10. [Credenciales de prueba](#credenciales-de-prueba)
11. [Backend / API usada](#backend--api-usada)
12. [Nota de seguridad](#nota-de-seguridad)
13. [Roadmap opcional](#roadmap-opcional)

---

## Descripción general

Un comprador puede: registrarse, iniciar sesión, ver el catálogo de agua embotellada, ver el detalle de un producto, agregarlo al carrito, ajustar cantidades, ver el subtotal y "finalizar" una compra simulada. La sesión, el carrito y la preferencia de tema (claro/oscuro) persisten localmente entre cierres de la app.

| Dato | Valor |
|---|---|
| Framework | Ionic 9 + Angular 22 (standalone components) |
| Runtime nativo | Capacitor 8 |
| Lenguaje | TypeScript (strict mode) |
| Backend | Firebase real del proyecto nativo (Auth + Firestore), proyecto `tomenaguita-7154a` |
| Application ID | `com.example.tomenaguita` (igual al proyecto nativo) |
| Plataformas | Android (compilado y sincronizado) + Web. iOS no compilado (ver [sección iOS](#ios)) |
| Compatibilidad mínima documentada | Android API 24 (7.0), iOS 13+ |

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| UI | Ionic 9 (standalone), Angular 22 |
| Estilos | SCSS + variables de tema de Ionic |
| Backend | Firebase Web SDK (`firebase`, sin `@angular/fire`, ver [Decisiones de diseño](#decisiones-de-diseño)) |
| HTTP | `HttpClient` de Angular, con interceptor de token (ver decisiones) |
| Almacenamiento local | `@capacitor/preferences` |
| Ruteo | Angular Router (`provideRouter`, rutas standalone con `loadComponent`) |
| Estado | Servicios Angular con `signal`/`computed` (sin NgRx) |

## Qué se reutilizó del proyecto nativo

Ver el detalle completo en [`docs/AUDITORIA_NATIVA.md`](docs/AUDITORIA_NATIVA.md). En resumen:

- **Dominio y marca:** mismo nombre "Tomen Agüita", mismo catálogo de agua embotellada.
- **Backend real:** el mismo proyecto Firebase (`tomenaguita-7154a`), mismas colecciones Firestore (`usuarios`, `productos`) y los mismos 8 productos demo.
- **Paleta de colores** de marca, aplicada en `src/theme/variables.scss`.
- **Logo** (`logo_splash.png` del proyecto nativo → `src/assets/images/logo.png`), usado también como fuente para generar los íconos/splash de Android.
- **Reglas de negocio:** formato de precio en COP, validación de teléfono colombiano (10 dígitos, inicia en 3), producto sin stock se muestra como "Agotado".
- **No se reutilizó** código Kotlin, layouts XML, Adapters ni ViewModels — todo se reescribió en TypeScript/HTML/SCSS.

## Decisiones de diseño

1. **Alcance reducido a rol "comprador".** El nativo tiene 3 roles (comprador/vendedor/administrador) con pasarela de pago Stripe y selección de dirección con Google Maps. Esta app híbrida solo cubre las 4 funcionalidades mínimas de la rúbrica (auth, catálogo, carrito, storage local) para el rol comprador. Vendedor, administrador, Stripe y Google Maps quedan fuera de alcance — el checkout es **simulado**: al confirmar, se limpia el carrito local y se muestra una confirmación, sin crear un pedido real en Firestore ni cobrar nada.

2. **Firebase SDK en vez de `HttpClient` para Auth/Firestore.** El stack tecnológico obligatorio del briefing lista `HttpClient` de Angular para HTTP. Sin embargo, el backend real de este proyecto es Firebase, cuyo canal idiomático y seguro de consumo es el **SDK modular de Firebase** (`firebase/auth`, `firebase/firestore`), no llamadas HTTP manuales — es la misma prioridad que el §4 del briefing le da a "usar el backend real" sobre una API pública genérica. Aun así, `HttpClient` está correctamente provisto (`provideHttpClient`) y existe un `core/interceptors/auth.interceptor.ts` **funcional** que inyecta el ID token de Firebase como `Authorization: Bearer <token>` en cualquier request HttpClient saliente — listo para cualquier endpoint REST adicional que se agregue a futuro, aunque hoy no hay ninguno.

3. **`firebase` en vez de `@angular/fire`.** Se intentó usar `@angular/fire` (el wrapper oficial de Firebase para Angular), pero su versión publicada al momento de esta entrega solo declara compatibilidad de peer dependency hasta Angular 20, mientras que el proyecto se generó con **Angular 22** (Angular CLI actual al momento de crear el proyecto). Instalarlo forzando el conflicto de peer dependencies (`--legacy-peer-deps`) es un riesgo innecesario de incompatibilidades silenciosas. Se optó por usar el **SDK modular de `firebase` directamente** (`src/app/core/firebase.ts`), inyectado en servicios Angular normales (`AuthService`, `ProductService`) — es exactamente el mismo SDK por debajo, sin el wrapper de conveniencia.

4. **Storage local con `@capacitor/preferences`** (no `@ionic/storage-angular`): más simple para pares clave-valor JSON (sesión, carrito, tema) sin necesidad de configurar un driver de IndexedDB.

5. **Estado con Angular `signal`/`computed`** en `ProductService` y `CartService`, y con `BehaviorSubject` de RxJS en `AuthService` (expone `currentUser$`) — ambos enfoques son nativos de Angular, sin NgRx, cumpliendo "mantenerlo simple".

6. **Tema claro/oscuro manual**, no automático por el sistema: se usa la hoja `@ionic/angular/css/palettes/dark.class.css` (en vez de `dark.system.css`) y un toggle en el perfil que alterna la clase `ion-palette-dark` en `<html>`, persistido en Preferences.

## Estructura del proyecto

```
src/app/
├── core/
│   ├── firebase.ts          # inicialización del SDK de Firebase (app/auth/firestore)
│   ├── icons.ts             # registro de ionicons usados
│   ├── storage-keys.ts
│   ├── models/               product.model.ts, user.model.ts, cart-item.model.ts
│   ├── services/              auth.service.ts, product.service.ts, cart.service.ts, storage.service.ts
│   ├── guards/                 auth.guard.ts
│   └── interceptors/          auth.interceptor.ts
├── pages/
│   ├── login/  register/  catalog/  product-detail/  cart/  profile/
├── shared/
│   └── components/            product-card/  empty-state/
├── app.routes.ts
├── app.config.ts
└── environments/               environment.ts, environment.prod.ts (firebaseConfig)
```

## Cómo correr en desarrollo

```bash
npm install
ionic serve
```

Requiere Node.js 20+ (probado con Node 24) y que el proyecto Firebase `tomenaguita-7154a` tenga habilitado **Authentication → Email/contraseña**.

## Cómo compilar para Android

```bash
ionic build --prod
npx cap sync android
npx cap open android   # abre Android Studio
```

Desde Android Studio: `Build → Generate Signed Bundle / APK` para producción, o `Run ▶` para probar en emulador/dispositivo (API 24+).

Si cambias el logo o la marca, regenera íconos y splash desde la raíz del proyecto (los archivos fuente están en `resources/icon.png` y `resources/splash.png`):

```bash
npx capacitor-assets generate --android
npx cap sync android
```

## Firmar el .aab (pasos manuales)

**No se genera ni se versiona ningún keystore en este repositorio.** Para publicar en Google Play:

1. En Android Studio: `Build → Generate Signed Bundle / APK → Android App Bundle`.
2. Crear un nuevo keystore (`Create new...`) o usar uno existente — **guárdalo fuera del repositorio**, en un lugar seguro (nunca se debe commitear un `.keystore`/`.jks`; ya están excluidos en `.gitignore`).
3. Completar alias, contraseñas y validez (25+ años recomendado).
4. Seleccionar variante `release` y generar el `.aab` firmado.
5. Subir el `.aab` a Google Play Console.

## iOS

No se compiló ni se agregó la plataforma iOS (`npx cap add ios`) porque el desarrollo se hizo sin acceso a macOS/Xcode, requisito indispensable para compilar iOS. El código es agnóstico de plataforma (Ionic/Capacitor), así que agregar iOS más adelante debería limitarse a:

```bash
npx cap add ios
npx capacitor-assets generate --ios
npx cap sync ios
npx cap open ios   # requiere macOS + Xcode
```

Compatibilidad mínima documentada (no verificada en dispositivo/simulador real): iOS 13+.

## Credenciales de prueba

Este proyecto no viene con usuarios de prueba precargados (el proyecto nativo los crea manualmente en Firebase Console). Para probar el flujo completo:

1. Abre la app → `Regístrate aquí`.
2. Completa el formulario (el teléfono debe tener 10 dígitos e iniciar en 3, ej. `3001234567`).
3. Se crea la cuenta real en Firebase Auth + un documento en `usuarios/{uid}` con `rol: 'comprador'`.
4. Inicia sesión con esas credenciales las veces que quieras — la sesión persiste entre cierres de la app.

## Backend / API usada

Firebase real del proyecto nativo — proyecto `tomenaguita-7154a` (Auth + Firestore). Ver justificación completa en [Decisiones de diseño](#decisiones-de-diseño) punto 2 y en [`docs/AUDITORIA_NATIVA.md`](docs/AUDITORIA_NATIVA.md).

El objeto `firebaseConfig` en `src/environments/environment.ts` **no es un secreto**: son credenciales de cliente Web de Firebase, diseñadas para ir embebidas en el bundle del navegador/app y protegidas por las reglas de seguridad de Firestore/Auth del lado del servidor — no por ocultarlas. Por eso se commitean sin problema, a diferencia de una API key de servidor o un secret key (como el de Stripe encontrado en el proyecto nativo, ver siguiente sección).

## Nota de seguridad

Durante la auditoría del proyecto nativo (`actividad6/proyecto-nativo/`) se encontraron claves de Stripe sandbox (`pk_test_.../sk_test_...`) comprometidas en su historial de git. Son claves de prueba, no de producción, pero de todas formas es una mala práctica. **Esta app híbrida no integra Stripe ni reutiliza esas claves** — el checkout es simulado. Detalle completo en [`docs/AUDITORIA_NATIVA.md`](docs/AUDITORIA_NATIVA.md#6-hallazgo-de-seguridad-en-el-proyecto-nativo-️-no-corregido-allí-solo-documentado).

## Roadmap opcional

- Sincronizar el carrito y el pedido confirmado con Firestore (hoy son 100% locales) para reproducir la persistencia dual Room+Firestore del nativo.
- Agregar plataforma iOS y probarla en un Mac con Xcode.
- Reglas de seguridad de Firestore explícitas para las colecciones `usuarios`/`productos` (hoy se asume la configuración ya existente del proyecto nativo).
- Búsqueda y filtros en el catálogo.
- Recuperación de contraseña (`sendPasswordResetEmail` de Firebase Auth), presente en el nativo pero no incluida aquí por no ser parte del alcance mínimo.
