// Aplicación móvil de gestión de órdenes - Marea Picante
// Versión modular y optimizada

import { CONFIG } from './config.js';
import { DataManager } from './data-manager.js';
import { UIManager } from './ui-manager.js';
import { PrinterService } from './printer-service.js';

export class MobileApp {
    constructor() {
        this.dataManager = new DataManager();
        this.uiManager = new UIManager(this.dataManager, this);
        this.printerService = new PrinterService();
        this.addingToExistingOrder = false;
        this.targetOrderId = null;
        this.init();
    }

    async init() {
        try {
            // Cargar datos desde la API
            await this.loadAllData();
            
            // Cargar órdenes desde el backend
            await this.dataManager.loadOrders();
            
            // Cargar estado de la caja
            await this.updateCashRegisterStatus();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Inicializar UI
            this.uiManager.hideLoading();
            this.uiManager.renderProducts();
            this.uiManager.updateOrdersDisplay();
            
            // Verificar soporte de Bluetooth
            this.checkBluetoothSupport();
            
            // Verificar si la impresora se reconectó automáticamente
            setTimeout(() => {
                this.updatePrinterUI(this.printerService.isConnected);
            }, 1000); // Dar tiempo para la reconexión automática
            
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            this.uiManager.showError('Error al inicializar la aplicación');
        }
    }

    // Cargar todos los datos necesarios
    async loadAllData() {
        const loadingPromises = [
            this.loadTables(),
            this.loadCategories(),
            this.loadProducts()
        ];
        
        await Promise.all(loadingPromises);
    }

    // Cargar mesas
    async loadTables() {
        const success = await this.dataManager.loadTables();
        if (!success) {
            this.uiManager.showError(CONFIG.MESSAGES.ERROR_LOADING_TABLES);
        }
        this.uiManager.renderTables();
    }

    // Cargar categorías
    async loadCategories() {
        const success = await this.dataManager.loadCategories();
        if (!success) {
            this.uiManager.showError(CONFIG.MESSAGES.ERROR_LOADING_CATEGORIES);
        }
        this.uiManager.renderCategories();
    }

