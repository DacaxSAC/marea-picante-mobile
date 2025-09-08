// Manejador de datos para Marea Picante
import { ApiService } from './api-service.js';
import { CONFIG } from './config.js';

export class DataManager {
    constructor() {
        this.apiService = new ApiService();
        this.data = {
            tables: [],
            categories: [],
            products: {},
            allProducts: [],
            orders: [],
            currentScreen: CONFIG.DEFAULT_SCREEN,
            currentStep: CONFIG.DEFAULT_STEP,
            selectedTables: [],
            selectedProducts: new Map(), // Estructura: productId -> { personal: quantity, fuente: quantity }
            currentCategory: null,
            currentCategoryId: null
        };
    }

    // Getters para acceder a los datos
    get tables() { return this.data.tables; }
    get categories() { return this.data.categories; }
    get products() { return this.data.products; }
    get allProducts() { return this.data.allProducts; }
    get orders() { return this.data.orders; }
    get currentScreen() { return this.data.currentScreen; }
    get currentStep() { return this.data.currentStep; }
    get selectedTables() { return this.data.selectedTables; }
    get selectedProducts() { return this.data.selectedProducts; }
    get currentCategory() { return this.data.currentCategory; }
    get currentCategoryId() { return this.data.currentCategoryId; }

    // Setters para modificar los datos
    setCurrentScreen(screen) { this.data.currentScreen = screen; }
    setCurrentStep(step) { this.data.currentStep = step; }
    setCurrentCategory(category, categoryId = null) {
        this.data.currentCategory = category;
        this.data.currentCategoryId = categoryId;
    }

    // Cargar mesas desde localStorage o API
    async loadTables() {
        try {
            // Verificar si hay datos en localStorage
            const cachedTables = localStorage.getItem('marea_tables');
            if (cachedTables) {
                this.data.tables = JSON.parse(cachedTables);
                console.log('Mesas cargadas desde localStorage:', this.data.tables);
                return true;
            }
            
            // Si no hay datos en localStorage, cargar desde la API
            this.data.tables = await this.apiService.loadTables();
            console.log('Mesas cargadas desde la API:', this.data.tables);
            
            // Guardar en localStorage para futuras cargas
            localStorage.setItem('marea_tables', JSON.stringify(this.data.tables));
            return true;
        } catch (error) {
            console.error('Error al cargar las mesas:', error);
            this.loadDefaultTables();
            return false;
        }
    }

    // Cargar mesas por defecto
    loadDefaultTables() {
        this.data.tables = [];
    }

    // Cargar categorías desde localStorage o API
    async loadCategories() {
        try {
            // Verificar si hay datos en localStorage
            const cachedCategories = localStorage.getItem('marea_categories');
            if (cachedCategories) {
                this.data.categories = JSON.parse(cachedCategories);
                console.log('Categorías cargadas desde localStorage:', this.data.categories);
                
                // Establecer la primera categoría como activa
                if (this.data.categories.length > 0) {
                    this.data.currentCategory = this.data.categories[0].key || this.data.categories[0].name.toLowerCase();
                    this.data.currentCategoryId = this.data.categories[0].id || this.data.categories[0].categoryId || 1;
                }
                return true;
            }
            
            // Si no hay datos en localStorage, cargar desde la API
            this.data.categories = await this.apiService.loadCategories();
            console.log('Categorías cargadas desde la API:', this.data.categories);
            
            // Guardar en localStorage para futuras cargas
            localStorage.setItem('marea_categories', JSON.stringify(this.data.categories));
            
            // Establecer la primera categoría como activa
            if (this.data.categories.length > 0) {
                this.data.currentCategory = this.data.categories[0].key || this.data.categories[0].name.toLowerCase();
                this.data.currentCategoryId = this.data.categories[0].id || this.data.categories[0].categoryId || 1;
            }
            return true;
        } catch (error) {
            console.error('Error al cargar las categorías:', error);
            this.loadDefaultCategories();
            return false;
        }
    }

