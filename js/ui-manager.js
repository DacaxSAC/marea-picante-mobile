// Manejador de UI para Marea Picante
import { CONFIG } from './config.js';

export class UIManager {
    constructor(dataManager, app = null) {
        this.dataManager = dataManager;
        this.app = app;
    }

    // Mostrar loading
    showLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
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
        const targetScreen = document.querySelector(`#${screenName}-screen`);
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

        const targetStep = document.getElementById(`step-${stepName}`);
        if (targetStep) {
            targetStep.classList.add('active');
            this.dataManager.setCurrentStep(stepName);
        }

        // Mostrar indicador si estamos agregando a orden existente
        if (stepName === 'categories' || stepName === 'products' || stepName === 'preview-add') {
            this.updateAddingToOrderIndicator();
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
            const isOccupied = table.state === 2;

            if (isSelected) {
                tableElement.classList.add('selected');
            }

            if (isOccupied) {
                tableElement.classList.add('occupied');
            }

            tableElement.innerHTML = `
                <div class="table-number">Mesa ${table.number || table.id}</div>
                <div class="table-status ${this.getTableStatusClass(table.state || 1)}">
                    ${this.getTableStatusText(table.state || 1)}
                </div>
            `;

            // Solo agregar event listener si la mesa no está ocupada
            if (!isOccupied) {
                tableElement.addEventListener('click', () => {
                    this.selectTable(table.number || table.id);
                });
            }

            tablesGrid.appendChild(tableElement);
        });
    }

    // Obtener texto de estado de mesa
    getTableStatusText(state) {
        switch (state) {
            case 1:
                return 'Disponible';
            case 2:
                return 'Ocupada';
            case 3:
                return 'Reservada';
            default:
                return 'Disponible';
        }
    }

    // Obtener clase CSS de estado de mesa
    getTableStatusClass(state) {
        switch (state) {
            case 1:
                return 'available';
            case 2:
                return 'occupied';
            case 3:
                return 'reserved';
            default:
                return 'available';
        }
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
                const categoryKey = e.currentTarget.dataset.category;
                const categoryId = parseInt(e.currentTarget.dataset.categoryId);
                this.selectCategory(categoryKey, categoryId);
            });

            categoriesContainer.appendChild(categoryBtn);
        });
    }

    // Seleccionar categoría
    selectCategory(category, categoryId = null) {
        // Actualizar botones de categoría
        document.querySelectorAll('.category-btn').forEach(btn => {
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

        let products = this.dataManager.getProductsByCategory(this.dataManager.currentCategoryId);
        
        // Excluir el producto "Delivery" de la lista de productos a mostrar
        products = products.filter(product => product.name !== 'Delivery');

        if (products.length === 0) {
            productsGrid.innerHTML = '<div class="no-products">No hay productos en esta categoría</div>';
            return;
        }

        // Remover event listeners anteriores clonando el elemento
        const newProductsGrid = productsGrid.cloneNode(false);
        productsGrid.parentNode.replaceChild(newProductsGrid, productsGrid);

        newProductsGrid.innerHTML = '';

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';

            const quantity = this.dataManager.selectedProducts.get(product.productId) || 0;

            // Determinar qué precios mostrar
            const hasPersonalPrice = product.pricePersonal && product.pricePersonal > 0;
            const hasFuentePrice = product.priceFuente && product.priceFuente > 0;

            // Obtener cantidades por tipo de precio
            const personalQuantity = this.dataManager.getProductQuantity(product.productId, 'personal');
            const fuenteQuantity = this.dataManager.getProductQuantity(product.productId, 'fuente');

            let priceHTML = '';
            if (hasPersonalPrice && hasFuentePrice) {
                // Mostrar ambos precios con controles separados (solo cuando ambos precios son válidos)
                priceHTML = `
                        <div class="price-option">
                            <div class="price-info">
                                <span class="price-label">Personal:</span>
                                <span class="price-value">S/ ${product.pricePersonal.toFixed(2)}</span>
                            </div>
                            <div class="price-controls">
                                <button class="quantity-btn minus" data-product-id="${product.productId}" data-price-type="personal" data-change="-1">-</button>
                                <span class="quantity">${personalQuantity}</span>
                                <button class="quantity-btn plus" data-product-id="${product.productId}" data-price-type="personal" data-change="1">+</button>
                            </div>
                        </div>
                        <div class="price-option">
                            <div class="price-info">
                                <span class="price-label">Fuente:</span>
                                <span class="price-value">S/ ${product.priceFuente.toFixed(2)}</span>
                            </div>
                            <div class="price-controls">
                                <button class="quantity-btn minus" data-product-id="${product.productId}" data-price-type="fuente" data-change="-1">-</button>
                                <span class="quantity">${fuenteQuantity}</span>
                                <button class="quantity-btn plus" data-product-id="${product.productId}" data-price-type="fuente" data-change="1">+</button>
                            </div>
                        </div>
                `;
            } else if (hasPersonalPrice && !hasFuentePrice) {
                // Solo precio personal (sin etiqueta cuando no hay precio fuente)
                priceHTML = `
                    <div class="product-price">S/ ${product.pricePersonal.toFixed(2)}</div>
                    <div class="product-controls">
                        <button class="quantity-btn minus" data-product-id="${product.productId}" data-price-type="personal" data-change="-1">-</button>
                        <span class="quantity">${personalQuantity}</span>
                        <button class="quantity-btn plus" data-product-id="${product.productId}" data-price-type="personal" data-change="1">+</button>
                    </div>
                `;
            } else if (hasFuentePrice && !hasPersonalPrice) {
                // Solo precio fuente
                priceHTML = `
                    <div class="product-price">S/ ${product.priceFuente.toFixed(2)}</div>
                    <div class="product-controls">
                        <button class="quantity-btn minus" data-product-id="${product.productId}" data-price-type="fuente" data-change="-1">-</button>
                        <span class="quantity">${fuenteQuantity}</span>
                        <button class="quantity-btn plus" data-product-id="${product.productId}" data-price-type="fuente" data-change="1">+</button>
                    </div>
                `;
            } else {
                priceHTML = `<div class="product-price">Precio no disponible</div>`;
            }

            productCard.innerHTML = `
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    ${priceHTML}
                </div>
            `;

            newProductsGrid.appendChild(productCard);
        });

        // Agregar event listeners para los botones de cantidad
        newProductsGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('quantity-btn')) {
                const productId = parseInt(e.target.dataset.productId);
                const change = parseInt(e.target.dataset.change);
                const priceType = e.target.dataset.priceType || 'personal';
                this.updateProductQuantity(productId, change, priceType);
            }
        });
    }

    // Actualizar cantidad de producto
    updateProductQuantity(productId, change, priceType = 'personal') {
        console.log('updateProductQuantity llamado con:', productId, change, priceType);
        this.dataManager.updateProductQuantity(productId, change, priceType);
        console.log('Productos seleccionados después del cambio:', this.dataManager.selectedProducts);

        // Solo actualizar la cantidad mostrada en el producto específico y tipo de precio
        const button = document.querySelector(`[data-product-id="${productId}"][data-price-type="${priceType}"]`);
        if (button) {
            const productCard = button.closest('.product-card');
            const quantitySpan = button.parentElement.querySelector('.quantity');
            const newQuantity = this.dataManager.getProductQuantity(productId, priceType);
            quantitySpan.textContent = newQuantity;
        }

        this.updateContinueButton();
        this.updateOrderPreview();
    }

    // Actualizar botón continuar
    updateContinueButton() {
        const currentStep = this.dataManager.currentStep;
        const continueBtn = document.querySelector(`#step-${currentStep} .continue-btn`);

        if (continueBtn) {
            let shouldEnable = false;

            if (currentStep === 'tables') {
                // En el paso de mesas, habilitar si hay mesas seleccionadas y la impresora está conectada (si es requerida)
                const hasSelectedTables = this.dataManager.selectedTables.length > 0;
                // const isPrinterConnected = !CONFIG.PRINTER.ENABLED || this.app.printerService.isConnected;
                shouldEnable = hasSelectedTables; // && isPrinterConnected;
            } else if (currentStep === 'products') {
                // En el paso de productos, habilitar si hay productos seleccionados
                shouldEnable = this.dataManager.selectedProducts.size > 0;

                // Cambiar texto del botón si estamos agregando a orden existente
                if (this.app && this.app.addingToExistingOrder) {
                    continueBtn.textContent = 'Ver Resumen';
                } else {
                    continueBtn.textContent = 'Continuar';
                }
            }

            continueBtn.disabled = !shouldEnable;
        }
    }

    // Actualizar vista previa de orden
    updateOrderPreview() {
        // Actualizar el preview en el paso de productos
        const orderPreview = document.querySelector('.order-preview');
        if (orderPreview) {
            this.updateOrderPreviewContent(orderPreview);
        }

        // Actualizar el resumen en el paso preview
        const orderItems = document.getElementById('order-items');
        const orderTotal = document.getElementById('order-total');
        const selectedTable = document.getElementById('selected-table');

        if (orderItems && orderTotal) {
            const { itemsHtml, total } = this.generateOrderSummary();
            orderItems.innerHTML = itemsHtml;
            orderTotal.textContent = total.toFixed(2);
        }

        if (selectedTable) {
            const tables = this.dataManager.selectedTables.join(', ');
            selectedTable.textContent = tables || '-';
        }

        // Actualizar preview para agregar a orden existente
        this.updateAddOrderPreview();
    }

    // Actualizar preview para agregar a orden existente
    updateAddOrderPreview() {
        const addOrderPreview = document.getElementById('add-order-items');
        if (!addOrderPreview) return;

        const selectedProducts = this.dataManager.selectedProducts;

        if (selectedProducts.size === 0) {
            addOrderPreview.innerHTML = '<div class="empty-selection">No hay productos seleccionados</div>';
            const addOrderTotal = document.getElementById('add-order-total');
            if (addOrderTotal) {
                addOrderTotal.textContent = '0.00';
            }
            return;
        }

        const { itemsHtml, total } = this.generateAddOrderSummary();
        addOrderPreview.innerHTML = itemsHtml;

        // Actualizar total
        const addOrderTotal = document.getElementById('add-order-total');
        if (addOrderTotal) {
            addOrderTotal.textContent = total.toFixed(2);
        }
    }

    // Generar resumen específico para agregar a orden existente
    generateAddOrderSummary() {
        let total = 0;
        let itemsHtml = '';

        if (this.dataManager.selectedProducts.size === 0) {
            return { itemsHtml: '<div class="empty-order">No hay productos seleccionados</div>', total: 0 };
        }

        this.dataManager.selectedProducts.forEach((quantities, productId) => {
            const product = this.dataManager.findProductById(productId);
            if (product) {
                const hasPersonalPrice = product.pricePersonal && product.pricePersonal > 0;
                const hasFuentePrice = product.priceFuente && product.priceFuente > 0;
                const hasBothPrices = hasPersonalPrice && hasFuentePrice;
                
                // Agregar item para precio personal si hay cantidad
                if (quantities.personal > 0) {
                    const subtotal = product.pricePersonal * quantities.personal;
                    total += subtotal;
                    const productName = hasBothPrices ? product.name + ' (Personal)' : product.name;

                    itemsHtml += `
                        <div class="order-item" data-product-id="${productId}" data-price-type="personal">
                            <div class="item-info">
                                <div class="item-left">
                                    <button class="comment-toggle" data-product-id="${productId}" data-price-type="personal">
                                        <span class="comment-icon">+</span>
                                    </button>
                                    <span class="item-name">${productName} x${quantities.personal}</span>
                                </div>
                                <div class="item-price">S/ ${subtotal.toFixed(2)}</div>
                            </div>
                            <div class="comment-input-container" style="display: none;">
                                <input type="text" class="comment-input" placeholder="Agregar comentario..." data-product-id="${productId}" data-price-type="personal">
                            </div>
                        </div>
                    `;
                }
                
                // Agregar item para precio fuente si hay cantidad
                if (quantities.fuente > 0) {
                    const subtotal = product.priceFuente * quantities.fuente;
                    total += subtotal;
                    const productName = hasBothPrices ? product.name + ' (Fuente)' : product.name;

                    itemsHtml += `
                        <div class="order-item" data-product-id="${productId}" data-price-type="fuente">
                            <div class="item-info">
                                <div class="item-left">
                                    <button class="comment-toggle" data-product-id="${productId}" data-price-type="fuente">
                                        <span class="comment-icon">+</span>
                                    </button>
                                    <span class="item-name">${productName} x${quantities.fuente}</span>
                                </div>
                                <span class="item-price">S/ ${subtotal.toFixed(2)}</span>
                            </div>
                            <div class="comment-input-container" style="display: none;">
                                <input type="text" class="comment-input" placeholder="Agregar comentario..." data-product-id="${productId}" data-price-type="fuente">
                            </div>
                        </div>
                    `;
                }
            }
        });

        // Calcular y mostrar cargos por delivery si está activado (usando el switch específico para agregar)
        const deliverySwitchAdd = document.getElementById('delivery-switch-add');
        const isDelivery = deliverySwitchAdd ? deliverySwitchAdd.checked : false;
        
        if (isDelivery) {
            let tapersPersonales = 0;
            let tapersFuente = 0;
            
            // Contar la cantidad de tapers necesarios
            this.dataManager.selectedProducts.forEach((quantities, productId) => {
                const product = this.dataManager.findProductById(productId);
                if (product) {
                    // Excluir guarniciones (categoryId: 10) y bebidas (categoryId: 11)
                    if (product.categoryId !== 10 && product.categoryId !== 11) {
                        tapersPersonales += quantities.personal || 0;
                        tapersFuente += quantities.fuente || 0;
                    }
                }
            });
            
            // Mostrar tapers como un solo item si hay cantidad
            if (tapersPersonales > 0 || tapersFuente > 0) {
                const subtotalPersonales = tapersPersonales * 1.00;
                const subtotalFuente = tapersFuente * 2.00;
                const totalTapers = subtotalPersonales + subtotalFuente;
                const cantidadTotal = tapersPersonales + tapersFuente;
                
                total += totalTapers;
                itemsHtml += `
                    <div class="order-item taper-charge">
                        <div class="item-info">
                            <div class="item-left">
                                <span class="item-name">
                                    <span class="delivery-icon">📦</span>
                                    Tapers descartables
                                </span>
                                <span class="item-quantity">x${cantidadTotal}</span>
                            </div>
                            <div class="item-price">S/ ${totalTapers.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }
            
            // Agregar cargo por delivery si se especificó
            const deliveryChargeInputAdd = document.getElementById('delivery-charge-add');
            const deliveryCharge = deliveryChargeInputAdd ? parseFloat(deliveryChargeInputAdd.value) || 0 : 0;
            
            if (deliveryCharge > 0) {
                total += deliveryCharge;
                itemsHtml += `
                    <div class="order-item delivery-charge">
                        <div class="item-info">
                            <div class="item-left">
                                <span class="item-name">
                                    <span class="delivery-icon">🚚</span>
                                    Cargo por delivery
                                </span>
                            </div>
                            <div class="item-price">S/ ${deliveryCharge.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }
        }

        return { itemsHtml, total };
    }

    // Generar resumen de orden
    generateOrderSummary() {
        let total = 0;
        let itemsHtml = '';

        if (this.dataManager.selectedProducts.size === 0) {
            return { itemsHtml: '<div class="empty-order">No hay productos seleccionados</div>', total: 0 };
        }

        this.dataManager.selectedProducts.forEach((quantities, productId) => {
            const product = this.dataManager.findProductById(productId);
            if (product) {
                const hasPersonalPrice = product.pricePersonal && product.pricePersonal > 0;
                const hasFuentePrice = product.priceFuente && product.priceFuente > 0;
                const hasBothPrices = hasPersonalPrice && hasFuentePrice;
                
                // Agregar item para precio personal si hay cantidad
                if (quantities.personal > 0) {
                    const subtotal = product.pricePersonal * quantities.personal;
                    total += subtotal;
                    const productName = hasBothPrices ? product.name + ' (Personal)' : product.name;

                    itemsHtml += `
                        <div class="order-item" data-product-id="${productId}" data-price-type="personal">
                            <div class="item-info">
                                <div class="item-left">
                                    <button class="comment-toggle" data-product-id="${productId}" data-price-type="personal">
                                        <span class="comment-icon">+</span>
                                    </button>
                                    <span class="item-name">${productName} x${quantities.personal}</span>
                                </div>
                                <div class="item-price">S/ ${subtotal.toFixed(2)}</div>
                            </div>
                            <div class="comment-input-container" style="display: none;">
                                <input type="text" class="comment-input" placeholder="Agregar comentario..." data-product-id="${productId}" data-price-type="personal">
                            </div>
                        </div>
                    `;
                }

                // Agregar item para precio fuente si hay cantidad
                if (quantities.fuente > 0) {
                    const subtotal = product.priceFuente * quantities.fuente;
                    total += subtotal;
                    const productName = hasBothPrices ? product.name + ' (Fuente)' : product.name;

                    itemsHtml += `
                        <div class="order-item" data-product-id="${productId}" data-price-type="fuente">
                            <div class="item-info">
                                <div class="item-left">
                                    <button class="comment-toggle" data-product-id="${productId}" data-price-type="fuente">
                                        <span class="comment-icon">+</span>
                                    </button>
                                    <span class="item-name">${productName} x${quantities.fuente}</span>
                                </div>
                                <span class="item-price">S/ ${subtotal.toFixed(2)}</span>
                            </div>
                            <div class="comment-input-container" style="display: none;">
                                <input type="text" class="comment-input" placeholder="Agregar comentario..." data-product-id="${productId}" data-price-type="fuente">
                            </div>
                        </div>
                    `;
                }
            }
        });

        // Calcular y mostrar cargos por delivery si está activado
        const deliverySwitch = document.getElementById('delivery-switch');
        const isDelivery = deliverySwitch ? deliverySwitch.checked : false;
        
        if (isDelivery) {
            let tapersPersonales = 0;
            let tapersFuente = 0;
            
            // Contar la cantidad de tapers necesarios
            this.dataManager.selectedProducts.forEach((quantities, productId) => {
                const product = this.dataManager.findProductById(productId);
                if (product) {
                    // Excluir guarniciones (categoryId: 10) y bebidas (categoryId: 11)
                    if (product.categoryId !== 10 && product.categoryId !== 11) {
                        tapersPersonales += quantities.personal || 0;
                        tapersFuente += quantities.fuente || 0;
                    }
                }
            });
            
            // Mostrar tapers como un solo item si hay cantidad
            if (tapersPersonales > 0 || tapersFuente > 0) {
                const subtotalPersonales = tapersPersonales * 1.00;
                const subtotalFuente = tapersFuente * 2.00;
                const totalTapers = subtotalPersonales + subtotalFuente;
                const cantidadTotal = tapersPersonales + tapersFuente;
                
                total += totalTapers;
                itemsHtml += `
                    <div class="order-item taper-charge">
                        <div class="item-info">
                            <div class="item-left">
                                <span class="item-name">
                                    <span class="delivery-icon">📦</span>
                                    Tapers descartables
                                </span>
                                <span class="item-quantity">x${cantidadTotal}</span>
                            </div>
                            <div class="item-price">S/ ${totalTapers.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }
            
            // Agregar cargo por delivery
            const deliveryChargeInput = document.getElementById('delivery-charge');
            const deliveryFee = deliveryChargeInput ? parseFloat(deliveryChargeInput.value) || 0 : 0;
            
            if (deliveryFee > 0) {
                total += deliveryFee;
                itemsHtml += `
                    <div class="order-item delivery-charge">
                        <div class="item-info">
                            <div class="item-left">
                                <span class="item-name">
                                    <span class="delivery-icon">🚚</span>
                                    Cargo por delivery
                                </span>
                            </div>
                            <div class="item-price">S/ ${deliveryFee.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }
        }

        return { itemsHtml, total };
    }

    // Actualizar contenido del preview en el paso de productos
    updateOrderPreviewContent(orderPreview) {
        const { itemsHtml, total } = this.generateOrderSummary();

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
            const total = order.detalles.reduce((sum, item) => sum + Number(item.subtotal), 0).toFixed(2)
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            orderElement.innerHTML = `
                <div class="order-card" data-order-id="${order.orderId}" style="cursor: pointer;">
                    <div class="order-info">
                        <div class="order-tables">Mesa(s): ${order.tables.sort((a, b) => a.number - b.number).map(t => t.number).join(', ')}</div>
                        <div class="order-time">${this.formatTime(order.timestamp)}</div>
                    </div>
                    
                    <div class="order-status ${this.getOrderStatusClass(order.status)}">
                        ${this.getOrderStatusText(order.status)}
                    </div>
                    
                    <div class="order-total">
                        <span class="currency">S/</span>
                        <span class="amount">${total}</span>
                    </div>
                </div>
            `;

            // Agregar evento click a la card
            orderElement.querySelector('.order-card').addEventListener('click', () => {
                this.viewOrderDetail(order.orderId);
            });
            ordersContainer.appendChild(orderElement);
        });
    }

    // Ver detalle de orden
    viewOrderDetail(orderId) {
        const order = this.dataManager.orders.find(o => o.orderId === orderId);
        if (!order) return;
        const total = order.detalles.reduce((sum, item) => sum + Number(item.subtotal), 0).toFixed(2)

        const modal = document.querySelector('#order-modal');
        const modalTitle = document.querySelector('#modal-title');
        const modalBody = document.querySelector('#modal-body');

        if (!modal || !modalTitle || !modalBody) return;

        let itemsHtml = '';

        // Separar productos de la categoría "Otros" (ID 12)
        const otrosItems = order.detalles.filter(item => item.producto.categoryId === 12);
        const regularItems = order.detalles.filter(item => item.producto.categoryId !== 12);

        // Unir las listas con los productos de "Otros" al final
        const sortedDetalles = [...regularItems, ...otrosItems];

        sortedDetalles.forEach(item => {
            // Verificar si el producto tiene ambos precios válidos para determinar si mostrar etiquetas
            const product = item.producto;
            const hasPersonalPrice = product?.pricePersonal && product.pricePersonal > 0;
            const hasFuentePrice = product?.priceFuente && product.priceFuente > 0;
            const hasBothPrices = hasPersonalPrice && hasFuentePrice;
            
            const isOtro = product?.categoryId === 12;
            const priceTypeLabel = hasBothPrices ? 
                (item.priceType === 'fuente' ? ' (Fuente)' : item.priceType === 'personal' ? ' (Personal)' : '') : '';
            const priceTypeClass = item.priceType === 'fuente' ? 'price-fuente' : 'price-personal';

            const borderColor = isOtro ? '#8E44AD' : (item.priceType === 'fuente' ? '#FF6B35' : '#4ECDC4');
            const icon = isOtro ? '🥡' : (item.priceType === 'fuente' ? '🍽️' : '🍴');

            itemsHtml += `
                <div class="product-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 0.75rem; border-left: 4px solid ${borderColor};">
                    <div style="display: flex; align-items: center; flex: 1;">
                        <span style="font-size: 1.5rem; margin-right: 0.75rem;">${icon}</span>
                        <div>
                            <div style="font-weight: 700; color: #2c3e50; font-size: 1rem; margin-bottom: 0.25rem;">${product?.name}</div>
                            <div style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase; font-weight: 600;">${priceTypeLabel.replace(/[()]/g, '').trim() || 'Personal'}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <span style="background: #ecf0f1; color: #2c3e50; padding: 0.25rem 0.5rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">${item.quantity}x</span>
                            <span style="color: #7f8c8d; font-size: 0.875rem;">S/ ${Number(item.unitPrice).toFixed(2)}</span>
                        </div>
                        <div style="font-weight: 700; color: #27ae60; font-size: 1rem;">S/ ${Number(item.subtotal).toFixed(2)}</div>
                    </div>
                </div>
            `;
        });

        modalTitle.textContent = `Orden #${order.orderId}`;
        modalBody.innerHTML = `
            <div class="info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="info-item" style="display: flex; align-items: center; padding: 0.75rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <span style="font-size: 1.2rem; margin-right: 0.5rem;">👤</span>
                    <div>
                        <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; font-weight: 600;">Cliente</div>
                        <div style="font-weight: 600; color: #495057;">${order.customerName || 'Sin especificar'}</div>
                    </div>
                </div>
                <div class="info-item" style="display: flex; align-items: center; padding: 0.75rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <span style="font-size: 1.2rem; margin-right: 0.5rem;">🪑</span>
                    <div>
                        <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; font-weight: 600;">Mesa(s)</div>
                        <div style="font-weight: 600; color: #495057;">${order.tables.sort((a, b) => a.number - b.number).map(t => t.number).join(', ')}</div>
                    </div>
                </div>
            </div>
            <div class="info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="info-item" style="display: flex; align-items: center; padding: 0.75rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <span style="font-size: 1.2rem; margin-right: 0.5rem;">📅</span>
                    <div>
                        <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; font-weight: 600;">Fecha</div>
                        <div style="font-weight: 600; color: #495057;">${this.formatDateTime(order.timestamp)}</div>
                    </div>
                </div>
                <div class="info-item" style="display: flex; align-items: center; padding: 0.75rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <span style="font-size: 1.2rem; margin-right: 0.5rem;">📊</span>
                    <div>
                        <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; font-weight: 600;">Estado</div>
                        <div style="font-weight: 600; color: #495057;">
                            <span class="status-badge ${this.getOrderStatusClass(order.status)}" style="padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">${this.getOrderStatusText(order.status)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="order-items" style="margin-top: 1.5rem;">
                <div style="display: flex; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid #ecf0f1;">
                    <span style="font-size: 1.5rem; margin-right: 0.5rem;">🛒</span>
                    <h3 style="margin: 0; color: #2c3e50; font-weight: 700; font-size: 1.25rem;">Productos Ordenados</h3>
                </div>
                <div style="max-height: 300px; overflow-y: auto; padding-right: 0.5rem;">
                    ${itemsHtml}
                </div>
            </div>
            <div id="product-selector" class="product-selector" style="display: none;">
                <h4>Seleccionar Producto:</h4>
                <div id="product-categories-modal" class="categories-grid"></div>
                <div id="product-list-modal" class="products-grid"></div>
                <div class="product-actions">
                    <button id="cancel-add-product" class="btn-secondary">Cancelar</button>
                </div>
            </div>
        `;

        // Agregar footer con botón de acción
        const existingFooter = modal.querySelector('.modal-footer');
        if (existingFooter) {
            existingFooter.remove();
        }

        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        
        // Solo mostrar botón agregar si el estado no es 'paid' o 'cancelled'
        const showAddButton = order.status !== 'PAID' && order.status !== 'CANCELLED';
        
        footer.innerHTML = `
            <div style="display: flex; justify-content: ${showAddButton ? 'space-between' : 'flex-end'}; align-items: center; width: 100%;">
                ${showAddButton ? `
                <div class="">
                    <button id="add-product-btn" class="btn-primary" data-order-id="${order.orderId}">Agregar</button>
                </div>` : ''}
                <div class="order-total">
                    <h3>Total: S/ ${total}</h3>
                </div>
            </div>
        `;

        modal.querySelector('.modal-content').appendChild(footer);

        modal.classList.add('active');
    }

    // Cerrar modal
    closeModal() {
        const modal = document.querySelector('#order-modal');
        if (modal) {
            modal.classList.remove('active');
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

    updateAddingToOrderIndicator() {
        const indicator = document.querySelector('.adding-to-order-indicator');

        if (this.app && this.app.addingToExistingOrder) {
            if (!indicator) {
                // Crear el indicador si no existe
                const indicatorDiv = document.createElement('div');
                indicatorDiv.className = 'adding-to-order-indicator';
                indicatorDiv.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-plus-circle"></i>
                        Agregando productos a la Orden #${this.app.targetOrderId}
                        <button class="btn-cancel-add" onclick="app.hideProductSelector(); app.uiManager.switchScreen('orders');">Cancelar</button>
                    </div>
                `;

                const productsScreen = document.querySelector('#step-products');
                if (productsScreen) {
                    productsScreen.insertBefore(indicatorDiv, productsScreen.firstChild);
                }
            }
        } else {
            // Remover el indicador si existe
            if (indicator) {
                indicator.remove();
            }
        }
    }

    getOrderStatusText(status) {
        switch (status) {
            case 'PENDING':
                return 'Pendiente';
            case 'IN_PROGRESS':
                return 'En Progreso';
            case 'PAID':
                return 'Pagado';
            case 'CANCELLED':
                return 'Cancelado';
            default:
                return status;
        }
    }

    getOrderStatusClass(status) {
        switch (status) {
            case 'PENDING':
                return 'pending';
            case 'IN_PROGRESS':
                return 'in-progress';
            case 'PAID':
                return 'paid';
            case 'CANCELLED':
                return 'cancelled';
            default:
                return 'pending';
        }
    }
}