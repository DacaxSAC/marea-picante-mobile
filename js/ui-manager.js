// Manejador de UI para Marea Picante
import { CONFIG } from './config.js';

export class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // Ocultar loading
    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    // Cambiar pantalla
    switchScreen(screenName) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar la pantalla seleccionada
        const targetScreen = document.querySelector(`.${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.dataManager.setCurrentScreen(screenName);
        }
        
        // Actualizar navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-screen="${screenName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }

    // Ir a paso específico
    goToStep(stepName) {
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        
        const targetStep = document.querySelector(`.${stepName}-step`);
        if (targetStep) {
            targetStep.classList.add('active');
            this.dataManager.setCurrentStep(stepName);
        }
    }

    // Renderizar mesas
    renderTables() {
        const tablesGrid = document.querySelector('.tables-grid');
        if (!tablesGrid) return;
        
        if (this.dataManager.tables.length === 0) {
            tablesGrid.innerHTML = '<div class="no-tables">No hay mesas disponibles</div>';
            return;
        }
        
        tablesGrid.innerHTML = '';
        
        this.dataManager.tables.forEach(table => {
            const tableElement = document.createElement('div');
            tableElement.className = 'table-item';
            tableElement.dataset.table = table.number || table.id;
            
            const isSelected = this.dataManager.selectedTables.includes(table.number || table.id);
            if (isSelected) {
                tableElement.classList.add('selected');
            }
            
            tableElement.innerHTML = `
                <div class="table-number">Mesa ${table.number || table.id}</div>
                <div class="table-status ${table.status || 'available'}">
                    ${this.getTableStatusText(table.status || 'available')}
                </div>
            `;
            
            tableElement.addEventListener('click', () => {
                this.selectTable(table.number || table.id);
            });
            
            tablesGrid.appendChild(tableElement);
        });
    }

    // Obtener texto de estado de mesa
    getTableStatusText(status) {
        const statusTexts = {
            'available': 'Disponible',
            'occupied': 'Ocupada',
            'reserved': 'Reservada',
            'cleaning': 'Limpieza'
        };
        return statusTexts[status] || 'Disponible';
    }

    // Seleccionar mesa
    selectTable(tableNumber) {
        this.dataManager.toggleTableSelection(tableNumber);
        this.renderTables();
        this.updateContinueButton();
    }

    // Renderizar categorías
    renderCategories() {
        const categoriesContainer = document.querySelector('.products-categories');
        if (!categoriesContainer) return;

        categoriesContainer.innerHTML = '';
        
        this.dataManager.categories.forEach((category, index) => {
            const categoryBtn = document.createElement('button');
            categoryBtn.className = `category-btn ${index === 0 ? 'active' : ''}`;
            categoryBtn.dataset.category = category.key || category.name.toLowerCase();
            categoryBtn.dataset.categoryId = category.id || category.categoryId || (index + 1);
            categoryBtn.textContent = category.displayName || category.name;
            
            categoryBtn.addEventListener('click', (e) => {
                debugger
                const categoryKey = e.currentTarget.dataset.category;
                const categoryId = parseInt(e.currentTarget.dataset.categoryId);
                this.selectCategory(categoryKey, categoryId);
            });
            
            categoriesContainer.appendChild(categoryBtn);
        });
    }

    // Seleccionar categoría
    selectCategory(category, categoryId = null) {
        debugger
        // Actualizar botones de categoría
        document.querySelectorAll('.category-btn').forEach(btn => {
            debugger
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-category="${category}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.dataManager.setCurrentCategory(category, categoryId);
        this.renderProducts();
    }

    // Renderizar productos
    renderProducts() {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) return;
        
        const products = this.dataManager.getProductsByCategory(this.dataManager.currentCategoryId);
        
        if (products.length === 0) {
            productsGrid.innerHTML = '<div class="no-products">No hay productos en esta categoría</div>';
            return;
        }
        
        productsGrid.innerHTML = '';
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            const quantity = this.dataManager.selectedProducts.get(product.id) || 0;
            
            productCard.innerHTML = `
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">S/ ${product.pricePersonal.toFixed(2)}</div>
                </div>
                <div class="product-controls">
                    <button class="quantity-btn minus" data-product-id="${product.id}" data-change="-1">-</button>
                    <span class="quantity">${quantity}</span>
                    <button class="quantity-btn plus" data-product-id="${product.id}" data-change="1">+</button>
                </div>
            `;
            
            productsGrid.appendChild(productCard);
        });
        
        // Agregar event listeners para los botones de cantidad
        productsGrid.addEventListener('click', (e) => {
            debugger
            if (e.target.classList.contains('quantity-btn')) {
                const productId = parseInt(e.target.dataset.productId);
                const change = parseInt(e.target.dataset.change);
                this.updateProductQuantity(productId, change);
            }
        });
    }

    // Actualizar cantidad de producto
    updateProductQuantity(productId, change) {
        this.dataManager.updateProductQuantity(productId, change);
        this.renderProducts();
        this.updateContinueButton();
        this.updateOrderPreview();
    }

    // Actualizar botón continuar
    updateContinueButton() {
        const continueBtn = document.querySelector('.continue-btn');
        if (continueBtn) {
            const hasSelection = this.dataManager.selectedTables.length > 0 || this.dataManager.selectedProducts.size > 0;
            continueBtn.disabled = !hasSelection;
        }
    }

    // Actualizar vista previa de orden
    updateOrderPreview() {
        const orderPreview = document.querySelector('.order-preview');
        if (!orderPreview) return;
        
        if (this.dataManager.selectedProducts.size === 0) {
            orderPreview.innerHTML = '<div class="empty-order">No hay productos seleccionados</div>';
            return;
        }
        
        let total = 0;
        let itemsHtml = '';
        
        this.dataManager.selectedProducts.forEach((quantity, productId) => {
            const product = this.dataManager.findProductById(productId);
            if (product) {
                const subtotal = product.price * quantity;
                total += subtotal;
                
                itemsHtml += `
                    <div class="order-item">
                        <span class="item-name">${product.name}</span>
                        <span class="item-quantity">x${quantity}</span>
                        <span class="item-price">S/ ${subtotal.toFixed(2)}</span>
                    </div>
                `;
            }
        });
        
        orderPreview.innerHTML = `
            <div class="order-items">${itemsHtml}</div>
            <div class="order-total">
                <strong>Total: S/ ${total.toFixed(2)}</strong>
            </div>
        `;
    }

    // Actualizar display de órdenes
    updateOrdersDisplay() {
        const ordersContainer = document.querySelector('.orders-list');
        if (!ordersContainer) return;
        
        if (this.dataManager.orders.length === 0) {
            ordersContainer.innerHTML = '<div class="no-orders">No hay órdenes registradas</div>';
            return;
        }
        
        ordersContainer.innerHTML = '';
        
        this.dataManager.orders.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            orderElement.innerHTML = `
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-tables">Mesa(s): ${order.tables.join(', ')}</span>
                    <span class="order-total">S/ ${order.total.toFixed(2)}</span>
                </div>
                <div class="order-time">${this.formatDateTime(order.timestamp)}</div>
                <div class="order-actions">
                    <button class="btn-view" data-order-id="${order.id}">Ver</button>
                    <button class="btn-delete" data-order-id="${order.id}">Eliminar</button>
                </div>
            `;
            
            ordersContainer.appendChild(orderElement);
        });
    }

    // Ver detalle de orden
    viewOrderDetail(orderId) {
        const order = this.dataManager.orders.find(o => o.id === orderId);
        if (!order) return;
        
        const modal = document.querySelector('.modal');
        const modalContent = document.querySelector('.modal-content');
        
        if (!modal || !modalContent) return;
        
        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
                <div class="order-detail-item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-details">
                        ${item.quantity} x S/ ${item.price.toFixed(2)} = S/ ${item.subtotal.toFixed(2)}
                    </span>
                </div>
            `;
        });
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Orden #${order.id}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="order-info">
                    <p><strong>Mesa(s):</strong> ${order.tables.join(', ')}</p>
                    <p><strong>Fecha:</strong> ${this.formatDateTime(order.timestamp)}</p>
                    <p><strong>Estado:</strong> ${order.status}</p>
                </div>
                <div class="order-items">
                    <h3>Productos:</h3>
                    ${itemsHtml}
                </div>
                <div class="order-total">
                    <h3>Total: S/ ${order.total.toFixed(2)}</h3>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    // Cerrar modal
    closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Mostrar mensaje de éxito
    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✓</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, CONFIG.SUCCESS_DURATION);
    }

    // Mostrar mensaje de error
    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">⚠</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Ocultar después de 4 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, CONFIG.NOTIFICATION_DURATION);
    }

    // Formatear tiempo
    formatTime(date) {
        return date.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Formatear fecha y hora
    formatDateTime(date) {
        return date.toLocaleString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}