    // Cargar productos
    async loadProducts() {
        const success = await this.dataManager.loadProducts();
        if (!success) {
            this.uiManager.showError(CONFIG.MESSAGES.ERROR_LOADING_PRODUCTS);
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Navegación inferior
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                const screen = e.currentTarget.dataset.screen;
                
                if (screen) {
                    this.uiManager.switchScreen(screen);
                    
                    // Cargar órdenes cuando se navega a la pantalla de órdenes
                    if (screen === 'orders') {
                        await this.dataManager.loadOrders();
                        this.uiManager.updateOrdersDisplay();
                    }
                    
                    // Resetear datos cuando se navega a nueva orden
                    if (screen === 'new-order') {
                        this.resetNewOrder();
                    }
                }
            });
        });

        // Botones de paso
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const step = e.currentTarget.dataset.step;
                if (step) {
                    this.uiManager.goToStep(step);
                }
            });
        });

        // Botones continuar
        document.querySelectorAll('.continue-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleContinueAction();
            });
        })

        // Botón crear orden
        const createOrderBtn = document.querySelector('.create-order-btn');
        if (createOrderBtn) {
            createOrderBtn.addEventListener('click', () => {
                this.createOrder();
            });
        }

        // Botón nueva orden
        const newOrderBtn = document.querySelector('.new-order-btn');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => {
                this.resetNewOrder();
            });
        }

        // Botón refresh
        const refreshBtn = document.querySelector('#refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshApp();
            });
        }

        // Botones de navegación hacia atrás
        const backToTableBtn = document.getElementById('back-to-table');
        if (backToTableBtn) {
            backToTableBtn.addEventListener('click', () => {
                this.uiManager.goToStep('tables');
            });
        }

        const backToProductsBtn = document.getElementById('back-to-products');
        if (backToProductsBtn) {
            backToProductsBtn.addEventListener('click', () => {
                this.uiManager.goToStep('products');
            });
        }

        // Botón crear orden en el paso de preview
        const createOrderPreviewBtn = document.getElementById('create-order');
        if (createOrderPreviewBtn) {
            createOrderPreviewBtn.addEventListener('click', () => {
                this.createOrder();
            });
        }

        // Botón confirmar agregar productos a orden existente
        const confirmAddBtn = document.getElementById('confirm-add-to-order');
        
        // Controles de impresora
        const connectPrinterBtn = document.getElementById('connect-printer-btn');
        const disconnectPrinterBtn = document.getElementById('disconnect-printer-btn');
        const testPrintBtn = document.getElementById('test-print-btn');
        const autoPrintCheckbox = document.getElementById('auto-print-checkbox');
        
        if (connectPrinterBtn) {
            connectPrinterBtn.addEventListener('click', () => {
                this.connectPrinter();
            });
        }
        
        if (disconnectPrinterBtn) {
            disconnectPrinterBtn.addEventListener('click', () => {
                this.disconnectPrinter();
            });
        }
        
        if (testPrintBtn) {
            testPrintBtn.addEventListener('click', () => {
                this.printTestTicket();
            });
        }
        
        // Switch de delivery
        const deliverySwitch = document.getElementById('delivery-switch');
        const customerSection = document.getElementById('customer-section');
        
        if (deliverySwitch && customerSection) {
            deliverySwitch.addEventListener('change', () => {
                if (deliverySwitch.checked) {
                    customerSection.style.display = 'block';
                } else {
                    customerSection.style.display = 'none';
                    // Limpiar el campo cuando se oculta
                    const customerNameInput = document.getElementById('customer-name');
                    if (customerNameInput) {
                        customerNameInput.value = '';
                    }
                }
                // Actualizar el preview de la orden para mostrar/ocultar cargo por delivery
                this.uiManager.updateOrderPreview();
            });
        }
        
        // Event listener para el campo de cargo por delivery
         const deliveryChargeInput = document.getElementById('delivery-charge');
         if (deliveryChargeInput) {
             deliveryChargeInput.addEventListener('input', () => {
                 this.uiManager.updateOrderPreview();
             });
         }
        
        // Switch de delivery para agregar productos
        const deliverySwitchAdd = document.getElementById('delivery-switch-add');
        const customerSectionAdd = document.getElementById('customer-section-add');
        
        if (deliverySwitchAdd && customerSectionAdd) {
            deliverySwitchAdd.addEventListener('change', () => {
                if (deliverySwitchAdd.checked) {
                    customerSectionAdd.style.display = 'block';
                } else {
                    customerSectionAdd.style.display = 'none';
                    // Limpiar el campo cuando se oculta
                    const customerNameInputAdd = document.getElementById('customer-name-add');
                    if (customerNameInputAdd) {
                        customerNameInputAdd.value = '';
                    }
                }
                // Actualizar el preview de la orden para mostrar/ocultar cargo por delivery
                this.uiManager.updateAddOrderPreview();
            });
        }
        
        // Event listener para el campo de cargo por delivery en agregar productos
         const deliveryChargeInputAdd = document.getElementById('delivery-charge-add');
         if (deliveryChargeInputAdd) {
             deliveryChargeInputAdd.addEventListener('input', () => {
                 this.uiManager.updateAddOrderPreview();
             });
         }
        
        // Event listener para botones de comentario
        document.addEventListener('click', (e) => {
            if (e.target.closest('.comment-toggle')) {
                const button = e.target.closest('.comment-toggle');
                const orderItem = button.closest('.order-item');
                const container = orderItem.querySelector('.comment-input-container');
                const icon = button.querySelector('.comment-icon');
                
                if (container.style.display === 'none' || !container.style.display) {
                    container.style.display = 'block';
                    button.classList.add('active');
                    icon.textContent = '-';
                } else {
                    container.style.display = 'none';
                    button.classList.remove('active');
                    icon.textContent = '+';
                }
            }
        });
        
        if (autoPrintCheckbox) {
            autoPrintCheckbox.addEventListener('change', (e) => {
                CONFIG.PRINTER.AUTO_PRINT = e.target.checked;
                console.log('Impresión automática:', CONFIG.PRINTER.AUTO_PRINT ? 'activada' : 'desactivada');
            });
        }
        if (confirmAddBtn) {
            confirmAddBtn.addEventListener('click', () => {
                this.addProductToExistingOrder();
            });
        }

        // Event listeners para órdenes
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-view')) {
                const orderId = parseInt(e.target.dataset.orderId);
                this.uiManager.viewOrderDetail(orderId);
            }
            
            // Botón agregar producto en modal de orden
            if (e.target.id === 'add-product-btn') {
                const orderData = JSON.parse(e.target.dataset.order.replace(/&apos;/g, "'"));
                this.showProductSelector(orderData);
            }
            
            // Botón cancelar agregar producto
            if (e.target.id === 'cancel-add-product') {
                this.hideProductSelector();
            }
            
            if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal-close')) {
                this.uiManager.closeModal();
            }
        });

        // Cerrar modal al hacer clic fuera
        const modal = document.querySelector('#order-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.uiManager.closeModal();
                }
            });
        }

        // Tecla Escape para cerrar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.uiManager.closeModal();
            }
        })
        
        //  boton volver
        document.getElementById('back-to-table').addEventListener('click', function(event) {
            event.preventDefault(); // Previene el comportamiento por defecto si el botón está dentro de un formulario
            window.location.href = "index.html";
        });

    }

    // Manejar acción de continuar
    async handleContinueAction() {
        if (this.dataManager.currentStep === 'tables') {
            if (this.dataManager.selectedTables.length > 0) {
                // Validar que las mesas seleccionadas no estén ocupadas
                const isValid = await this.validateSelectedTables();
                if (isValid) {
                    this.uiManager.goToStep('products');
                }
            }
        } else if (this.dataManager.currentStep === 'products') {
            if (this.dataManager.selectedProducts.size > 0) {
                if (this.addingToExistingOrder) {
                    // Si estamos agregando a orden existente, ir al preview específico
                    this.uiManager.goToStep('preview-add');
                    this.uiManager.updateAddOrderPreview();
                } else {
                    // Flujo normal de nueva orden
                    this.uiManager.goToStep('preview');
                    this.uiManager.updateOrderPreview();
                }
            }
        }
    }

    // Validar que las mesas seleccionadas no estén ocupadas
    async validateSelectedTables() {
        const continueBtn = document.querySelector('#step-tables .continue-btn');
        const originalText = continueBtn.textContent;
        
        try {
            // Mostrar loader
            continueBtn.disabled = true;
            continueBtn.textContent = 'Verificando mesas...';
            
            // Recargar el estado actual de las mesas desde el backend
            await this.loadTables();
            
            // Verificar si alguna mesa seleccionada está ocupada
            const occupiedTables = [];
            for (const tableNumber of this.dataManager.selectedTables) {
                // Excluir mesa 0 (para llevar) de la validación
                if (tableNumber === 0) continue;
                
                const table = this.dataManager.tables.find(t => (t.number || t.id) === tableNumber);
                if (table && table.state === 2) {
                    occupiedTables.push(tableNumber);
                }
            }
            
            if (occupiedTables.length > 0) {
                alert(`Las siguientes mesas están ocupadas: ${occupiedTables.join(', ')}. Por favor, selecciona otras mesas.`);
                // Remover las mesas ocupadas de la selección
                occupiedTables.forEach(tableNumber => {
                    const index = this.dataManager.selectedTables.indexOf(tableNumber);
                    if (index > -1) {
                        this.dataManager.selectedTables.splice(index, 1);
                    }
                });
                // Actualizar la UI
                this.uiManager.renderTables();
                this.uiManager.updateContinueButton();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error al validar mesas:', error);
            alert('Error al verificar el estado de las mesas. Inténtalo de nuevo.');
            return false;
        } finally {
            // Restaurar el botón
            continueBtn.textContent = originalText;
            continueBtn.disabled = false;
            // Actualizar el estado del botón según las validaciones
            this.uiManager.updateContinueButton();
        }
    }

    // Crear orden
    async createOrder() {
        // Si estamos agregando a una orden existente, usar el método específico
        if (this.addingToExistingOrder) {
            return this.addProductToExistingOrder();
        }

        // Deshabilitar botones de crear orden
        const createOrderBtns = document.querySelectorAll('.create-order-btn, #create-order');
        createOrderBtns.forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Creando...';
        });
        
        // Mostrar loader
        this.uiManager.showLoading();

        try {
            const order = await this.dataManager.createOrder();
            
            // Imprimir ticket de cocina automáticamente si está habilitado y la impresora está conectada
            if (CONFIG.PRINTER.ENABLED && CONFIG.PRINTER.AUTO_PRINT && this.printerService.isConnected) {
                try {
                    console.log('🖨️ Imprimiendo ticket de cocina automáticamente...');
                    await this.printerService.printKitchenTicket(order);
                    this.uiManager.showSuccess('Orden creada y ticket de cocina impreso exitosamente');
                } catch (printError) {
                    console.error('❌ Error al imprimir ticket de cocina:', printError);
                    this.uiManager.showSuccess(CONFIG.MESSAGES.ORDER_CREATED);
                    this.uiManager.showError('Orden creada pero falló la impresión del ticket de cocina');
                }
            } else {
                this.uiManager.showSuccess(CONFIG.MESSAGES.ORDER_CREATED);
                if (CONFIG.PRINTER.ENABLED && CONFIG.PRINTER.AUTO_PRINT && !this.printerService.isConnected) {
                    this.uiManager.showError('Conecta la impresora para impresión automática');
                }
            }
            
            this.resetNewOrder();
            // Recargar órdenes y mesas desde el backend
            await this.dataManager.loadOrders();
            await this.loadTables();
            this.uiManager.updateOrdersDisplay();
            this.uiManager.renderTables();
            this.uiManager.switchScreen('orders');
        } catch (error) {
            console.error('Error al crear orden:', error);
            // Mostrar mensaje específico si es error de caja cerrada
            if (error.message && error.message.includes('caja debe estar abierta')) {
                this.uiManager.showError('No se puede crear la orden: La caja debe estar abierta para procesar órdenes');
            } else {
                this.uiManager.showError('Error al crear la orden');
            }
        } finally {
            // Ocultar loader y rehabilitar botones
            this.uiManager.hideLoading();
            createOrderBtns.forEach(btn => {
                btn.disabled = false;
                btn.textContent = 'Crear Orden';
            });
        }
    }

    // Resetear nueva orden
    resetNewOrder() {
        this.dataManager.resetNewOrder();
        this.uiManager.goToStep('tables');
        this.uiManager.switchScreen('new-order');
        this.uiManager.renderTables();
        this.uiManager.renderProducts();
        this.uiManager.updateOrderPreview();
        this.uiManager.updateAddOrderPreview();
        this.uiManager.updateContinueButton();
    }

    // Verificar soporte de Bluetooth
    checkBluetoothSupport() {
        const bluetoothSupportElement = document.getElementById('bluetooth-support');
        if (bluetoothSupportElement) {
            if (this.printerService.isBluetoothAvailable()) {
                bluetoothSupportElement.textContent = 'Disponible';
                bluetoothSupportElement.style.color = '#28a745';
            } else {
                bluetoothSupportElement.textContent = 'No disponible';
                bluetoothSupportElement.style.color = '#dc3545';
                // Deshabilitar controles de impresora
                this.disablePrinterControls();
            }
        }
    }

    // Deshabilitar controles de impresora
    disablePrinterControls() {
        const connectBtn = document.getElementById('connect-printer-btn');
        const disconnectBtn = document.getElementById('disconnect-printer-btn');
        const testBtn = document.getElementById('test-print-btn');
        
        if (connectBtn) connectBtn.disabled = true;
        if (disconnectBtn) disconnectBtn.disabled = true;
        if (testBtn) testBtn.disabled = true;
    }

    // Actualizar estado de la interfaz de impresora
    updatePrinterUI(connected = false) {
        const statusText = document.getElementById('printer-status-text');
        const statusIndicator = document.getElementById('printer-status-indicator');
        const connectBtn = document.getElementById('connect-printer-btn');
        const disconnectBtn = document.getElementById('disconnect-printer-btn');
        const testBtn = document.getElementById('test-print-btn');
        
        if (statusText) {
            statusText.textContent = connected ? 'Conectada' : 'Desconectada';
        }
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${connected ? 'online' : 'offline'}`;
        }
        
        if (connectBtn) connectBtn.disabled = connected;
        if (disconnectBtn) disconnectBtn.disabled = !connected;
        if (testBtn) testBtn.disabled = !connected;
    }

    // Conectar impresora manualmente
    async connectPrinter() {
        try {
            this.uiManager.showLoading();
            
            // Intentar reconectar con dispositivo guardado o conectar nuevo
            const connected = await this.printerService.attemptReconnectWithUserGesture();
            
            if (connected) {
                this.updatePrinterUI(true);
                this.uiManager.showSuccess('Impresora conectada exitosamente');
                return true;
            } else {
                this.updatePrinterUI(false);
                this.uiManager.showError('No se pudo conectar con la impresora');
                return false;
            }
        } catch (error) {
            console.error('Error al conectar impresora:', error);
            this.updatePrinterUI(false);
            this.uiManager.showError('Error al conectar con la impresora: ' + error.message);
            return false;
        } finally {
            this.uiManager.hideLoading();
        }
    }

    // Desconectar impresora
    async disconnectPrinter() {
        try {
            await this.printerService.disconnect();
            this.updatePrinterUI(false);
            this.uiManager.showSuccess('Impresora desconectada');
        } catch (error) {
            console.error('Error al desconectar impresora:', error);
            this.uiManager.showError('Error al desconectar impresora');
        }
    }

    // Imprimir ticket de prueba
    async printTestTicket() {
        try {
            this.uiManager.showLoading();
            await this.printerService.printTest();
            this.uiManager.showSuccess('Ticket de prueba impreso exitosamente');
        } catch (error) {
            console.error('Error al imprimir ticket de prueba:', error);
            this.uiManager.showError('Error al imprimir ticket de prueba: ' + error.message);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    // Reimprimir ticket de orden existente
    async reprintOrderTicket(orderId) {
        try {
            const order = this.dataManager.orders.find(o => o.orderId === orderId);
            if (!order) {
                throw new Error('Orden no encontrada');
            }
            
            this.uiManager.showLoading();
            await this.printerService.printOrder(order);
            this.uiManager.showSuccess('Ticket reimpreso exitosamente');
        } catch (error) {
            console.error('Error al reimprimir ticket:', error);
            this.uiManager.showError('Error al reimprimir ticket: ' + error.message);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    // Refrescar aplicación
    async refreshApp() {
        try {
            // Cargar todos los datos incluyendo órdenes
            await this.loadAllData();
            await this.dataManager.loadOrders();
            
            // Actualizar estado de la caja
            await this.updateCashRegisterStatus();
            
            // Actualizar la UI
            this.uiManager.renderTables();
            this.uiManager.renderProducts();
            this.uiManager.updateOrdersDisplay();
            
            this.uiManager.showSuccess('Datos actualizados correctamente');
        } catch (error) {
            console.error('Error al refrescar:', error);
            this.uiManager.showError('Error al actualizar los datos');
        }
    }

    // Refrescar solo mesas
    async refreshTables() {
        await this.loadTables();
    }

    // Actualizar estado de la caja
    async updateCashRegisterStatus() {
        try {
            const cashRegister = await this.dataManager.getCashRegisterStatus();
            this.updateCashRegisterUI(cashRegister);
        } catch (error) {
            console.error('Error al verificar estado de la caja:', error);
            this.updateCashRegisterUI(null);
        }
    }

    // Actualizar UI del estado de la caja
    updateCashRegisterUI(cashRegister) {
        const statusElement = document.getElementById('cash-register-status');
        const textElement = statusElement?.querySelector('.cash-text');
        
        if (statusElement && textElement) {
            // Remover clases anteriores
            statusElement.classList.remove('open', 'closed', 'loading');
            
            if (cashRegister && cashRegister.status === 'ABIERTA') {
                statusElement.classList.add('open');
                textElement.textContent = 'Caja Abierta';
            } else if (cashRegister && cashRegister.status === 'CERRADA') {
                statusElement.classList.add('closed');
                textElement.textContent = 'Caja Cerrada';
            } else {
                statusElement.classList.add('closed');
                textElement.textContent = 'Caja Cerrada';
            }
        }
    }

    showProductSelector(orderData) {
        this.addingToExistingOrder = true;
        this.targetOrderId = orderData.orderId;
        this.currentOrderInfo = orderData;
        this.uiManager.closeModal();
        this.dataManager.clearSelectedProducts();
        this.uiManager.switchScreen('new-order');
        this.uiManager.goToStep('products');
        
        // Configurar el switch de delivery basado en la orden
        const deliverySwitch = document.getElementById('delivery-switch-add');
        const customerSection = document.getElementById('customer-section-add');
        const customerNameInput = document.getElementById('customer-name-add');
        
        if (deliverySwitch && customerSection && customerNameInput) {
            const isDelivery = orderData.isDelivery || (!orderData.tables || orderData.tables.length === 0);
            
            deliverySwitch.checked = isDelivery;
            deliverySwitch.disabled = isDelivery; // Deshabilitar si ya es delivery
            
            if (isDelivery) {
                customerSection.style.display = 'block';
                customerNameInput.value = orderData.customerName || '';
            } else {
                customerSection.style.display = 'none';
                customerNameInput.value = '';
            }
        }
        
        this.uiManager.updateAddingToOrderIndicator();
    }

    hideProductSelector() {
        this.addingToExistingOrder = false;
        this.targetOrderId = null;
        this.uiManager.updateAddingToOrderIndicator();
        this.dataManager.clearSelectedProducts();
        this.uiManager.updateContinueButton();
        this.uiManager.updateOrderPreview();
    }

    async addProductToExistingOrder() {
        if (!this.addingToExistingOrder || !this.targetOrderId) {
            return this.createOrder();
        }

        const selectedProducts = this.dataManager.getSelectedProducts();
        if (selectedProducts.length === 0) {
            this.uiManager.showError('No hay productos seleccionados');
            return;
        }

        // Verificar si la impresora está conectada cuando la impresión automática está habilitada
        if (CONFIG.PRINTER.ENABLED && CONFIG.PRINTER.AUTO_PRINT && !this.printerService.isConnected) {
            this.uiManager.showError('Conecta la impresora antes de agregar productos');
            return;
        }

        // Deshabilitar botón de confirmar
        const confirmBtn = document.getElementById('confirm-add-to-order');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Agregando...';
        }
        
        // Mostrar loader
        this.uiManager.showLoading();

        try {
            // Verificar si es delivery para agregar tapers y cargo
            const deliverySwitchAdd = document.getElementById('delivery-switch-add');
            const isDelivery = deliverySwitchAdd ? deliverySwitchAdd.checked : false;
            
            // Enviar cada producto individualmente
            for (const product of selectedProducts) {
                const productData = {
                    productId: product.productId,
                    quantity: product.quantity,
                    unitPrice: product.unitPrice,
                    subtotal: product.unitPrice * product.quantity,
                    priceType: product.priceType || 'personal'
                };

                const response = await fetch(`${CONFIG.API_BASE_URL}/orders/${this.targetOrderId}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productData)
                });

                if (!response.ok) {
                    throw new Error(`Error al agregar ${product.name} a la orden`);
                }
            }
            
            // Si es delivery, agregar tapers y cargo por delivery
            if (isDelivery) {
                // Calcular tapers necesarios
                let tapersPersonales = 0;
                let tapersFuente = 0;
                
                this.dataManager.selectedProducts.forEach((quantities, productId) => {
                    const product = this.dataManager.findProductById(productId);
                    if (product && product.categoryId !== 10 && product.categoryId !== 11) {
                        tapersPersonales += quantities.personal || 0;
                        tapersFuente += quantities.fuente || 0;
                    }
                });
                
                // Buscar el producto "Taper" unificado en la base de datos
                const taperProduct = this.dataManager.data.allProducts.find(p => p.name === 'Taper');
                
                // Agregar tapers personales si hay cantidad
                if (tapersPersonales > 0) {
                    const taperPersonalData = {
                        productId: taperProduct ? taperProduct.productId : null,
                        quantity: tapersPersonales,
                        unitPrice: taperProduct ? taperProduct.pricePersonal : 1.00,
                        subtotal: tapersPersonales * (taperProduct ? taperProduct.pricePersonal : 1.00),
                        priceType: 'personal'
                    };
                    
                    const taperResponse = await fetch(`${CONFIG.API_BASE_URL}/orders/${this.targetOrderId}/products`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(taperPersonalData)
                    });
                    
                    if (!taperResponse.ok) {
                        throw new Error('Error al agregar tapers personales');
                    }
                }
                
                // Agregar tapers fuente si hay cantidad
                if (tapersFuente > 0) {
                    const taperFuenteData = {
                        productId: taperProduct ? taperProduct.productId : null,
                        quantity: tapersFuente,
                        unitPrice: taperProduct ? taperProduct.priceFuente : 2.00,
                        subtotal: tapersFuente * (taperProduct ? taperProduct.priceFuente : 2.00),
                        priceType: 'fuente'
                    };
                    
                    const taperResponse = await fetch(`${CONFIG.API_BASE_URL}/orders/${this.targetOrderId}/products`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(taperFuenteData)
                    });
                    
                    if (!taperResponse.ok) {
                        throw new Error('Error al agregar tapers fuente');
                    }
                }
                
                // Agregar cargo por delivery si se especificó
                const deliveryChargeInputAdd = document.getElementById('delivery-charge-add');
                const deliveryCharge = deliveryChargeInputAdd ? parseFloat(deliveryChargeInputAdd.value) || 0 : 0;
                
                if (deliveryCharge > 0) {
                    // Buscar el producto "Delivery" en la base de datos
                    const deliveryProduct = this.dataManager.data.allProducts.find(p => p.name === 'Delivery');
                    
                    const deliveryChargeData = {
                        productId: deliveryProduct ? deliveryProduct.productId : null,
                        quantity: 1,
                        unitPrice: deliveryCharge,
                        subtotal: deliveryCharge,
                        priceType: 'personal'
                    };
                    
                    const deliveryResponse = await fetch(`${CONFIG.API_BASE_URL}/orders/${this.targetOrderId}/products`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(deliveryChargeData)
                    });
                    
                    if (!deliveryResponse.ok) {
                        throw new Error('Error al agregar cargo por delivery');
                    }
                }
            }

            // Obtener la orden actualizada para imprimir ticket de cocina
            const updatedOrderResponse = await fetch(`${CONFIG.API_BASE_URL}/orders/${this.targetOrderId}`);
            if (updatedOrderResponse.ok) {
                const updatedOrder = await updatedOrderResponse.json();
                
                // Imprimir ticket de cocina automáticamente si está habilitado y la impresora está conectada
                if (CONFIG.PRINTER.ENABLED && CONFIG.PRINTER.AUTO_PRINT && this.printerService.isConnected) {
                    try {
                        console.log('🖨️ Imprimiendo ticket de cocina para productos agregados...');
                        
                        // Preparar solo los productos agregados para el ticket de cocina
                        const addedProductsForTicket = selectedProducts.map(product => ({
                            name: product.name,
                            quantity: product.quantity,
                            comment: product.comment || '',
                            priceType: product.priceType || 'personal',
                            product: {
                                name: product.name
                            }
                        }));
                        
                        // Usar el nuevo método que solo imprime productos agregados
                        await this.printerService.printKitchenTicketForAddedProducts(updatedOrder, addedProductsForTicket);
                        this.uiManager.showSuccess('Productos agregados y ticket de cocina impreso exitosamente');
                    } catch (printError) {
                        console.error('❌ Error al imprimir ticket de cocina:', printError);
                        this.uiManager.showSuccess('Productos agregados exitosamente');
                        this.uiManager.showError('Productos agregados pero falló la impresión del ticket de cocina');
                    }
                } else {
                    this.uiManager.showSuccess('Productos agregados a la orden exitosamente');
                    if (CONFIG.PRINTER.ENABLED && CONFIG.PRINTER.AUTO_PRINT && !this.printerService.isConnected) {
                        this.uiManager.showError('Conecta la impresora para impresión automática');
                    }
                }
            } else {
                this.uiManager.showSuccess('Productos agregados a la orden exitosamente');
            }
            
            // Limpiar todo después de agregar productos
            this.dataManager.clearSelectedProducts();
            
            // Limpiar campos específicos de la sección de agregar productos
            const deliverySwitchAddClean = document.getElementById('delivery-switch-add');
            const customerNameInputAddClean = document.getElementById('customer-name-add');
            const deliveryChargeInputAddClean = document.getElementById('delivery-charge-add');
            const customerSectionAddClean = document.getElementById('customer-section-add');
            
            if (deliverySwitchAddClean) {
                deliverySwitchAddClean.checked = false;
            }
            
            if (customerNameInputAddClean) {
                customerNameInputAddClean.value = '';
            }
            
            if (deliveryChargeInputAddClean) {
                deliveryChargeInputAddClean.value = '0';
            }
            
            if (customerSectionAddClean) {
                customerSectionAddClean.style.display = 'none';
            }
            
            // Limpiar comentarios de productos
            document.querySelectorAll('.comment-input').forEach(input => {
                input.value = '';
            });
            
            // Actualizar la interfaz visual para reflejar la limpieza
            this.uiManager.renderProducts();
            this.uiManager.updateOrderPreview();
            this.uiManager.updateAddOrderPreview();
            this.uiManager.updateContinueButton();
            
            this.addingToExistingOrder = false;
            this.targetOrderId = null;
            this.uiManager.switchScreen('orders');
            await this.dataManager.loadOrders();
            this.uiManager.updateOrdersDisplay();
        } catch (error) {
            console.error('Error:', error);
            this.uiManager.showError(error.message || 'Error al agregar productos a la orden');
        } finally {
            // Ocultar loader y rehabilitar botón
            this.uiManager.hideLoading();
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirmar';
            }
        }
    }
}

