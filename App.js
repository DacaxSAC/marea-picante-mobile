// Aplicación móvil de gestión de órdenes - Marea Picante
// Optimizada para dispositivos con recursos limitados

class MobileApp {
    constructor() {
        this.currentScreen = 'new-order';
        this.currentStep = 'table';
        this.selectedTables = []; // Cambiado a array para selección múltiple
        this.selectedProducts = new Map();
        this.orders = [];
        this.products = this.initializeProducts();
        this.currentCategory = 'entradas';
        this.tables = [];
        
        // Configuración de la API
        this.apiBaseUrl = 'http://localhost:4000/api'; // Cambia esta URL por la de tu API
        
        this.init();
    }

    async init() {
        this.loadOrders();
        await this.loadTables();
        this.setupEventListeners();
        this.hideLoading();
        this.renderProducts();
        this.updateOrdersDisplay();
    }

    // Función para cargar las mesas desde la API
    async loadTables() {
        const tablesGrid = document.querySelector('.tables-grid');
        if (tablesGrid) {
            tablesGrid.innerHTML = '<div class="loading-tables">Cargando mesas...</div>';
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/tables`);
            if (response.ok) {
                this.tables = await response.json();
                console.log('Mesas cargadas desde la API:', this.tables);
                this.renderTables();
            } else {
                console.error('Error al cargar las mesas:', response.statusText);
                this.showError('Error al cargar mesas desde la API. Usando mesas por defecto.');
                // Fallback a mesas por defecto si la API falla
                this.loadDefaultTables();
            }
        } catch (error) {
            console.error('Error de conexión con la API:', error);
            this.showError('Sin conexión con la API. Usando mesas por defecto.');
            // Fallback a mesas por defecto si hay error de conexión
            this.loadDefaultTables();
        }
    }

    // Mesas por defecto como fallback
    loadDefaultTables() {
        this.tables = [];
        this.renderTables();
    }

    // Función para renderizar las mesas dinámicamente
    renderTables() {
        const tablesGrid = document.querySelector('.tables-grid');
        if (!tablesGrid) return;

        tablesGrid.innerHTML = '';
        
        this.tables.forEach(table => {
            const tableCard = document.createElement('div');
            tableCard.className = `table-card ${table.state === 2 ? 'occupied' : ''}`;
            tableCard.dataset.table = table.number;
            
            tableCard.innerHTML = `
                <div class="table-number">${table.number}</div>
                <div class="table-status">${table.state === 1 ? 'Disponible' : 'Ocupada'}</div>
            `;
            
            // Agregar event listener para la selección de mesa
            if (table.state === 1) {
                tableCard.addEventListener('click', () => {
                    this.selectTable(table.number);
                });
            }
            
            tablesGrid.appendChild(tableCard);
        });
    }

    initializeProducts() {
        return {
            entradas: [
                { id: 1, name: 'Ceviche Clásico', price: 18.00, description: 'Pescado fresco marinado en limón' },
                { id: 2, name: 'Tiradito de Atún', price: 22.00, description: 'Atún fresco con ají amarillo' },
                { id: 3, name: 'Causa Limeña', price: 15.00, description: 'Papa amarilla con pollo' },
                { id: 4, name: 'Anticuchos', price: 16.00, description: 'Brochetas de corazón marinado' }
            ],
            principales: [
                { id: 5, name: 'Lomo Saltado', price: 28.00, description: 'Carne salteada con papas fritas' },
                { id: 6, name: 'Arroz con Mariscos', price: 32.00, description: 'Arroz con mariscos frescos' },
                { id: 7, name: 'Ají de Gallina', price: 24.00, description: 'Pollo en crema de ají amarillo' },
                { id: 8, name: 'Pescado a la Plancha', price: 26.00, description: 'Pescado fresco con ensalada' }
            ],
            bebidas: [
                { id: 9, name: 'Pisco Sour', price: 12.00, description: 'Cóctel tradicional peruano' },
                { id: 10, name: 'Chicha Morada', price: 8.00, description: 'Bebida tradicional de maíz morado' },
                { id: 11, name: 'Agua Mineral', price: 4.00, description: 'Agua mineral sin gas' },
                { id: 12, name: 'Cerveza', price: 6.00, description: 'Cerveza nacional' }
            ],
            postres: [
                { id: 13, name: 'Suspiro Limeño', price: 10.00, description: 'Dulce tradicional peruano' },
                { id: 14, name: 'Mazamorra Morada', price: 8.00, description: 'Postre de maíz morado' },
                { id: 15, name: 'Tres Leches', price: 9.00, description: 'Torta húmeda con tres leches' },
                { id: 16, name: 'Helado Artesanal', price: 7.00, description: 'Helado de sabores tropicales' }
            ]
        };
    }

    setupEventListeners() {
        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.switchScreen(screen);
            });
        });

        // Table selection se maneja ahora en renderTables() ya que las mesas son dinámicas

        // Step navigation
        document.getElementById('continue-to-products').addEventListener('click', () => {
            this.goToStep('products');
        });

        document.getElementById('back-to-table').addEventListener('click', () => {
            this.goToStep('table');
        });

        document.getElementById('continue-to-preview').addEventListener('click', () => {
            this.goToStep('preview');
        });

        document.getElementById('back-to-products').addEventListener('click', () => {
            this.goToStep('products');
        });

        // Category selection
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectCategory(e.currentTarget.dataset.category);
            });
        });

        // Create order
        document.getElementById('create-order').addEventListener('click', () => {
            this.createOrder();
        });

        // Modal events
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshApp();
        });

        // Global functions
        window.switchToNewOrder = () => {
            this.switchScreen('new-order');
        };

        window.viewOrder = (orderId) => {
            this.viewOrderDetail(orderId);
        };

        window.deleteOrder = (orderId) => {
            this.deleteOrder(orderId);
        };
    }

    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('main-app').style.display = 'flex';
        }, 1000);
    }

    switchScreen(screenName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');

        // Update screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(`${screenName}-screen`).classList.add('active');

        this.currentScreen = screenName;

        // Reset new order if switching away
        if (screenName !== 'new-order') {
            this.resetNewOrder();
        }
    }

    goToStep(stepName) {
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById(`step-${stepName}`).classList.add('active');
        this.currentStep = stepName;

        if (stepName === 'preview') {
            this.updateOrderPreview();
        }
    }

    selectTable(tableNumber) {
        const tableCard = document.querySelector(`[data-table="${tableNumber}"]`);
        const tableIndex = this.selectedTables.indexOf(tableNumber);
        
        if (tableIndex === -1) {
            // Agregar mesa a la selección
            this.selectedTables.push(tableNumber);
            tableCard.classList.add('selected');
        } else {
            // Quitar mesa de la selección
            this.selectedTables.splice(tableIndex, 1);
            tableCard.classList.remove('selected');
        }
        
        // Actualizar el texto del botón y habilitarlo si hay mesas seleccionadas
        const continueBtn = document.getElementById('continue-to-products');
        if (this.selectedTables.length > 0) {
            continueBtn.disabled = false;
            const mesasText = this.selectedTables.length === 1 ? 'mesa' : 'mesas';
            continueBtn.textContent = `Continuar (${this.selectedTables.length} ${mesasText})`;
        } else {
            continueBtn.disabled = true;
            continueBtn.textContent = 'Continuar';
        }
    }

    selectCategory(category) {
        // Update category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        this.currentCategory = category;
        this.renderProducts();
    }

    renderProducts() {
        const container = document.getElementById('products-grid');
        const products = this.products[this.currentCategory] || [];

        container.innerHTML = products.map(product => {
            const quantity = this.selectedProducts.get(product.id) || 0;
            return `
                <div class="product-card ${quantity > 0 ? 'selected' : ''}" data-product="${product.id}">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-description">${product.description}</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="app.updateProductQuantity(${product.id}, -1)">-</button>
                        <span class="quantity-display">${quantity}</span>
                        <button class="quantity-btn" onclick="app.updateProductQuantity(${product.id}, 1)">+</button>
                    </div>
                </div>
            `;
        }).join('');

        this.updateContinueButton();
    }

    updateProductQuantity(productId, change) {
        const currentQuantity = this.selectedProducts.get(productId) || 0;
        const newQuantity = Math.max(0, currentQuantity + change);

        if (newQuantity === 0) {
            this.selectedProducts.delete(productId);
        } else {
            this.selectedProducts.set(productId, newQuantity);
        }

        this.renderProducts();
    }

    updateContinueButton() {
        const hasProducts = this.selectedProducts.size > 0;
        document.getElementById('continue-to-preview').disabled = !hasProducts;
    }

    updateOrderPreview() {
        const mesasText = this.selectedTables.length === 1 ? 'Mesa' : 'Mesas';
        document.getElementById('selected-table').textContent = `${mesasText}: ${this.selectedTables.join(', ')}`;
        
        const itemsContainer = document.getElementById('order-items');
        const totalElement = document.getElementById('order-total');
        
        let total = 0;
        let itemsHtml = '';

        this.selectedProducts.forEach((quantity, productId) => {
            const product = this.findProductById(productId);
            if (product) {
                const itemTotal = product.price * quantity;
                total += itemTotal;
                
                itemsHtml += `
                    <div class="order-item">
                        <div class="item-info">
                            <div class="item-name">${product.name}</div>
                            <div class="item-quantity">Cantidad: ${quantity}</div>
                        </div>
                        <div class="item-price">$${itemTotal.toFixed(2)}</div>
                    </div>
                `;
            }
        });

        itemsContainer.innerHTML = itemsHtml;
        totalElement.textContent = total.toFixed(2);
    }

    findProductById(productId) {
        for (const category of Object.values(this.products)) {
            const product = category.find(p => p.id === productId);
            if (product) return product;
        }
        return null;
    }

    createOrder() {
        const customerName = document.getElementById('customer-name').value.trim();
        
        const order = {
            id: Date.now(),
            tables: this.selectedTables.slice(), // Copia del array de mesas
            customer: customerName || 'Cliente',
            items: [],
            total: 0,
            timestamp: new Date(),
            status: 'active'
        };

        this.selectedProducts.forEach((quantity, productId) => {
            const product = this.findProductById(productId);
            if (product) {
                order.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: quantity,
                    total: product.price * quantity
                });
                order.total += product.price * quantity;
            }
        });

        this.orders.push(order);
        this.saveOrders();
        this.updateOrdersDisplay();
        
        // Show success and switch to orders
        this.showSuccess('Orden creada exitosamente');
        this.resetNewOrder();
        this.switchScreen('orders');
    }

    resetNewOrder() {
        this.selectedTables = [];
        this.selectedProducts.clear();
        this.currentStep = 'table';
        
        // Reset UI
        document.querySelectorAll('.table-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Reset continue button
        const continueBtn = document.getElementById('continue-to-products');
        continueBtn.disabled = true;
        continueBtn.textContent = 'Continuar';
        
        document.getElementById('continue-to-products').disabled = true;
        document.getElementById('continue-to-preview').disabled = true;
        document.getElementById('customer-name').value = '';
        
        this.goToStep('table');
        this.renderProducts();
    }

    updateOrdersDisplay() {
        const container = document.getElementById('orders-list');
        const countElement = document.getElementById('orders-count');
        
        countElement.textContent = `${this.orders.length} órdenes`;

        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>No hay órdenes activas</p>
                    <button class="btn-primary" onclick="switchToNewOrder()">Crear Primera Orden</button>
                </div>
            `;
        } else {
            container.innerHTML = this.orders.map(order => `
                <div class="order-card" onclick="viewOrder(${order.id})">
                    <div class="order-header">
                        <div class="order-number">Orden #${order.id.toString().slice(-4)}</div>
                        <div class="order-time">${this.formatTime(order.timestamp)}</div>
                    </div>
                    <div class="order-table">${order.tables ? `Mesas: ${order.tables.join(', ')}` : `Mesa ${order.table || 'N/A'}`}</div>
                    <div class="order-customer">${order.customer}</div>
                    <div class="order-total-card">Total: $${order.total.toFixed(2)}</div>
                </div>
            `).join('');
        }
    }

