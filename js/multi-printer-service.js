// Servicio de múltiples impresoras Bluetooth para tickets
// Permite conectar hasta 3 tablets simultáneamente

import { PrinterService } from './printer-service.js';

export class MultiPrinterService {
    constructor() {
        this.printers = new Map(); // Map de deviceId -> PrinterService
        this.maxPrinters = 3;
        this.activePrinterId = null; // ID de la impresora activa para imprimir
        
        console.log('🔧 Inicializando MultiPrinterService...');
        
        // Cargar impresoras guardadas
        this.loadSavedPrinters();
    }

    // Verificar si Bluetooth está disponible
    isBluetoothAvailable() {
        return 'bluetooth' in navigator;
    }

    // Obtener número de impresoras conectadas
    getConnectedCount() {
        let count = 0;
        for (const printer of this.printers.values()) {
            if (printer.isConnected) {
                count++;
            }
        }
        return count;
    }

    // Verificar si hay al menos una impresora conectada
    get isConnected() {
        return this.getConnectedCount() > 0;
    }

    // Obtener lista de impresoras conectadas
    getConnectedPrinters() {
        const connected = [];
        for (const [deviceId, printer] of this.printers.entries()) {
            if (printer.isConnected) {
                connected.push({
                    deviceId,
                    name: printer.device?.name || 'Impresora desconocida',
                    isActive: deviceId === this.activePrinterId
                });
            }
        }
        return connected;
    }

    // Conectar nueva impresora
    async connect() {
        try {
            if (!this.isBluetoothAvailable()) {
                throw new Error('Bluetooth no está disponible en este dispositivo');
            }

            if (this.getConnectedCount() >= this.maxPrinters) {
                throw new Error(`Máximo ${this.maxPrinters} impresoras pueden estar conectadas simultáneamente`);
            }

            // Crear nueva instancia de PrinterService
            const newPrinter = new PrinterService();
            
            // Conectar la nueva impresora
            await newPrinter.connect();
            
            // Agregar al mapa de impresoras
            const deviceId = newPrinter.device.id;
            this.printers.set(deviceId, newPrinter);
            
            // Si es la primera impresora, hacerla activa
            if (!this.activePrinterId) {
                this.activePrinterId = deviceId;
            }
            
            // Configurar listener para desconexión
            newPrinter.device.addEventListener('gattserverdisconnected', () => {
                console.log(`🔌 Impresora ${newPrinter.device.name} desconectada`);
                this.handlePrinterDisconnection(deviceId);
            });
            
            // Guardar estado
            this.savePrintersState();
            
            console.log(`✅ Impresora ${newPrinter.device.name} conectada. Total: ${this.getConnectedCount()}/${this.maxPrinters}`);
            
            return {
                deviceId,
                name: newPrinter.device.name,
                totalConnected: this.getConnectedCount()
            };
            
        } catch (error) {
            console.error('❌ Error al conectar nueva impresora:', error);
            throw error;
        }
    }

    // Manejar desconexión de impresora
    handlePrinterDisconnection(deviceId) {
        if (this.printers.has(deviceId)) {
            this.printers.delete(deviceId);
            
            // Si era la impresora activa, seleccionar otra
            if (this.activePrinterId === deviceId) {
                const connectedPrinters = this.getConnectedPrinters();
                this.activePrinterId = connectedPrinters.length > 0 ? connectedPrinters[0].deviceId : null;
            }
            
            this.savePrintersState();
            console.log(`🗑️ Impresora ${deviceId} removida. Total: ${this.getConnectedCount()}/${this.maxPrinters}`);
        }
    }

    // Desconectar impresora específica
    async disconnectPrinter(deviceId) {
        try {
            if (this.printers.has(deviceId)) {
                const printer = this.printers.get(deviceId);
                await printer.disconnect();
                this.handlePrinterDisconnection(deviceId);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`❌ Error al desconectar impresora ${deviceId}:`, error);
            throw error;
        }
    }

    // Desconectar todas las impresoras
    async disconnectAll() {
        try {
            const disconnectPromises = [];
            for (const [deviceId, printer] of this.printers.entries()) {
                if (printer.isConnected) {
                    disconnectPromises.push(printer.disconnect());
                }
            }
            
            await Promise.all(disconnectPromises);
            this.printers.clear();
            this.activePrinterId = null;
            this.clearSavedPrinters();
            
            console.log('🔌 Todas las impresoras desconectadas');
            return true;
        } catch (error) {
            console.error('❌ Error al desconectar todas las impresoras:', error);
            throw error;
        }
    }

    // Establecer impresora activa
    setActivePrinter(deviceId) {
        if (this.printers.has(deviceId) && this.printers.get(deviceId).isConnected) {
            this.activePrinterId = deviceId;
            this.savePrintersState();
            console.log(`🎯 Impresora activa cambiada a: ${this.printers.get(deviceId).device.name}`);
            return true;
        }
        return false;
    }