    // Cargar categorías por defecto
    loadDefaultCategories() {
        this.data.categories = Object.keys(this.data.products).map((key, index) => {
            const category = {
                id: index + 1,
                categoryId: index + 1,
                key: key,
                name: this.capitalizeFirst(key)
            };
            return category;
        });
        
        // Establecer la primera categoría como activa
        if (this.data.categories.length > 0) {
            this.data.currentCategory = this.data.categories[0].key;
            this.data.currentCategoryId = this.data.categories[0].categoryId;
        }
    }

    // Cargar productos desde la API
    // Cargar productos desde localStorage o API
    async loadProducts() {
        try {
            // Verificar si hay datos en localStorage
            const cachedProducts = localStorage.getItem('marea_products');
            if (cachedProducts) {
                this.data.allProducts = JSON.parse(cachedProducts);
                console.log('Productos cargados desde localStorage:', this.data.allProducts);
                return true;
            }
            
            // Si no hay datos en localStorage, cargar desde la API
            this.data.allProducts = await this.apiService.loadProducts();
            console.log('Productos cargados desde la API:', this.data.allProducts);
            
            // Guardar en localStorage para futuras cargas
            localStorage.setItem('marea_products', JSON.stringify(this.data.allProducts));
            return true;
        } catch (error) {
            console.error('Error al cargar los productos:', error);
            this.loadDefaultProducts();
            return false;
        }
    }

    // Cargar productos por defecto
    loadDefaultProducts() {
        this.data.allProducts = [];
        Object.keys(this.data.products).forEach(categoryKey => {
            this.data.products[categoryKey].forEach(product => {
                this.data.allProducts.push({
                    ...product,
                    categoryId: this.getCategoryIdByKey(categoryKey),
                    categoryKey: categoryKey
                });
            });
        });
    }

    // Obtener ID de categoría por clave
    getCategoryIdByKey(key) {
        const category = this.data.categories.find(cat => cat.key === key);
        return category ? category.categoryId : 1;
    }

    // Buscar producto por ID
    findProductById(productId) {
        // Buscar primero en allProducts (desde API)
        if (this.data.allProducts.length > 0) {
            return this.data.allProducts.find(product => product.productId === productId || product.id === productId);
        }
        
        // Fallback: buscar en productos locales
        for (const category in this.data.products) {
            const product = this.data.products[category].find(p => p.productId === productId || p.id === productId);
            if (product) {
                return product;
            }
        }
        return null;
    }

    // Obtener productos por categoría
    getProductsByCategory(categoryId) {
        if (this.data.allProducts.length > 0) {
            return this.data.allProducts.filter(product => product.categoryId === categoryId);
        }
        
        // Fallback a productos locales
        return this.data.products[this.data.currentCategory] || [];
    }

    // Manejar selección de mesa
    toggleTableSelection(tableNumber) {
        const index = this.data.selectedTables.indexOf(tableNumber);
        if (index > -1) {
            this.data.selectedTables.splice(index, 1);
        } else {
            this.data.selectedTables.push(tableNumber);
        }
    }

    // Actualizar cantidad de producto
    updateProductQuantity(productId, change, priceType = 'personal') {
        // Obtener o crear el objeto de cantidades para este producto
        let productQuantities = this.data.selectedProducts.get(productId) || { personal: 0, fuente: 0 };
        
        // Actualizar la cantidad específica del tipo de precio
        const currentQuantity = productQuantities[priceType] || 0;
        const newQuantity = Math.max(0, currentQuantity + change);
        productQuantities[priceType] = newQuantity;
        
        // Si ambas cantidades son 0, eliminar el producto
        if (productQuantities.personal === 0 && productQuantities.fuente === 0) {
            this.data.selectedProducts.delete(productId);
        } else {
            this.data.selectedProducts.set(productId, productQuantities);
        }
    }

    // Obtener cantidad de un producto por tipo de precio
    getProductQuantity(productId, priceType = 'personal') {
        const productQuantities = this.data.selectedProducts.get(productId);
        if (!productQuantities) return 0;
        return productQuantities[priceType] || 0;
    }

    // Obtener cantidad total de un producto (ambos tipos)
    getTotalProductQuantity(productId) {
        const productQuantities = this.data.selectedProducts.get(productId);
        if (!productQuantities) return 0;
        return (productQuantities.personal || 0) + (productQuantities.fuente || 0);
    }

