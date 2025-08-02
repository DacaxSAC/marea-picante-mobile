# Marea Picante - Aplicación Móvil de Gestión de Órdenes

Aplicación web progresiva (PWA) optimizada para tablets y dispositivos móviles para la gestión de órdenes del restaurante Marea Picante.

## Configuración de la API

### URL de la API

Para conectar la aplicación con tu API, modifica la URL en el archivo `app.js`:

```javascript
// Línea 17 en app.js
this.apiBaseUrl = 'http://localhost:3000/api'; // Cambia esta URL por la de tu API
```

### Endpoint de Mesas

La aplicación hace una petición GET al endpoint `/mesas` de tu API. La respuesta debe tener el siguiente formato JSON:

```json
[
  {
    "id": 1,
    "numero": 1,
    "estado": "disponible"
  },
  {
    "id": 2,
    "numero": 2,
    "estado": "ocupada"
  },
  {
    "id": 3,
    "numero": 3,
    "estado": "disponible"
  }
]
```

### Campos requeridos:

- **id**: Identificador único de la mesa (número)
- **numero**: Número de la mesa que se mostrará al usuario (número)
- **estado**: Estado de la mesa, puede ser:
  - `"disponible"`: Mesa libre para nuevas órdenes
  - `"ocupada"`: Mesa ocupada (no seleccionable)

### Manejo de errores

La aplicación incluye un sistema de fallback:

- Si la API no responde o hay un error de conexión, se cargarán mesas por defecto
- Se mostrará un mensaje de error al usuario informando sobre el problema
- La aplicación seguirá funcionando con las mesas por defecto

## Instalación y Uso

1. Clona o descarga este repositorio
2. Configura la URL de tu API en `app.js`
3. Sirve los archivos desde un servidor web:

```bash
# Usando Python (recomendado para desarrollo)
python3 -m http.server 8000

# O usando Node.js
npx serve .
```

4. Abre tu navegador en `http://localhost:8000`

## Características

- ✅ **Interfaz móvil nativa** con navegación inferior
- ✅ **Carga dinámica de mesas** desde API
- ✅ **Flujo paso a paso** para crear órdenes
- ✅ **Gestión completa** de órdenes activas
- ✅ **PWA instalable** para experiencia nativa
- ✅ **Optimizado para tablets** con recursos limitados
- ✅ **Funciona offline** con Service Worker
- ✅ **Sistema de fallback** si la API no está disponible

## Estructura del Proyecto

```
├── index.html          # Estructura principal de la app
├── app.js             # Lógica de la aplicación y conexión API
├── styles.css         # Estilos optimizados para móviles
├── manifest.json      # Configuración PWA
├── sw.js             # Service Worker para funcionalidad offline
├── icon-192.svg      # Icono de la app (192x192)
├── icon-512.svg      # Icono de la app (512x512)
└── README.md         # Este archivo
```

## Próximas mejoras

- Integración completa con API para productos
- Sincronización de órdenes con el backend
- Notificaciones push
- Modo offline avanzado