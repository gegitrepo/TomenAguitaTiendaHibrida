# Tomen Agüita — Tienda Híbrida

> **Proyecto académico** — Fundación Universitaria Compensar · Desarrollo de Aplicaciones Móviles Híbridas, Actividad 6.
> App híbrida de e-commerce (Ionic + Angular + Capacitor) para la tienda de agua embotellada "Tomen Agüita", construida a partir del proyecto Android nativo original (`actividad6/nativa/`). No constituye una tienda real; los pagos son simulados.

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Qué se reutilizó del proyecto nativo](#qué-se-reutilizó-del-proyecto-nativo)
4. [Decisiones de diseño](#decisiones-de-diseño)
5. [Problemas encontrados y corregidos](#problemas-encontrados-y-corregidos)
6. [Estructura del proyecto](#estructura-del-proyecto)
7. [Cómo correr en desarrollo](#cómo-correr-en-desarrollo)
8. [Cómo compilar para Android](#cómo-compilar-para-android)
9. [Firmar el .aab (pasos manuales)](#firmar-el-aab-pasos-manuales)
10. [iOS](#ios)
11. [Credenciales de prueba](#credenciales-de-prueba)
12. [Backend / API usada](#backend--api-usada)
13. [Nota de seguridad](#nota-de-seguridad)
14. [Roadmap opcional](#roadmap-opcional)

---

## Descripción general

Un comprador puede: registrarse, iniciar sesión, ver el catálogo de agua embotellada, ver el detalle de un producto, agregarlo al carrito, ajustar cantidades, ver el subtotal y "finalizar" una compra simulada. La sesión, el carrito y la preferencia de tema (claro/oscuro) persisten localmente entre cierres de la app. La aplicación fue verificada tanto en navegador como en un dispositivo Android físico real.

| Dato | Valor |
|---|---|
| Framework | Ionic 9 + Angular 22.1 (standalone components) |
| Runtime nativo | Capacitor 8.5 |
| Lenguaje | TypeScript (strict mode) |
| Backend | Firebase real del proyecto nativo (Auth + Firestore), proyecto `tomenaguita-7154a` |
| Application ID | `com.example.tomenaguita` (igual al proyecto nativo) |
| Plataformas | Android (compilado, sincronizado y probado en dispositivo físico) + Web. iOS no compilado (ver [sección iOS](#ios)) |
| SDK Android | mínimo 24 (Android 7.0), compilado/target 36 (Android 16) |
| Compatibilidad mínima documentada (no verificada) | iOS 13+ |

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| UI | Ionic 9 (standalone), Angular 22.1 |
| Estilos | SCSS + variables de tema de Ionic |
| Backend | Firebase Web SDK (`firebase` ^12, sin `@angular/fire`, ver [Decisiones de diseño](#decisiones-de-diseño)) |
| HTTP | `HttpClient` de Angular, con interceptor de token (ver decisiones) |
| Almacenamiento local | `@capacitor/preferences` |
| Ruteo | Angular Router (`provideRouter`, rutas standalone con `loadComponent`) |
| Estado | Servicios Angular con `signal`/`computed` (sin NgRx) |
| Plugins Capacitor | `@capacitor/app`, `@capacitor/haptics`, `@capacitor/keyboard`, `@capacitor/preferences`, `@capacitor/splash-screen`, `@capacitor/status-bar` |

## Qué se reutilizó del proyecto nativo

El proyecto Android nativo de referencia vive en `actividad6/nativa/` (repositorio aparte, **solo lectura** — nunca modificado). De él se reutilizó:

- **Dominio y marca:** mismo nombre "Tomen Agüita", mismo catálogo de agua embotellada.
- **Backend real:** el mismo proyecto Firebase (`tomenaguita-7154a`), mismas colecciones Firestore (`usuarios`, `productos`) y los mismos 8 productos demo (botellas, packs y garrafones).
- **Paleta de colores** de marca, aplicada en `src/theme/variables.scss` (primary `#1565C0`, secondary `#00BCD4`, etc.).
- **Logo** (`logo_splash.png` del proyecto nativo → `resources/icon.png`, `resources/splash.png` y `src/assets/images/logo.png`), usado como fuente para generar los íconos y la pantalla de bienvenida de Android.
- **Reglas de negocio:** formato de precio en COP, validación de teléfono colombiano (10 dígitos, inicia en 3).
- **No se reutilizó** código Kotlin, layouts XML, Adapters ni ViewModels — todo se reescribió en TypeScript/HTML/SCSS. Tampoco se reutilizaron los roles vendedor/administrador, la pasarela Stripe ni la integración con Google Maps del proyecto nativo (ver punto 1 de Decisiones de diseño).

## Decisiones de diseño

1. **Alcance reducido a rol "comprador".** El nativo tiene 3 roles (comprador/vendedor/administrador) con pasarela de pago Stripe y selección de dirección con Google Maps. Esta app híbrida solo cubre las 4 funcionalidades mínimas de la rúbrica (auth, catálogo, carrito, storage local) para el rol comprador. El checkout es **simulado**: al confirmar, se limpia el carrito local y se muestra una confirmación, sin crear un pedido real en Firestore ni cobrar nada.

2. **Firebase SDK en vez de `HttpClient` para Auth/Firestore.** El backend real de este proyecto es Firebase, cuyo canal idiomático y seguro de consumo es el **SDK modular de Firebase** (`firebase/auth`, `firebase/firestore`), no llamadas HTTP manuales. Aun así, `HttpClient` está correctamente provisto (`provideHttpClient`) y existe un `core/interceptors/auth.interceptor.ts` **funcional** que inyecta el ID token de Firebase como `Authorization: Bearer <token>` en cualquier request HttpClient saliente, listo para cualquier endpoint REST adicional que se agregue a futuro.

3. **`firebase` en vez de `@angular/fire`.** `@angular/fire` solo declara compatibilidad de peer dependency hasta Angular 20, mientras que el proyecto se generó con **Angular 22**. Se optó por usar el **SDK modular de `firebase` directamente** (`src/app/core/firebase.ts`), inyectado en servicios Angular normales (`AuthService`, `ProductService`). Esta decisión tuvo una consecuencia real e importante, ver [Problemas encontrados y corregidos](#problemas-encontrados-y-corregidos), punto 2.

4. **Storage local con `@capacitor/preferences`** (no `@ionic/storage-angular`): más simple para pares clave-valor JSON (sesión, carrito, tema) sin necesidad de configurar un driver de IndexedDB.

5. **Estado con Angular `signal`/`computed`** en todas las páginas y en `ProductService`/`CartService`, y con `BehaviorSubject` de RxJS en `AuthService` (expone `currentUser$`). El uso de *signals* no es solo estilístico: es necesario para que la interfaz se actualice correctamente al usar el SDK de Firebase sin `@angular/fire` (ver problema #2 más abajo).

6. **Tema claro/oscuro manual**, no automático por el sistema: se usa la hoja `@ionic/angular/css/palettes/dark.class.css` (en vez de `dark.system.css`) y un toggle en el perfil que alterna la clase `ion-palette-dark` en `<html>`, aplicada también al arrancar la app (`app.component.ts`) y persistida en Preferences.

7. **Pantalla de bienvenida con `@capacitor/splash-screen`.** Android 12 introdujo una API de pantalla de bienvenida distinta a la usada por el scaffold original de Capacitor; sin el plugin oficial, el sistema ignora cualquier imagen personalizada. Se instaló el plugin y se configuró un ícono **dedicado** (`android/app/src/main/res/drawable/splash_icon.png`, cuadrado, sin variantes por orientación) en vez de reutilizar el ícono del launcher o el splash de pantalla completa — ver detalle en el siguiente apartado.

## Problemas encontrados y corregidos

Durante las pruebas en navegador y en un dispositivo Android físico real se encontraron y corrigieron 5 fallas reales:

1. **Reglas de Firestore expiradas.** El proyecto Firebase heredado del nativo tenía reglas de modo de prueba con fecha de expiración vencida (`allow read, write: if request.time < timestamp.date(2026, 6, 17)`), lo que bloqueaba **todo** acceso desde esa fecha, para ambas apps. Se republicaron reglas nuevas en la consola de Firebase: `allow read, write: if request.auth != null` (cualquier usuario autenticado puede leer/escribir — suficiente y razonable para un proyecto académico/sandbox, pero **no apto para producción real**, ver [Roadmap](#roadmap-opcional)).
2. **Bug de detección de cambios de Angular.** Al no usarse `@angular/fire`, varias promesas del SDK de Firebase (y de `@capacitor/preferences`) podían resolver fuera del *zone* de Angular: un campo de estado normal se actualizaba en memoria pero la vista nunca se redibujaba. El caso más grave: si el login fallaba, el botón "Ingresar" quedaba bloqueado para siempre sin mostrar ningún error. Se corrigió migrando el estado afectado a **signals** de Angular en `login`, `register`, `product-detail`, `profile` y `cart` (los signals notifican a la vista independientemente del *zone*).
3. **Tema oscuro incompleto.** Solo se aplicaba dentro de la pantalla de perfil, nunca al arrancar la app, y las pantallas de login/registro tenían un color de fondo fijo sin variante oscura. Corregido en `app.component.ts` y en los estilos de `login`/`register`.
4. **Splash screen ignorado en Android 12+.** Ver punto 7 de Decisiones de diseño. Se probaron dos enfoques que fallaron antes de llegar a la solución: usar `@mipmap/ic_launcher` (recortado, porque el ícono adaptativo del launcher tiene su propia zona segura) y usar `@drawable/splash` (tiene variantes `drawable-land-*`/`drawable-port-*` recortadas para llenar pantalla completa; el sistema elegía una no cuadrada y dejaba relleno negro). La solución final fue crear `splash_icon.png`, un recurso único y cuadrado.
5. **Ícono del launcher revisado.** Se verificó explícitamente que no quedara recortado (con el logo de origen no cuadrado, 960×1096) — confirmado correcto tanto en la vista previa como en el dispositivo físico.

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
├── app.component.ts           # aplica el tema guardado al arrancar
└── app.config.ts

android/app/src/main/res/
├── drawable/splash_icon.png   # ícono dedicado para la Splash Screen API (Android 12+)
├── values/colors.xml          # color de fondo del splash (#F4F7FB)
└── values/styles.xml          # tema AppTheme.NoActionBarLaunch (splash legacy + Android 12+)

resources/
├── icon.png                   # fuente para el ícono de la app (logo nativo, 960×1096)
├── splash.png                 # fuente para el splash de pantalla completa (logo con margen)
└── splash-original.png        # logo original en alta resolución, sin procesar

src/environments/               environment.ts, environment.prod.ts (firebaseConfig)
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

Desde Android Studio: `Build → Generate Signed Bundle / APK` para producción, o `Run ▶` para probar en emulador/dispositivo (API 24+). También se puede compilar e instalar por línea de comandos:

```bash
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Si cambias el logo o la marca, regenera el ícono y el splash de pantalla completa desde la raíz del proyecto (fuentes en `resources/icon.png` y `resources/splash.png`):

```bash
npx capacitor-assets generate --assetPath resources
npx cap sync android
```

**Importante:** este comando **no regenera** `android/app/src/main/res/drawable/splash_icon.png` (el ícono dedicado para la Splash Screen API de Android 12+, ver [Problemas encontrados y corregidos](#problemas-encontrados-y-corregidos) punto 4) — es un recurso creado manualmente porque ni el ícono del launcher ni el splash de pantalla completa sirven directamente para ese propósito. Si el logo cambia, hay que regenerar `splash_icon.png` a mano: un cuadrado (por ejemplo 960×960) con el logo centrado ocupando ~65 % del lienzo y fondo `#F4F7FB` (el mismo color que `windowSplashScreenBackground` en `styles.xml`), sin variantes por orientación.

## Firmar el .aab (pasos manuales)

**No se genera ni se versiona ningún keystore en este repositorio.** Para publicar en Google Play:

1. En Android Studio: `Build → Generate Signed Bundle / APK → Android App Bundle`.
2. Crear un nuevo keystore (`Create new...`) o usar uno existente — **guárdalo fuera del repositorio**, en un lugar seguro (nunca se debe commitear un `.keystore`/`.jks`; ya están excluidos en `.gitignore`).
3. Completar alias, contraseñas y validez (25+ años recomendado).
4. Seleccionar variante `release` y generar el `.aab` firmado.
5. Subir el `.aab` a Google Play Console.

## iOS

No se compiló ni se agregó la plataforma iOS (`npx cap add ios`) porque el desarrollo se hizo sin acceso a macOS/Xcode, requisito indispensable para compilar iOS. Es una decisión de alcance explícita y documentada, no un pendiente olvidado. El código es agnóstico de plataforma (Ionic/Capacitor), así que agregar iOS más adelante debería limitarse a:

```bash
npx cap add ios
npx capacitor-assets generate --assetPath resources
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

Firebase real del proyecto nativo — proyecto `tomenaguita-7154a` (Auth + Firestore). Ver justificación completa en [Decisiones de diseño](#decisiones-de-diseño), puntos 2 y 3.

El objeto `firebaseConfig` en `src/environments/environment.ts` **no es un secreto**: son credenciales de cliente Web de Firebase, diseñadas para ir embebidas en el bundle del navegador/app y protegidas por las reglas de seguridad de Firestore/Auth del lado del servidor — no por ocultarlas. Por eso se commitean sin problema, a diferencia de una API key de servidor o un secret key (como el de Stripe encontrado en el proyecto nativo, ver siguiente sección).

## Nota de seguridad

Durante la auditoría del proyecto nativo (`actividad6/nativa/`) se encontraron claves de Stripe sandbox (`pk_test_.../sk_test_...`) comprometidas en su historial de git. Son claves de prueba, no de producción, pero de todas formas es una mala práctica. **Esta app híbrida no integra Stripe ni reutiliza esas claves** — el checkout es simulado.

Adicionalmente, las reglas de Firestore actuales del proyecto (`allow read, write: if request.auth != null`, ver [Problemas encontrados y corregidos](#problemas-encontrados-y-corregidos) punto 1) permiten a **cualquier usuario autenticado** leer y escribir cualquier documento de la base de datos. Es una configuración razonable para un proyecto académico de alcance acotado, pero **no debe usarse tal cual en producción real**.

## Roadmap opcional

- Sincronizar el carrito y el pedido confirmado con Firestore (hoy son 100% locales) para reproducir la persistencia dual Room+Firestore del nativo.
- Agregar plataforma iOS y probarla en un Mac con Xcode.
- Reglas de seguridad de Firestore más estrictas (hoy son intencionalmente permisivas para cualquier usuario autenticado, ver [Nota de seguridad](#nota-de-seguridad)): por ejemplo, restringir la escritura en `usuarios/{uid}` al propio usuario y la escritura en `productos` a un rol vendedor/administrador si esos roles llegaran a implementarse.
- Búsqueda y filtros en el catálogo.
- Recuperación de contraseña (`sendPasswordResetEmail` de Firebase Auth), presente en el nativo pero no incluida aquí por no ser parte del alcance mínimo.
