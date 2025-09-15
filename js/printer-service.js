// Servicio de impresión Bluetooth para tickets
// Compatible con impresoras térmicas ESC/POS

export class PrinterService {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        
        // Configuración de la impresora
        this.config = {
            serviceUUID: '000018f0-0000-1000-8000-00805f9b34fb', // UUID común para impresoras
            characteristicUUID: '00002af1-0000-1000-8000-00805f9b34fb',
            deviceName: 'POS', // Nombre común de impresoras POS
            paperWidth: 32 // Ancho del papel en caracteres
        };
        
        console.log('🔧 Inicializando PrinterService...');
        
        // Verificar si hay dispositivo guardado para mostrar estado
        this.checkSavedDevice();
    }

    // Verificar si Bluetooth está disponible
    isBluetoothAvailable() {
        return 'bluetooth' in navigator;
    }

    // Guardar información del dispositivo en localStorage
    saveDeviceInfo(device) {
        try {
            const deviceInfo = {
                id: device.id,
                name: device.name,
                connected: true,
                timestamp: Date.now()
            };
            localStorage.setItem('printerDevice', JSON.stringify(deviceInfo));
            console.log('💾 Información del dispositivo guardada');
        } catch (error) {
            console.error('❌ Error al guardar información del dispositivo:', error);
        }
    }

    // Obtener información del dispositivo desde localStorage
    getSavedDeviceInfo() {
        try {
            const saved = localStorage.getItem('printerDevice');
            if (saved) {
                const deviceInfo = JSON.parse(saved);
                // Verificar que la información no sea muy antigua (24 horas)
                const maxAge = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
                if (Date.now() - deviceInfo.timestamp < maxAge) {
                    return deviceInfo;
                }
            }
        } catch (error) {
            console.error('❌ Error al obtener información del dispositivo:', error);
        }
        return null;
    }

    // Limpiar información del dispositivo guardada
    clearSavedDeviceInfo() {
        try {
            localStorage.removeItem('printerDevice');
            console.log('🗑️ Información del dispositivo eliminada');
        } catch (error) {
            console.error('❌ Error al eliminar información del dispositivo:', error);
        }
    }

    // Intentar reconexión automática
    checkSavedDevice() {
        const savedDevice = this.getSavedDeviceInfo();
        if (savedDevice) {
            console.log('📱 Dispositivo guardado encontrado:', savedDevice.name);
            console.log('ℹ️ Para reconectar, usa el botón de conexión en la interfaz');
        } else {
            console.log('ℹ️ No hay dispositivo guardado');
        }
    }

    async attemptReconnectWithUserGesture() {
        try {
            console.log('🔄 Iniciando reconexión con gesto del usuario...');
            
            if (!this.isBluetoothAvailable()) {
                console.log('❌ Bluetooth no disponible');
                return false;
            }

            const savedDevice = this.getSavedDeviceInfo();
            if (!savedDevice) {
                console.log('ℹ️ No hay dispositivo guardado, conectando nuevo dispositivo');
                return await this.connect();
            }

            console.log('🔄 Intentando reconectar a:', savedDevice.name);
            
            // Usar requestDevice con filtros para reconectar
            console.log('📱 Buscando dispositivo guardado...');
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { name: savedDevice.name },
                    { namePrefix: 'POS' },
                    { namePrefix: 'Printer' }
                ],
                optionalServices: [this.config.serviceUUID]
            });
            
            if (device && device.id === savedDevice.id) {
                console.log('✅ Dispositivo encontrado, intentando reconectar...');
                return await this.reconnectToDevice(device);
            } else {
                console.log('📱 Dispositivo no coincide, conectando el seleccionado');
                return await this.reconnectToDevice(device);
            }
        } catch (error) {
            console.log('❌ Error en reconexión:', error.message);
            return false;
        }
    }

    // Reconectar a un dispositivo específico
    async reconnectToDevice(device) {
        try {
            this.device = device;
            
            // Conectar al dispositivo
            const server = await this.device.gatt.connect();
            console.log('🔗 Reconectado al servidor GATT');

            // Obtener servicio
            const service = await server.getPrimaryService(this.config.serviceUUID);
            console.log('🔧 Servicio obtenido');

            // Obtener característica
            this.characteristic = await service.getCharacteristic(this.config.characteristicUUID);
            console.log('📡 Característica obtenida');

            this.isConnected = true;
            console.log('✅ Impresora reconectada automáticamente');
            
            // Configurar listener para desconexión
            this.device.addEventListener('gattserverdisconnected', () => {
                console.log('🔌 Impresora desconectada inesperadamente');
                this.isConnected = false;
                this.clearSavedDeviceInfo();
            });
            
            return true;
        } catch (error) {
            console.error('❌ Error al reconectar:', error);
            this.device = null;
            this.server = null;
            this.service = null;
            this.characteristic = null;
            this.isConnected = false;
            this.clearSavedDeviceInfo();
            return false;
        }
    }

    // Conectar a la impresora
    async connect() {
        try {
            if (!this.isBluetoothAvailable()) {
                throw new Error('Bluetooth no está disponible en este dispositivo');
            }

            // Verificar que estamos en un contexto de gesto del usuario
            if (!navigator.userActivation || !navigator.userActivation.isActive) {
                throw new Error('La conexión Bluetooth debe iniciarse desde una acción del usuario');
            }

            console.log('🔍 Buscando impresora Bluetooth...');
            
            // Solicitar dispositivo Bluetooth
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { namePrefix: 'POS' },
                    { namePrefix: 'Printer' },
                    { namePrefix: 'BT' },
                    { namePrefix: 'BlueTooth Printer' },
                    { services: [this.config.serviceUUID] }
                ],
                optionalServices: [this.config.serviceUUID]
            });

            console.log('📱 Dispositivo encontrado:', this.device.name);

            // Conectar al dispositivo
            const server = await this.device.gatt.connect();
            console.log('🔗 Conectado al servidor GATT');

            // Obtener servicio
            const service = await server.getPrimaryService(this.config.serviceUUID);
            console.log('🔧 Servicio obtenido');

            // Obtener característica
            this.characteristic = await service.getCharacteristic(this.config.characteristicUUID);
            console.log('📡 Característica obtenida');

            this.isConnected = true;
            console.log('✅ Impresora conectada correctamente');
            
            // Guardar información del dispositivo para reconexión automática
            this.saveDeviceInfo(this.device);
            
            // Configurar listener para desconexión
            this.device.addEventListener('gattserverdisconnected', () => {
                console.log('🔌 Impresora desconectada inesperadamente');
                this.isConnected = false;
                this.clearSavedDeviceInfo();
            });
            
            return true;
        } catch (error) {
            console.error('❌ Error al conectar impresora:', error);
            this.device = null;
            this.server = null;
            this.service = null;
            this.characteristic = null;
            this.isConnected = false;
            throw error;
        }
    }

    // Desconectar impresora
    async disconnect() {
        try {
            if (this.device && this.device.gatt.connected) {
                await this.device.gatt.disconnect();
            }
            
            this.device = null;
            this.server = null;
            this.service = null;
            this.characteristic = null;
            this.isConnected = false;
            
            // Limpiar información guardada al desconectar manualmente
            this.clearSavedDeviceInfo();
            
            console.log('🔌 Impresora desconectada');
            return true;
        } catch (error) {
            console.error('❌ Error al desconectar impresora:', error);
            this.isConnected = false;
            this.clearSavedDeviceInfo();
            throw error;
        }
    }

    // Enviar datos a la impresora
    async sendData(data) {
        try {
            if (!this.isConnected || !this.characteristic) {
                throw new Error('Impresora no conectada');
            }

            // Convertir string a bytes
            const encoder = new TextEncoder();
            const bytes = encoder.encode(data);
            
            // Enviar en chunks si es necesario (máximo 20 bytes por vez)
            const chunkSize = 20;
            for (let i = 0; i < bytes.length; i += chunkSize) {
                const chunk = bytes.slice(i, i + chunkSize);
                await this.characteristic.writeValue(chunk);
                // Pequeña pausa entre chunks
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            console.log('📄 Datos enviados a la impresora');
        } catch (error) {
            console.error('❌ Error al enviar datos:', error);
            throw error;
        }
    }

    // Comandos ESC/POS
    getESCCommands() {
        return {
            INIT: '\x1B\x40', // Inicializar impresora
            ALIGN_LEFT: '\x1B\x61\x00',
            ALIGN_CENTER: '\x1B\x61\x01',
            ALIGN_RIGHT: '\x1B\x61\x02',
            BOLD_ON: '\x1B\x45\x01',
            BOLD_OFF: '\x1B\x45\x00',
            UNDERLINE_ON: '\x1B\x2D\x01',
            UNDERLINE_OFF: '\x1B\x2D\x00',
            DOUBLE_HEIGHT: '\x1B\x21\x10',
            DOUBLE_WIDTH: '\x1B\x21\x20',
            DOUBLE_SIZE: '\x1B\x21\x30', // Doble altura y ancho
            EXTRA_LARGE: '\x1B\x21\x38', // Extra grande (altura x3)
            MEGA_SIZE: '\x1B\x21\x3F', // Máximo tamaño disponible
            NORMAL_SIZE: '\x1B\x21\x00',
            CUT_PAPER: '\x1D\x56\x00',
            FEED_LINE: '\x0A',
            FEED_LINES: (n) => '\x1B\x64' + String.fromCharCode(n)
        };
    }

    // Formatear texto para el ancho del papel
    formatText(text, align = 'left', isLargeText = false) {
        const maxWidth = this.config.paperWidth;
        let formatted = '';
        
        const lines = text.split('\n');
        lines.forEach(line => {
            if (line.length <= maxWidth) {
                switch (align) {
                    case 'center':
                        let padding = Math.floor((maxWidth - line.length) / 2);
                        // Ajustar padding para texto extra grande
                        if (isLargeText) {
                            padding = Math.max(0, padding - 5); // Reducir padding para compensar desplazamiento
                        }
                        formatted += ' '.repeat(padding) + line + '\n';
                        break;
                    case 'right':
                        formatted += ' '.repeat(maxWidth - line.length) + line + '\n';
                        break;
                    default:
                        formatted += line + '\n';
                }
            } else {
                // Dividir líneas largas
                for (let i = 0; i < line.length; i += maxWidth) {
                    formatted += line.substr(i, maxWidth) + '\n';
                }
            }
        });
        
        return formatted;
    }

    // Generar ticket de orden
    generateTicket(order) {
        const cmd = this.getESCCommands();
        let ticket = '';
        
        // Inicializar impresora
        ticket += cmd.INIT;
        
        // Encabezado
        ticket += cmd.ALIGN_CENTER + cmd.BOLD_ON + cmd.DOUBLE_HEIGHT;
        ticket += this.formatText('MAREA PICANTE', 'center');
        ticket += cmd.NORMAL_SIZE + cmd.BOLD_OFF;
        ticket += this.formatText('Restaurante', 'center');
        ticket += cmd.FEED_LINE;
        
        // Información de la orden
        ticket += cmd.ALIGN_LEFT;
        ticket += this.formatText('================================');
        ticket += this.formatText(`Orden #: ${order.orderId}`);
        ticket += this.formatText(`Fecha: ${new Date(order.timestamp).toLocaleString('es-PE')}`);
        ticket += this.formatText(`Mesa(s): ${order.tables.map(t => t.number).join(', ')}`);
        ticket += this.formatText('================================');
        ticket += cmd.FEED_LINE;
        
        // Productos
        ticket += cmd.BOLD_ON;
        ticket += this.formatText('PRODUCTOS:');
        ticket += cmd.BOLD_OFF;
        ticket += cmd.FEED_LINE;
        
        order.items.forEach(item => {
            const line1 = `${item.name}`;
            const line2 = `${item.quantity} x S/.${item.unitPrice.toFixed(2)} = S/.${item.subtotal.toFixed(2)}`;
            
            ticket += this.formatText(line1);
            ticket += this.formatText(line2);
            ticket += cmd.FEED_LINE;
        });
        
        // Total
        ticket += this.formatText('--------------------------------');
        const total = order.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        ticket += cmd.BOLD_ON + cmd.DOUBLE_HEIGHT;
        ticket += this.formatText(`TOTAL: S/.${total.toFixed(2)}`, 'right');
        ticket += cmd.NORMAL_SIZE + cmd.BOLD_OFF;
        ticket += this.formatText('================================');
        
        // Pie de página
        ticket += cmd.FEED_LINE;
        ticket += cmd.ALIGN_CENTER;
        ticket += this.formatText('¡Gracias por su preferencia!', 'center');
        ticket += this.formatText('Vuelva pronto', 'center');
        
        // Alimentar papel y cortar
        ticket += cmd.FEED_LINES(3);
        ticket += cmd.CUT_PAPER;
        
        return ticket;
    }

    // Generar ticket para cocina (simplificado)
    generateKitchenTicket(order) {
        const cmd = this.getESCCommands();
        let ticket = '';
        
        // Inicializar impresora
        ticket += cmd.INIT;
        
        // Espacios en blanco arriba
        ticket += cmd.FEED_LINE;
        ticket += cmd.FEED_LINE;
        
        // Título COCINA
        ticket += cmd.BOLD_ON + cmd.DOUBLE_HEIGHT;
        ticket += this.formatText('COCINA', 'center');
        ticket += cmd.BOLD_OFF + cmd.NORMAL_SIZE;
        ticket += cmd.FEED_LINE;
        
        // Mostrar mesas o "PARA LLEVAR" según el tipo
        if (order.isDelivery) {
            // Si es delivery, mostrar "PARA LLEVAR" en letra extra grande
            ticket += cmd.BOLD_ON + cmd.MEGA_SIZE;
            ticket += this.formatText('PARA LLEVAR', 'center', true);
            ticket += cmd.BOLD_OFF + cmd.NORMAL_SIZE;
        } else if (order.tables && order.tables.length > 0) {
            // Si no es delivery, mostrar "MESA:" o "MESAS:" según la cantidad
            const tableLabel = order.tables.length === 1 ? 'MESA:' : 'MESAS:';
            ticket += cmd.BOLD_ON + cmd.DOUBLE_HEIGHT;
            ticket += this.formatText(`${tableLabel} ${order.tables.sort((a,b) => a - b).join(', ')}`, 'center');
            ticket += cmd.BOLD_OFF + cmd.NORMAL_SIZE;
        }

        // Si es delivery, mostrar nombre del cliente - centrado y grande
        ticket += cmd.FEED_LINE;
        if (order.isDelivery && order.customerName) {
            ticket += cmd.BOLD_ON + cmd.DOUBLE_HEIGHT;
            ticket += this.formatText(`CLIENTE: ${order.customerName}`, 'center');
            ticket += cmd.BOLD_OFF + cmd.NORMAL_SIZE;
        }
        
        ticket += cmd.FEED_LINE;
        ticket += cmd.FEED_LINE;
        
        // Separador
        ticket += cmd.ALIGN_CENTER;
        ticket += this.formatText('================================', 'center');
        ticket += cmd.FEED_LINE;
        
        // Lista de productos con mejor formato
        ticket += cmd.ALIGN_LEFT + cmd.BOLD_ON;
        ticket += this.formatText('PRODUCTOS:');
        ticket += cmd.BOLD_OFF;
        ticket += cmd.FEED_LINE;
        
        order.items.forEach(item => {
            // Filtrar cargos por delivery - no mostrar en ticket de cocina
            if (item.name && (item.name.toLowerCase().includes('delivery') || 
                             item.name.toLowerCase().includes('domicilio') ||
                             item.name.toLowerCase().includes('envío') ||
                             item.name.toLowerCase().includes('taper'))) {
                return; // Saltar este item
            }
            
            // Formatear nombre según tipo de precio
            let productName = item.name;
            
            // Remover (Personal) o (Fuente) del nombre
            productName = productName.replace(/ \(Personal\)$/, '').replace(/ \(Fuente\)$/, '');
            
            // Si es tipo fuente, agregar F. al inicio
            if (item.priceType === 'fuente') {
                productName = 'F. ' + productName;
            }
            
            // Productos con letra grande y espaciado
            ticket += cmd.BOLD_ON + cmd.DOUBLE_HEIGHT;
            ticket += this.formatText(`${item.quantity}  ${productName}`);
            ticket += cmd.BOLD_OFF + cmd.NORMAL_SIZE;
            
            // Mostrar comentario si existe
            if (item.comment && item.comment.trim() !== '') {
                ticket += cmd.BOLD_ON;
                ticket += this.formatText(`   >> ${item.comment}`, 'left');
                ticket += cmd.BOLD_OFF;
            }
            
            ticket += cmd.FEED_LINE;
        });
        
        // Separador final
        ticket += cmd.ALIGN_CENTER;
        ticket += this.formatText('================================', 'center');
        
        // Espacios en blanco abajo
        ticket += cmd.FEED_LINE;
        ticket += cmd.FEED_LINE;
        ticket += cmd.FEED_LINE;
        
        // Cortar
        ticket += cmd.CUT_PAPER;
        
        return ticket;
    }

    // Imprimir ticket de orden
    async printOrder(order) {
        try {
            console.log('🖨️ Iniciando impresión de ticket...');
            
            // Conectar si no está conectado
            if (!this.isConnected) {
                await this.connect();
            }
            
            // Verificar que la impresora esté conectada
            if (!this.isConnected || !this.characteristic) {
                throw new Error('Impresora no conectada');
            }
            
            // Generar ticket
            const ticket = this.generateTicket(order);
            
            // Enviar a impresora
            await this.sendData(ticket);
            
            console.log('✅ Ticket impreso exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error al imprimir ticket:', error);
            throw error;
        }
    }

    // Imprimir ticket de cocina
    async printKitchenTicket(order) {
        try {
            console.log('🖨️ Iniciando impresión de ticket de cocina...');
            
            // Conectar si no está conectado
            if (!this.isConnected) {
                await this.connect();
            }
            
            // Verificar que la impresora esté conectada
            if (!this.isConnected || !this.characteristic) {
                throw new Error('Impresora no conectada');
            }
            
            // Generar ticket de cocina
            const ticket = this.generateKitchenTicket(order);
            
            // Enviar a impresora
            await this.sendData(ticket);
            
            console.log('✅ Ticket de cocina impreso exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error al imprimir ticket de cocina:', error);
            throw error;
        }
    }

    // Imprimir ticket de prueba
    async printTest() {
        try {
            const testOrder = {
                orderId: 'TEST-001',
                timestamp: new Date().toISOString(),
                tables: [{ number: 1 }],
                items: [
                    {
                        name: 'Ceviche Mixto',
                        quantity: 1,
                        unitPrice: 25.00,
                        subtotal: 25.00
                    },
                    {
                        name: 'Chicha Morada',
                        quantity: 2,
                        unitPrice: 5.00,
                        subtotal: 10.00
                    }
                ]
            };
            
            await this.printOrder(testOrder);
        } catch (error) {
            console.error('❌ Error en impresión de prueba:', error);
            throw error;
        }
    }
}