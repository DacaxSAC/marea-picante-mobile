# RestaurantApp 🍽️

Aplicación móvil para gestión de órdenes de restaurante desarrollada con React Native.

## Características

### 📱 Pantallas Principales

1. **Nueva Orden**
   - Selección de mesa (20 mesas disponibles)
   - Catálogo de platos por categorías
   - Vista previa de la orden
   - Información del cliente
   - Notas adicionales

2. **Órdenes**
   - Visualización de todas las órdenes
   - Filtros por estado
   - Detalles completos de cada orden
   - Gestión de estados de órdenes
   - Actualización en tiempo real

### 🍕 Funcionalidades

- **Gestión de Mesas**: 20 mesas con estado (libre/ocupada)
- **Catálogo de Platos**: Hamburguesas, pizzas, ensaladas, bebidas, postres y aperitivos
- **Estados de Órdenes**: Pendiente, Preparando, Lista, Entregada, Cancelada
- **Interfaz Intuitiva**: Navegación por pasos y diseño moderno
- **Cálculo Automático**: Total de órdenes y cantidades

## 🚀 Instalación y Ejecución

### Prerrequisitos

- Node.js (versión 18 o superior)
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd MareaPicante
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar iOS (solo para iOS)**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Iniciar Metro Bundler**
   ```bash
   npx react-native start
   ```

5. **Ejecutar la aplicación**
   
   Para Android:
   ```bash
   npx react-native run-android
   ```
   
   Para iOS:
   ```bash
   npx react-native run-ios
   ```

## 📋 Uso de la Aplicación

### Crear Nueva Orden

1. **Seleccionar Mesa**
   - Toca una mesa libre (las ocupadas aparecen en rojo)
   - Ingresa el nombre del cliente
   - Presiona "Siguiente"

2. **Seleccionar Platos**
   - Navega por el catálogo de platos
   - Usa los botones + y - para ajustar cantidades
   - Presiona "Vista Previa"

3. **Confirmar Orden**
   - Revisa el resumen de la orden
   - Agrega notas adicionales si es necesario
   - Presiona "Guardar Orden"

### Gestionar Órdenes

1. **Ver Órdenes**
   - Todas las órdenes se muestran en la pantalla principal
   - Usa los filtros para ver órdenes por estado
   - Toca una orden para ver detalles completos

2. **Actualizar Estados**
   - Abre los detalles de una orden
   - Usa los botones de acción para cambiar el estado
   - Los estados disponibles dependen del estado actual

## 🎨 Estructura del Proyecto

```
MareaPicante/
├── src/
│   ├── config/
│   │   └── constants.js          # Configuración y constantes
│   ├── navigation/
│   │   └── AppNavigator.js       # Navegación principal
│   └── screens/
│       ├── NewOrderScreen.js     # Pantalla de nueva orden
│       └── OrdersScreen.js       # Pantalla de órdenes
├── App.js                        # Componente principal
└── package.json                  # Dependencias
```

## 🔧 Configuración

### Personalización

- **Colores**: Modifica `COLORS` en `src/config/constants.js`
- **Número de Mesas**: Cambia `TOTAL_TABLES` en `src/config/constants.js`
- **Platos**: Actualiza el array `mockDishes` en `NewOrderScreen.js`

### Estados de Órdenes

- `PENDING`: Orden recién creada
- `PREPARING`: Orden en preparación
- `READY`: Orden lista para entregar
- `DELIVERED`: Orden entregada al cliente
- `CANCELLED`: Orden cancelada

## 📱 Capturas de Pantalla

### Nueva Orden
- Selección de mesa con estado visual
- Catálogo de platos con imágenes
- Vista previa completa de la orden

### Órdenes
- Lista de órdenes con filtros
- Detalles completos de cada orden
- Gestión de estados con botones de acción

## 🛠️ Tecnologías Utilizadas

- **React Native**: Framework principal
- **React Navigation**: Navegación entre pantallas
- **React Native Vector Icons**: Iconografía
- **React Native Safe Area Context**: Manejo de áreas seguras
- **React Native Gesture Handler**: Gestos y animaciones

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas, por favor abre un issue en el repositorio.

---

**RestaurantApp** - Gestión simple y eficiente de órdenes de restaurante 🍽️