    // Imprimir en la impresora activa
    async printOrder(order) {
        try {
            if (!this.activePrinterId || !this.printers.has(this.activePrinterId)) {
                throw new Error('No hay impresora activa disponible');
            }
            
            const activePrinter = this.printers.get(this.activePrinterId);
            if (!activePrinter.isConnected) {
                throw new Error('La impresora activa no está conectada');
            }
            
            await activePrinter.printOrder(order);
            console.log(`🖨️ Orden impresa en: ${activePrinter.device.name}`);
            return true;
        } catch (error) {
            console.error('❌ Error al imprimir orden:', error);
            throw error;
        }
    }

    // Imprimir ticket de cocina en la impresora activa
    async printKitchenTicket(order) {
        try {
            if (!this.activePrinterId || !this.printers.has(this.activePrinterId)) {
                throw new Error('No hay impresora activa disponible');
            }
            
            const activePrinter = this.printers.get(this.activePrinterId);
            if (!activePrinter.isConnected) {
                throw new Error('La impresora activa no está conectada');
            }
            
            await activePrinter.printKitchenTicket(order);
            console.log(`🍳 Ticket de cocina impreso en: ${activePrinter.device.name}`);
            return true;
        } catch (error) {
            console.error('❌ Error al imprimir ticket de cocina:', error);
            throw error;
        }
    }

    // Imprimir ticket de cocina para productos agregados
    async printKitchenTicketForAddedProducts(order, addedProducts) {
        try {
            if (!this.activePrinterId || !this.printers.has(this.activePrinterId)) {
                throw new Error('No hay impresora activa disponible');
            }
            
            const activePrinter = this.printers.get(this.activePrinterId);
            if (!activePrinter.isConnected) {
                throw new Error('La impresora activa no está conectada');
            }
            
            await activePrinter.printKitchenTicketForAddedProducts(order, addedProducts);
            console.log(`🍳 Ticket de productos agregados impreso en: ${activePrinter.device.name}`);
            return true;
        } catch (error) {
            console.error('❌ Error al imprimir ticket de productos agregados:', error);
            throw error;
        }
    }

    // Imprimir ticket de prueba en la impresora activa
    async printTest() {
        try {
            if (!this.activePrinterId || !this.printers.has(this.activePrinterId)) {
                throw new Error('No hay impresora activa disponible');
            }
            
            const activePrinter = this.printers.get(this.activePrinterId);
            if (!activePrinter.isConnected) {
                throw new Error('La impresora activa no está conectada');
            }
            
            await activePrinter.printTest();
            console.log(`🧪 Ticket de prueba impreso en: ${activePrinter.device.name}`);
            return true;
        } catch (error) {
            console.error('❌ Error al imprimir ticket de prueba:', error);
            throw error;
        }
    }

    // Guardar estado de las impresoras
    savePrintersState() {
        try {
            const state = {
                activePrinterId: this.activePrinterId,
                printers: [],
                timestamp: Date.now()
            };
            
            for (const [deviceId, printer] of this.printers.entries()) {
                if (printer.isConnected && printer.device) {
                    state.printers.push({
                        deviceId,
                        name: printer.device.name,
                        connected: true
                    });
                }
            }
            
            localStorage.setItem('multiPrinterState', JSON.stringify(state));
            console.log('💾 Estado de impresoras guardado');
        } catch (error) {
            console.error('❌ Error al guardar estado de impresoras:', error);
        }
    }

    // Cargar impresoras guardadas
    loadSavedPrinters() {
        try {
            const saved = localStorage.getItem('multiPrinterState');
            if (saved) {
                const state = JSON.parse(saved);
                // Verificar que la información no sea muy antigua (24 horas)
                const maxAge = 24 * 60 * 60 * 1000;
                if (Date.now() - state.timestamp < maxAge) {
                    console.log(`📱 Estado de impresoras encontrado: ${state.printers.length} impresoras guardadas`);
                    console.log('ℹ️ Para reconectar, usa el botón de conexión en la interfaz');
                    return state;
                }
            }
        } catch (error) {
            console.error('❌ Error al cargar estado de impresoras:', error);
        }
        return null;
    }

    // Limpiar impresoras guardadas
    clearSavedPrinters() {
        try {
            localStorage.removeItem('multiPrinterState');
            console.log('🗑️ Estado de impresoras eliminado');
        } catch (error) {
            console.error('❌ Error al eliminar estado de impresoras:', error);
        }
    }

    // Intentar reconexión con gesto del usuario
    async attemptReconnectWithUserGesture() {
        try {
            const savedState = this.loadSavedPrinters();
            if (!savedState || savedState.printers.length === 0) {
                console.log('ℹ️ No hay impresoras guardadas para reconectar');
                return false;
            }
            
            console.log(`🔄 Intentando reconectar ${savedState.printers.length} impresoras...`);
            
            // Nota: La reconexión automática no es posible con Web Bluetooth
            // El usuario debe conectar manualmente cada impresora
            console.log('ℹ️ Reconexión automática no disponible. Use el botón de conexión.');
            
            return false;
        } catch (error) {
            console.error('❌ Error en reconexión:', error);
            return false;
        }
    }
}