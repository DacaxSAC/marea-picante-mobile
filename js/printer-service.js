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
    }

    // Verificar si Bluetooth está disponible
    isBluetoothAvailable() {
        return 'bluetooth' in navigator;
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
            
            console.log('🔌 Impresora desconectada');
            return true;
        } catch (error) {
            console.error('❌ Error al desconectar impresora:', error);
            this.isConnected = false;
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
            NORMAL_SIZE: '\x1B\x21\x00',
            CUT_PAPER: '\x1D\x56\x00',
            FEED_LINE: '\x0A',
            FEED_LINES: (n) => '\x1B\x64' + String.fromCharCode(n)
        };
    }

    // Formatear texto para el ancho del papel
    formatText(text, align = 'left') {
        const maxWidth = this.config.paperWidth;
        let formatted = '';
        
        const lines = text.split('\n');
        lines.forEach(line => {
            if (line.length <= maxWidth) {
                switch (align) {
                    case 'center':
                        const padding = Math.floor((maxWidth - line.length) / 2);
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

    // Imprimir ticket de prueba
    async printTest() {
        try {
            const testOrder = {
                orderId: 'TEST-001',
                timestamp: new Date().toISOString(),
                tables: [{ number: 1 }],
                detalles: [
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