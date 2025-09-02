// Configuración de la aplicación Marea Picante
// Función para cargar variables de entorno
function loadEnvVariables() {
    const envVars = {};
    
    // En un entorno de navegador, las variables de entorno se pueden cargar
    // desde un archivo .env usando un bundler como Vite, Webpack, etc.
    // Para aplicaciones móviles simples, usamos valores por defecto
    
    // Valores por defecto que pueden ser sobrescritos por variables de entorno
    envVars.API_BASE_URL = process?.env?.API_BASE_URL || 'http://localhost:4000/api';
    envVars.API_TIMEOUT = parseInt(process?.env?.API_TIMEOUT) || 10000;
    envVars.NOTIFICATION_DURATION = parseInt(process?.env?.NOTIFICATION_DURATION) || 4000;
    envVars.SUCCESS_DURATION = parseInt(process?.env?.SUCCESS_DURATION) || 3000;
    
    return envVars;
}

const ENV = loadEnvVariables();

export const CONFIG = {
    // API Configuration
    API_BASE_URL: ENV.API_BASE_URL,
    API_TIMEOUT: ENV.API_TIMEOUT,
    
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
    NOTIFICATION_DURATION: ENV.NOTIFICATION_DURATION,
    SUCCESS_DURATION: ENV.SUCCESS_DURATION
};

// Función para actualizar la configuración en tiempo de ejecución
export function updateConfig(newConfig) {
    Object.assign(CONFIG, newConfig);
}

// Función para obtener la URL de la API con validación
export function getApiUrl() {
    if (!CONFIG.API_BASE_URL) {
        console.warn('API_BASE_URL no está configurada. Usando URL por defecto.');
        return 'http://localhost:4000/api';
    }
    return CONFIG.API_BASE_URL;
}