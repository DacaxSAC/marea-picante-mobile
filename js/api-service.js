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
                throw new Error(`HTTP error! status: ${response.status}`);
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

    // Eliminar orden
    async deleteOrder(orderId) {
        return this.makeRequest(`/orders/${orderId}`, {
            method: 'DELETE'
        });
    }
}