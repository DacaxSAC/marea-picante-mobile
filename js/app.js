// Aplicación móvil de gestión de órdenes - Marea Picante
// Versión modular y optimizada

import { CONFIG } from './config.js';
import { DataManager } from './data-manager.js';
import { UIManager } from './ui-manager.js';

export class MobileApp {
    constructor() {
        this.dataManager = new DataManager();
        this.uiManager = new UIManager(this.dataManager);
        
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

        // Event listeners para órdenes
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-view')) {
                const orderId = parseInt(e.target.dataset.orderId);
                this.uiManager.viewOrderDetail(orderId);
            }
            
            if (e.target.classList.contains('btn-delete')) {
                const orderId = parseInt(e.target.dataset.orderId);
                this.deleteOrder(orderId);
            }
            
            if (e.target.classList.contains('close-modal')) {
                this.uiManager.closeModal();
            }
        });

        // Cerrar modal al hacer clic fuera
        const modal = document.querySelector('.modal');
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
            console.log('vvvv');
            
            if (this.dataManager.selectedProducts.size > 0) {
                console.log('aaa');
                
                this.uiManager.goToStep('preview');
                this.uiManager.updateOrderPreview();
            }
        }
    }

    // Crear orden
    async createOrder() {
        try {
            const order = await this.dataManager.createOrder();
            this.uiManager.showSuccess(CONFIG.MESSAGES.ORDER_CREATED);
            this.resetNewOrder();
            // Recargar órdenes desde el backend
            await this.dataManager.loadOrders();
            this.uiManager.updateOrdersDisplay();
            this.uiManager.switchScreen('orders');
        } catch (error) {
            console.error('Error al crear orden:', error);
            this.uiManager.showError('Error al crear la orden');
        }
    }

    // Eliminar orden
    async deleteOrder(orderId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
            const success = await this.dataManager.deleteOrder(orderId);
            if (success) {
                this.uiManager.showSuccess(CONFIG.MESSAGES.ORDER_DELETED);
                this.uiManager.updateOrdersDisplay();
            } else {
                this.uiManager.showError('Error al eliminar la orden');
            }
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

// PWA Install
let deferredPrompt;
let installButton;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir que el navegador muestre el prompt automáticamente
    e.preventDefault();
    
    // Guardar el evento para usarlo después
    deferredPrompt = e;
    
    console.log('PWA es instalable');
    
    // Mostrar botón de instalación personalizado
    showInstallButton();
});

window.addEventListener('appinstalled', (evt) => {
    console.log('PWA instalada exitosamente');
    
    // Ocultar el botón de instalación
    hideInstallButton();
    
    // Limpiar el prompt diferido
    deferredPrompt = null;
});

// Función para mostrar el botón de instalación
function showInstallButton() {
    // Crear botón si no existe
    if (!installButton) {
        installButton = document.createElement('button');
        installButton.id = 'install-pwa-btn';
        installButton.innerHTML = '📱 Instalar App';
        installButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: #2196F3;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        
        // Evento click para instalar
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                // Mostrar el prompt de instalación
                deferredPrompt.prompt();
                
                // Esperar la respuesta del usuario
                const { outcome } = await deferredPrompt.userChoice;
                
                console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
                
                // Limpiar el prompt diferido
                deferredPrompt = null;
                
                // Ocultar el botón
                hideInstallButton();
            }
        });
        
        document.body.appendChild(installButton);
    }
    
    installButton.style.display = 'block';
}

// Función para ocultar el botón de instalación
function hideInstallButton() {
    if (installButton) {
        installButton.style.display = 'none';
    }
}

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

