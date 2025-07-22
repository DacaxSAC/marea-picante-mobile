// Configuración de la aplicación de restaurante
export const API_URL = 'http://localhost:3000/api';

// Colores del tema
export const COLORS = {
  primary: '#FF6B35',
  secondary: '#F7931E',
  accent: '#FFD23F',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3'
};

// Estados de las órdenes
export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Colores de estados
export const STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: '#FF9800',
  [ORDER_STATUS.PREPARING]: '#2196F3',
  [ORDER_STATUS.READY]: '#4CAF50',
  [ORDER_STATUS.DELIVERED]: '#9E9E9E',
  [ORDER_STATUS.CANCELLED]: '#F44336'
};

// Categorías de platos
export const DISH_CATEGORIES = {
  APPETIZERS: 'appetizers',
  MAIN_COURSES: 'main_courses',
  DESSERTS: 'desserts',
  BEVERAGES: 'beverages',
  SALADS: 'salads'
};

// Configuración de paginación
export const ITEMS_PER_PAGE = 10;

// Formato de fecha
export const DATE_FORMAT = 'DD/MM/YYYY HH:mm';

// Duración de animaciones
export const ANIMATION_DURATION = 300;

// Claves de almacenamiento local
export const STORAGE_KEYS = {
  USER_TOKEN: '@restaurant_user_token',
  USER_DATA: '@restaurant_user_data'
};

// Número de mesas del restaurante
export const TOTAL_TABLES = 20;

// Configuración de la aplicación
export const APP_CONFIG = {
  name: 'RestaurantApp',
  version: '1.0.0',
  currency: '$'
};