    viewOrderDetail(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.getElementById('order-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const deleteBtn = document.getElementById('delete-order-btn');

        title.textContent = `Orden #${order.id.toString().slice(-4)}`;
        
        body.innerHTML = `
            <div class="order-detail">
                <p><strong>${order.tables && order.tables.length > 1 ? 'Mesas' : 'Mesa'}:</strong> ${order.tables ? order.tables.join(', ') : order.table || 'N/A'}</p>
                <p><strong>Cliente:</strong> ${order.customer}</p>
                <p><strong>Fecha:</strong> ${this.formatDateTime(order.timestamp)}</p>
                <h4>Productos:</h4>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <div class="item-info">
                                <div class="item-name">${item.name}</div>
                                <div class="item-quantity">Cantidad: ${item.quantity} × $${item.price.toFixed(2)}</div>
                            </div>
                            <div class="item-price">$${item.total.toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <strong>Total: $${order.total.toFixed(2)}</strong>
                </div>
            </div>
        `;

        deleteBtn.onclick = () => {
            this.deleteOrder(orderId);
        };

        modal.classList.add('active');
    }

    deleteOrder(orderId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
            this.orders = this.orders.filter(o => o.id !== orderId);
            this.saveOrders();
            this.updateOrdersDisplay();
            this.closeModal();
            this.showSuccess('Orden eliminada');
        }
    }

