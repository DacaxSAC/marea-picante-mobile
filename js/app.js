// Aplicación móvil de gestión de órdenes - Marea Picante
// Versión modular y optimizada

import { CONFIG } from './config.js';
import { DataManager } from './data-manager.js';
import { UIManager } from './ui-manager.js';

export class MobileApp {
    constructor() {
        this.dataManager = new DataManager();
        this.uiManager = new UIManager(this.dataManager, this);
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
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Inicializar UI
            this.uiManager.hideLoading();
            this.uiManager.renderProducts();
            this.uiManager.updateOrdersDisplay();
            
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
                const orderId = parseInt(e.target.dataset.orderId);
                this.showProductSelector(orderId);
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
    handleContinueAction() {
        if (this.dataManager.currentStep === 'tables') {
            if (this.dataManager.selectedTables.length > 0) {
                this.uiManager.goToStep('products');
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
            this.uiManager.showSuccess(CONFIG.MESSAGES.ORDER_CREATED);
            this.resetNewOrder();
            // Recargar órdenes y mesas desde el backend
            await this.dataManager.loadOrders();
            await this.loadTables();
            this.uiManager.updateOrdersDisplay();
            this.uiManager.renderTables();
            this.uiManager.switchScreen('orders');
        } catch (error) {
            console.error('Error al crear orden:', error);
            this.uiManager.showError('Error al crear la orden');
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
        this.uiManager.updateContinueButton();
    }

    // Refrescar aplicación
    async refreshApp() {
        try {
            // Cargar todos los datos incluyendo órdenes
            await this.loadAllData();
            await this.dataManager.loadOrders();
            
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

    showProductSelector(orderId) {
        this.addingToExistingOrder = true;
        this.targetOrderId = orderId;
        this.uiManager.closeModal();
        this.dataManager.clearSelectedProducts();
        this.uiManager.switchScreen('new-order');
        this.uiManager.goToStep('products');
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

        // Deshabilitar botón de confirmar
        const confirmBtn = document.getElementById('confirm-add-to-order');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Agregando...';
        }
        
        // Mostrar loader
        this.uiManager.showLoading();

        try {
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

            this.uiManager.showSuccess('Productos agregados a la orden exitosamente');
            this.dataManager.clearSelectedProducts();
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

// PWA Installation handling - Enhanced for tablet compatibility
let deferredPrompt;
let installPromptShown = false;

// Detectar si es tablet
function isTablet() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroidTablet = /android/i.test(userAgent) && !/mobile/i.test(userAgent);
    const isIPad = /ipad/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isLargeScreen = window.screen.width >= 768 && window.screen.height >= 1024;
    return isAndroidTablet || isIPad || isLargeScreen;
}

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA: Install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    installPromptShown = true;
    showInstallButton();
});

// Fallback para tablets que no disparan beforeinstallprompt
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!installPromptShown && isTablet()) {
            console.log('PWA: Tablet detected, showing manual install button');
            showManualInstallButton();
        }
    }, 3000);
});

function showInstallButton() {
    // Remove existing button if present
    const existingButton = document.getElementById('install-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    const installButton = document.createElement('button');
    installButton.innerHTML = '⬇️ Instalar';
    installButton.id = 'install-button';
    installButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: #4CAF50;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;
    
    installButton.addEventListener('click', installApp);
    document.body.appendChild(installButton);
}

async function installApp() {
    if (!deferredPrompt) {
        console.log('PWA: No install prompt available');
        return;
    }
    
    try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('PWA: Install outcome:', outcome);
        
        if (outcome === 'accepted') {
            console.log('PWA: User accepted the install prompt');
        } else {
            console.log('PWA: User dismissed the install prompt');
        }
    } catch (error) {
        console.error('PWA: Install error:', error);
    } finally {
        deferredPrompt = null;
        hideInstallButton();
    }
}

function showManualInstallButton() {
    // Remove existing button if present
    const existingButton = document.getElementById('install-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    const installButton = document.createElement('button');
    installButton.innerHTML = '📱 Instalar App';
    installButton.id = 'install-button';
    installButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: #FF9800;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;
    
    installButton.addEventListener('click', showManualInstallInstructions);
    document.body.appendChild(installButton);
}

function showManualInstallInstructions() {
    const modal = document.createElement('div');
    modal.id = 'install-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 400px;
        margin: 20px;
        text-align: center;
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    `;
    
    modalContent.innerHTML = `
        <h3 style="margin-top: 0; color: #333;">📱 Instalar Aplicación</h3>
        <p style="color: #666; line-height: 1.5;">Para instalar esta aplicación en tu tablet:</p>
        <ol style="text-align: left; color: #666; line-height: 1.6;">
            <li>Toca el menú del navegador (⋮)</li>
            <li>Busca "Instalar app" o "Añadir a pantalla de inicio"</li>
            <li>Confirma la instalación</li>
        </ol>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">Si no aparece la opción, tu dispositivo puede no ser compatible con PWAs.</p>
        <button id="close-modal" style="
            background: #2196F3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 15px;
        ">Entendido</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal events
    document.getElementById('close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function hideInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.remove();
    }
}

window.addEventListener('appinstalled', () => {
    console.log('PWA: App successfully installed');
    hideInstallButton();
});

// Performance monitoring
window.addEventListener('load', () => {
    if ('performance' in window) {
        console.log('Page load time:', performance.now());
    }
});

// Save data before unload
window.addEventListener('beforeunload', () => {
    if (app && app.dataManager) {
        app.dataManager.saveOrders();
    }
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && app) {
        // Refresh data when app becomes visible
        app.refreshTables();
    }
});

