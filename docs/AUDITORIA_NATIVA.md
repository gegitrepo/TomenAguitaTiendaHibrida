# Auditoría del proyecto nativo — Tomen Agüita (Android)

> Resumen de lo extraído de `actividad6/proyecto-nativo/` (repo `TomenAguitaTienda`, Kotlin/Android) para construir esta app híbrida, según lo pedido en el §4 del `BRIEFING_CLAUDE_CODE.md`. El proyecto nativo se auditó en modo solo lectura; no se modificó ni se hizo commit alguno sobre él.

## 1. Propósito y dominio

**Tomen Agüita** es una app Android nativa (Kotlin, MVVM) para una tienda de **agua purificada embotellada** en Colombia. Ya es un dominio de e-commerce, así que no fue necesario adaptar la temática: se mantuvo el mismo nombre, marca y catálogo de productos.

Roles originales: comprador, vendedor y administrador, cada uno con su propia `Activity` y navegación. Esta app híbrida **solo reproduce el rol comprador**, que es el que cubre las 4 funcionalidades mínimas de la actividad (autenticación, catálogo, carrito, almacenamiento local). Los módulos de vendedor/administrador, la pasarela de pago con Stripe y la selección de dirección con Google Maps quedan fuera de alcance — son funcionalidades adicionales no exigidas por la rúbrica y se documentan aquí como decisión consciente, no como omisión accidental.

## 2. Backend real

El proyecto nativo **sí tiene backend propio**: Firebase (Auth + Firestore + Storage), proyecto `tomenaguita-7154a`. Por eso esta app híbrida se conecta al **mismo proyecto Firebase real** en lugar de usar una API pública de reemplazo (FakeStore/DummyJSON), siguiendo la prioridad que marca el §4 del briefing.

- **Autenticación:** Firebase Auth, email + contraseña.
- **Base de datos:** Cloud Firestore, colecciones `usuarios` y `productos` (detalladas abajo).
- **Storage:** Firebase Storage para fotos de perfil y de producto (no se usó desde esta app; las imágenes de producto se referencian por URL ya existente en Firestore).

## 3. Modelos de datos (Firestore → TypeScript)

### `productos/{docId}`
| Campo Firestore | Tipo | Modelo TS (`product.model.ts`) |
|---|---|---|
| `nombre` | string | `nombre` |
| `descripcion` | string | `descripcion` |
| `presentacion` | string | `presentacion` |
| `precio` | number (COP) | `precio` |
| `stock` | number | `stock` |
| `disponible` | boolean | `disponible` |
| `vendedorId` | string | `vendedorId` |
| `eliminado` | boolean | `eliminado` |
| `imagenUrl` | string | `imagenUrl` |

El catálogo de la app híbrida consulta esta colección filtrando `disponible == true` y `eliminado == false`, igual que la app nativa. Ya existen 8 productos demo cargados: botellas de 300ml/500ml/1L, botellón de 5L, packs de 24×300ml/12×500ml/6×1L y garrafón de 20L, con precios en COP.

### `usuarios/{uid}`
| Campo Firestore | Tipo | Modelo TS (`user.model.ts`) |
|---|---|---|
| `nombre` | string | `nombre` |
| `email` | string | `email` |
| `telefono` | string | `telefono` |
| `rol` | string (`comprador`\|`vendedor`\|`administrador`) | `rol` |
| `activo` | boolean | `activo` |
| `direccion` | string | `direccion` |
| `fotoUrl` | string | `fotoUrl` |
| `createdAt` / `updatedAt` | timestamp | `createdAt` / `updatedAt` (epoch ms) |

Toda cuenta creada desde `/register` en esta app híbrida se guarda con `rol: 'comprador'` fijo.

**No se reproduce** la subcolección `pedidos/{orderNumber}/detalles/{detId}` del nativo (persistencia de pedidos en Firestore) porque el checkout de esta app es **simulado** (ver README, sección de decisiones de diseño): el carrito se vacía localmente al confirmar, sin crear un pedido real en Firestore.

## 4. Reglas de negocio reutilizadas

- Formato de precio en pesos colombianos (COP) con separador de miles → se replica con `CurrencyPipe` de Angular (`currency:'COP':'symbol-narrow':'1.0-0'`).
- Validación de teléfono colombiano (10 dígitos, inicia en 3) → se replica en el formulario de registro con `Validators.pattern(/^3\d{9}$/)`.
- Un producto con `stock <= 0` se muestra como "Agotado" y no se puede agregar al carrito, igual que en el nativo.

## 5. Identidad visual reutilizada

**Paleta de marca** (de `colors.xml` del proyecto nativo), aplicada en `src/theme/variables.scss`:

| Uso | Color nativo | Variable Ionic |
|---|---|---|
| Primario | `#1565C0` | `--ion-color-primary` |
| Primario oscuro | `#0D47A1` | `--ion-color-primary-shade` |
| Primario claro | `#42A5F5` | `--ion-color-primary-tint` |
| Secundario | `#00BCD4` | `--ion-color-secondary` |
| Acento | `#26A69A` | `--ion-color-tertiary` |
| Éxito | `#4CAF50` | `--ion-color-success` |
| Advertencia | `#FFA000` | `--ion-color-warning` |
| Error | `#B00020` | `--ion-color-danger` |

**Assets reutilizados:** `logo_splash.png` (960×1096 px) se copió a `src/assets/images/logo.png` y se usó como fuente para generar íconos/splash de Android con `@capacitor/assets` (carpeta `resources/` en la raíz del proyecto).

## 6. Hallazgo de seguridad en el proyecto nativo (⚠️ no corregido allí, solo documentado)

El repositorio `TomenAguitaTienda` tiene **comprometidas en el historial de git** las claves de Stripe sandbox (`STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` en `Constants.kt`) y su `google-services.json`. Son claves de entorno de prueba (`pk_test_.../sk_test_...`), no de producción, pero de todas formas es una mala práctica tener una *secret key* — aunque sea de sandbox — en un repositorio público.

Por eso esta app híbrida:
- **No integra Stripe** (el checkout es simulado, sin pasarela real).
- **No reutiliza esas claves** en ningún archivo.
- El `firebaseConfig` que sí se usa aquí (en `environment.ts`) corresponde a una **app Web** nueva, registrada aparte en el mismo proyecto Firebase, y no es una clave secreta (ver justificación en el README).

Se recomienda al autor del proyecto nativo rotar esas claves de Stripe si el repositorio es o será público.

## 7. Qué NO se reutilizó (por instrucción explícita del briefing, §4)

Código Kotlin, layouts XML, Adapters, ViewModels y Activities del proyecto nativo — todo se reescribió desde cero en TypeScript/HTML/SCSS siguiendo las convenciones de Angular/Ionic.
