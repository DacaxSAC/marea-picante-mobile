# Estructura Modular - Marea Picante Mobile

Esta carpeta contiene la nueva arquitectura modular de la aplicación Marea Picante, organizada siguiendo principios de separación de responsabilidades y mantenibilidad.

## Estructura de Archivos

### 📁 `/js/`

#### `config.js`
**Propósito**: Configuración centralizada de la aplicación
- Constantes de configuración (URLs de API, valores por defecto)
- Mensajes de la aplicación
- Configuraciones de tiempo y UI

#### `api-service.js`
**Propósito**: Servicio para manejo de API
- Métodos para todas las llamadas HTTP
- Manejo centralizado de errores de red
- Configuración de headers y autenticación

#### `data-manager.js`
**Propósito**: Gestión de estado y datos
- Almacenamiento y manipulación de datos de la aplicación
- Lógica de negocio (crear órdenes, manejar productos, etc.)
- Persistencia en localStorage
- Fallbacks para datos offline

#### `ui-manager.js`
**Propósito**: Gestión de interfaz de usuario
- Renderizado de componentes
- Manipulación del DOM
- Eventos de UI
- Notificaciones y modales

#### `app.js`
**Propósito**: Clase principal de la aplicación
- Coordinación entre módulos
- Inicialización de la aplicación
- Event listeners globales
- Service Worker y PWA

## Beneficios de esta Arquitectura

### ✅ **Separación de Responsabilidades**
- Cada módulo tiene una responsabilidad específica
- Fácil identificación de dónde hacer cambios
- Reducción de acoplamiento entre componentes

### ✅ **Mantenibilidad**
- Código más organizado y legible
- Fácil localización de bugs
- Modificaciones aisladas sin afectar otros módulos

### ✅ **Escalabilidad**
- Fácil agregar nuevas funcionalidades
- Estructura preparada para crecimiento
- Reutilización de componentes

### ✅ **Testabilidad**
- Módulos independientes fáciles de testear
- Mocking simplificado para pruebas unitarias
- Separación clara de lógica de negocio y UI

### ✅ **Performance**
- Carga modular de JavaScript
- Mejor gestión de memoria
- Optimización de bundle size

## Flujo de Datos

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   app.js    │───▶│ data-manager │───▶│ api-service │
│ (Orquestador)│    │   (Estado)   │    │   (API)     │
└─────────────┘    └──────────────┘    └─────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐    ┌──────────────┐
│ ui-manager  │◀───│   config.js  │
│    (UI)     │    │ (Configuración)│
└─────────────┘    └──────────────┘
```

## Migración desde Versión Monolítica

La aplicación original (`App.js` en la raíz) ha sido refactorizada en esta estructura modular manteniendo toda la funcionalidad existente:

- **Compatibilidad**: Misma funcionalidad, mejor organización
- **API**: Mismas interfaces, implementación mejorada
- **UI**: Misma experiencia de usuario, código más limpio
- **Datos**: Misma persistencia, mejor gestión de estado

## Uso

La aplicación se inicializa automáticamente cuando se carga la página:

```javascript
// En index.html
<script type="module" src="js/app.js"></script>
```

Los módulos se importan usando ES6 modules:

```javascript
import { CONFIG } from './config.js';
import { DataManager } from './data-manager.js';
import { UIManager } from './ui-manager.js';
```

## Próximos Pasos

1. **Testing**: Implementar pruebas unitarias para cada módulo
2. **TypeScript**: Migrar a TypeScript para mejor type safety
3. **Build Process**: Implementar bundling y minificación
4. **Monitoring**: Agregar logging y analytics
5. **Offline**: Mejorar capacidades offline con Service Worker