// Inicializar aplicación cuando el DOM esté listo
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MobileApp();
});

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registrado: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registro falló: ', registrationError);
            });
    });
}



// Performance monitoring
window.addEventListener('load', () => {
    if ('performance' in window) {
        console.log('Page load time:', performance.now());
    }
});

// Save data before unload and prevent reload if printer is connected
window.addEventListener('beforeunload', (event) => {
    if (app && app.dataManager) {
        app.dataManager.saveOrders();
    }
    
    // Prevenir recarga si la impresora está conectada
    if (app && app.printerService && app.printerService.isConnected) {
        event.preventDefault();
        event.returnValue = '¿Estás seguro de que quieres recargar la página? La impresora se desconectará.';
        return event.returnValue;
    }
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && app) {
        // Refresh data when app becomes visible
        app.refreshTables();
    }
    if (document.hidden && app && app.dataManager) {
        app.dataManager.saveOrders();
    }
});

// Prevenir recarga con atajos de teclado cuando la impresora está conectada
document.addEventListener('keydown', (event) => {
    if (app && app.printerService && app.printerService.isConnected) {
        // Prevenir F5
        if (event.key === 'F5') {
            event.preventDefault();
            alert('No puedes recargar la página mientras la impresora esté conectada. Desconéctala primero.');
            return false;
        }
        
        // Prevenir Ctrl+R (Windows/Linux) o Cmd+R (Mac)
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            alert('No puedes recargar la página mientras la impresora esté conectada. Desconéctala primero.');
            return false;
        }
        
        // Prevenir Ctrl+Shift+R (Windows/Linux) o Cmd+Shift+R (Mac) - recarga forzada
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
            event.preventDefault();
            alert('No puedes recargar la página mientras la impresora esté conectada. Desconéctala primero.');
            return false;
        }
    }
});

