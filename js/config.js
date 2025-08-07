// Configuración de la aplicación Marea Picante
export const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://localhost:4000/api',
    
    // Default values
    DEFAULT_SCREEN: 'new-order',
    DEFAULT_STEP: 'tables',
    
    // UI Messages
    MESSAGES: {
        LOADING_TABLES: 'Cargando mesas...',
        ERROR_LOADING_TABLES: 'Error al cargar mesas desde la API. Usando mesas por defecto.',
        ERROR_CONNECTION_TABLES: 'Sin conexión con la API. Usando mesas por defecto.',
        ERROR_LOADING_CATEGORIES: 'Error al cargar categorías desde la API. Usando categorías por defecto.',
        ERROR_CONNECTION_CATEGORIES: 'Sin conexión con la API. Usando categorías por defecto.',
        ERROR_LOADING_PRODUCTS: 'Error al cargar productos desde la API. Usando productos por defecto.',
        ERROR_CONNECTION_PRODUCTS: 'Sin conexión con la API. Usando productos por defecto.',
        ORDER_CREATED: 'Orden creada exitosamente',
        ORDER_DELETED: 'Orden eliminada exitosamente'
    },
    
    // Timing
    NOTIFICATION_DURATION: 4000,
    SUCCESS_DURATION: 3000
};