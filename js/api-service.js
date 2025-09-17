// Servicio API para Marea Picante
import { CONFIG } from './config.js';

export class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
    }

    // Método genérico para hacer peticiones HTTP
    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                // Intentar obtener el mensaje de error del servidor
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage = errorText;
                    }
                } catch (parseError) {
                    // Si no se puede parsear el error, usar el mensaje por defecto
                }
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    // Cargar mesas
    async loadTables() {
        return this.makeRequest('/tables');
    }

    // Cargar categorías
    async loadCategories() {
        return this.makeRequest('/categories');
    }

    // Cargar productos
    async loadProducts() {
        return this.makeRequest('/products');
    }

    // Crear orden
    async createOrder(orderData) {
        return this.makeRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    // Obtener órdenes
    async getOrders() {
        return this.makeRequest('/orders');
    }

    // Actualizar orden
    async updateOrder(orderId, orderData) {
        return this.makeRequest(`/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify(orderData)
        });
    }

    // Agregar producto a orden existente
    async addProductToOrder(orderId, orderDetail) {
        return this.makeRequest(`/orders/${orderId}/products`, {
            method: 'POST',
            body: JSON.stringify(orderDetail)
        });
    }

    // Obtener estado actual de la caja
    async getCurrentCashRegister() {
        return this.makeRequest('/cash-movements/current-register');
    }

}