    // Crear orden
    async createOrder() {
        const orderItems = [];
        let total = 0;
        
        this.data.selectedProducts.forEach((quantities, productId) => {
            const product = this.findProductById(productId);
            if (product) {
                // Agregar item para precio personal si hay cantidad
                if (quantities.personal > 0) {
                    const subtotal = product.pricePersonal * quantities.personal;
                    orderItems.push({
                        productId: product.productId || product.id,
                        name: product.name + ' (Personal)',
                        unitPrice: product.pricePersonal,
                        quantity: quantities.personal,
                        subtotal: subtotal,
                        priceType: 'personal'
                    });
                    total += subtotal;
                }
                
                // Agregar item para precio fuente si hay cantidad
                if (quantities.fuente > 0) {
                    const subtotal = product.priceFuente * quantities.fuente;
                    orderItems.push({
                        productId: product.productId || product.id,
                        name: product.name + ' (Fuente)',
                        unitPrice: product.priceFuente,
                        quantity: quantities.fuente,
                        subtotal: subtotal,
                        priceType: 'fuente'
                    });
                    total += subtotal;
                }
            }
        });
        
        const order = {
            id: Date.now(),
            tables: [...this.data.selectedTables],
            items: orderItems,
            total: total,
            timestamp: new Date(),
            status: 'pending'
        };
        
        // Log para ver la estructura de la orden antes de enviarla al backend
        console.log('📋 Orden estructurada lista para enviar al backend:', {
            orderData: order,
            selectedTables: [...this.data.selectedTables],
            selectedProducts: Object.fromEntries(this.data.selectedProducts),
            totalItems: orderItems.length,
            totalAmount: total
        });
        debugger
        try {
            // Enviar orden al backend
            const backendResponse = await this.apiService.createOrder(order);
            console.log('✅ Respuesta del backend:', backendResponse);
            
            // Guardar orden localmente solo si se envió exitosamente al backend
            this.data.orders.push(order);
            this.saveOrders();
            return order;
        } catch (error) {
            console.error('❌ Error al enviar orden al backend:', error);
            // Aún así guardar localmente para no perder la orden
            this.data.orders.push(order);
            this.saveOrders();
            throw error;
        }
    }



    // Resetear nueva orden
    resetNewOrder() {
        this.data.selectedTables = [];
        this.data.selectedProducts.clear();
        this.data.currentStep = CONFIG.DEFAULT_STEP;
    }

    // Guardar órdenes en localStorage
    saveOrders() {
        try {
            localStorage.setItem('marea-picante-orders', JSON.stringify(this.data.orders));
        } catch (error) {
            console.error('Error al guardar órdenes:', error);
        }
    }

    // Cargar órdenes desde localStorage
    async loadOrders() {
        try {
            const orders = await this.apiService.getOrders();
            this.data.orders = orders.map(order => ({
                ...order,
                timestamp: new Date(order.orderDate || order.timestamp)
            }));
        } catch (error) {
            console.error('Error al cargar órdenes desde la API:', error);
            this.data.orders = [];
        }
    }

    // Función auxiliar para capitalizar
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Métodos para gestionar el cache de localStorage
    clearCache() {
        localStorage.removeItem('marea_tables');
        localStorage.removeItem('marea_categories');
        localStorage.removeItem('marea_products');
        console.log('Cache de localStorage limpiado');
    }

    clearTablesCache() {
        localStorage.removeItem('marea_tables');
        console.log('Cache de mesas limpiado');
    }

    clearCategoriesCache() {
        localStorage.removeItem('marea_categories');
        console.log('Cache de categorías limpiado');
    }

    clearProductsCache() {
        localStorage.removeItem('marea_products');
        console.log('Cache de productos limpiado');
    }

    // Forzar recarga desde la API
    async forceReloadFromAPI() {
        this.clearCache();
        await this.loadTables();
        await this.loadCategories();
        await this.loadProducts();
        console.log('Datos recargados forzosamente desde la API');
    }
}