    closeModal() {
        document.getElementById('order-modal').classList.remove('active');
    }

    showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 3000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    async refreshApp() {
        await this.loadTables();
        this.updateOrdersDisplay();
        this.renderProducts();
        this.showSuccess('Aplicación actualizada');
    }

    // Función específica para refrescar solo las mesas
    async refreshTables() {
        await this.loadTables();
        this.showSuccess('Mesas actualizadas');
    }

    formatTime(date) {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDateTime(date) {
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    saveOrders() {
        try {
            localStorage.setItem('marea-picante-orders', JSON.stringify(this.orders));
        } catch (error) {
            console.error('Error saving orders:', error);
        }
    }

    loadOrders() {
        try {
            const saved = localStorage.getItem('marea-picante-orders');
            if (saved) {
                this.orders = JSON.parse(saved).map(order => ({
                    ...order,
                    timestamp: new Date(order.timestamp)
                }));
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            this.orders = [];
        }
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MobileApp();
});

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or notification
    console.log('PWA install prompt available');
});

// Handle app installed
window.addEventListener('appinstalled', (evt) => {
    console.log('PWA was installed');
});

// Performance monitoring
window.addEventListener('load', () => {
    if ('performance' in window) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`App loaded in ${loadTime}ms`);
    }
});

// Memory management
window.addEventListener('beforeunload', () => {
    if (app) {
        app.saveOrders();
    }
});

// Handle visibility changes for battery optimization
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // App is hidden, reduce activity
        console.log('App hidden - reducing activity');
    } else {
        // App is visible, resume normal activity
        console.log('App visible - resuming activity');
        if (app) {
            app.refreshApp();
        }
    }
});