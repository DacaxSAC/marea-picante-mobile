// Configuración de la aplicación Marea Picante
// Función para cargar variables de entorno
function loadEnvVariables() {
    const envVars = {};
    
    // En aplicaciones web sin bundler, usamos valores por defecto
    // que pueden ser sobrescritos manualmente en este archivo
    
    // Valores por defecto - modifica estos valores según tu entorno
     envVars.API_BASE_URL = 'http://localhost:4000/api';
    // envVars.API_BASE_URL = 'https://marea-picante-prod-server.onrender.com/api';
    envVars.API_TIMEOUT = 10000;
    envVars.NOTIFICATION_DURATION = 4000;
    envVars.SUCCESS_DURATION = 3000;
    
    // Para usar variables de entorno reales, necesitarías un bundler como Vite o Webpack
    // que procese el archivo .env y reemplace estas variables en tiempo de compilación
    
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
        ORDER_CREATED: 'Orden creada exitosamente'
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