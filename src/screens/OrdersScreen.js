import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ScrollView
} from 'react-native';
import { COLORS, ORDER_STATUS, STATUS_COLORS, DATE_FORMAT } from '../config/constants';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Datos de ejemplo de órdenes
  const mockOrders = [
    {
      id: 1,
      tableNumber: 5,
      customerName: 'Juan Pérez',
      dishes: [
        { id: 1, name: 'Hamburguesa Clásica', quantity: 2, price: 12.99 },
        { id: 4, name: 'Coca Cola', quantity: 2, price: 2.99 }
      ],
      total: 31.96,
      status: ORDER_STATUS.PREPARING,
      notes: 'Sin cebolla en las hamburguesas',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutos atrás
      updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      tableNumber: 12,
      customerName: 'María García',
      dishes: [
        { id: 2, name: 'Pizza Margherita', quantity: 1, price: 15.99 },
        { id: 3, name: 'Ensalada César', quantity: 1, price: 8.99 }
      ],
      total: 24.98,
      status: ORDER_STATUS.READY,
      notes: '',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      tableNumber: 8,
      customerName: 'Carlos López',
      dishes: [
        { id: 6, name: 'Alitas de Pollo', quantity: 1, price: 9.99 },
        { id: 5, name: 'Tiramisú', quantity: 1, price: 6.99 },
        { id: 4, name: 'Coca Cola', quantity: 1, price: 2.99 }
      ],
      total: 19.97,
      status: ORDER_STATUS.DELIVERED,
      notes: 'Alitas extra picantes',
      createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      tableNumber: 3,
      customerName: 'Ana Martínez',
      dishes: [
        { id: 1, name: 'Hamburguesa Clásica', quantity: 1, price: 12.99 }
      ],
      total: 12.99,
      status: ORDER_STATUS.PENDING,
      notes: '',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    {
      id: 5,
      tableNumber: 15,
      customerName: 'Roberto Silva',
      dishes: [
        { id: 2, name: 'Pizza Margherita', quantity: 1, price: 15.99 },
        { id: 4, name: 'Coca Cola', quantity: 3, price: 2.99 }
      ],
      total: 24.96,
      status: ORDER_STATUS.CANCELLED,
      notes: 'Cliente canceló por tiempo de espera',
      createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 100 * 60 * 1000).toISOString()
    }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrders(mockOrders);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las órdenes.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      ));
      setModalVisible(false);
      Alert.alert('Éxito', 'Estado de la orden actualizado.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado de la orden.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 'Pendiente';
      case ORDER_STATUS.PREPARING:
        return 'Preparando';
      case ORDER_STATUS.READY:
        return 'Lista';
      case ORDER_STATUS.DELIVERED:
        return 'Entregada';
      case ORDER_STATUS.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getFilteredOrders = () => {
    if (filterStatus === 'all') {
      return orders;
    }
    return orders.filter(order => order.status === filterStatus);
  };

  const getStatusActions = (currentStatus) => {
    const actions = [];
    
    switch (currentStatus) {
      case ORDER_STATUS.PENDING:
        actions.push(
          { status: ORDER_STATUS.PREPARING, label: 'Marcar como Preparando', color: COLORS.info },
          { status: ORDER_STATUS.CANCELLED, label: 'Cancelar', color: COLORS.error }
        );
        break;
      case ORDER_STATUS.PREPARING:
        actions.push(
          { status: ORDER_STATUS.READY, label: 'Marcar como Lista', color: COLORS.success }
        );
        break;
      case ORDER_STATUS.READY:
        actions.push(
          { status: ORDER_STATUS.DELIVERED, label: 'Marcar como Entregada', color: COLORS.textSecondary }
        );
        break;
    }
    
    return actions;
  };

  const renderFilterButtons = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterStatus === 'all' && styles.filterButtonActive
        ]}
        onPress={() => setFilterStatus('all')}
      >
        <Text style={[
          styles.filterButtonText,
          filterStatus === 'all' && styles.filterButtonTextActive
        ]}>
          Todas
        </Text>
      </TouchableOpacity>
      
      {Object.values(ORDER_STATUS).map(status => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            filterStatus === status && styles.filterButtonActive
          ]}
          onPress={() => setFilterStatus(status)}
        >
          <Text style={[
            styles.filterButtonText,
            filterStatus === status && styles.filterButtonTextActive
          ]}>
            {getStatusText(status)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => {
        setSelectedOrder(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderTable}>Mesa {item.tableNumber}</Text>
          <Text style={styles.orderCustomer}>{item.customerName}</Text>
        </View>
        <View style={styles.orderStatus}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status] }
          ]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.orderTime}>
          Creada: {formatDate(item.createdAt)}
        </Text>
        <Text style={styles.dishCount}>
          {item.dishes.length} plato{item.dishes.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      {item.notes && (
        <Text style={styles.orderNotes}>Notas: {item.notes}</Text>
      )}
    </TouchableOpacity>
  );

  const renderOrderModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedOrder && (
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Orden #{selectedOrder.id} - Mesa {selectedOrder.tableNumber}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.orderDetailSection}>
                <Text style={styles.sectionTitle}>Información del Cliente</Text>
                <Text style={styles.detailText}>Nombre: {selectedOrder.customerName}</Text>
                <Text style={styles.detailText}>Mesa: {selectedOrder.tableNumber}</Text>
                <Text style={styles.detailText}>
                  Estado: {getStatusText(selectedOrder.status)}
                </Text>
              </View>
              
              <View style={styles.orderDetailSection}>
                <Text style={styles.sectionTitle}>Platos Ordenados</Text>
                {selectedOrder.dishes.map(dish => (
                  <View key={dish.id} style={styles.dishDetailItem}>
                    <Text style={styles.dishDetailName}>
                      {dish.quantity}x {dish.name}
                    </Text>
                    <Text style={styles.dishDetailPrice}>
                      ${(dish.price * dish.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View style={styles.totalDetailRow}>
                  <Text style={styles.totalDetailLabel}>Total:</Text>
                  <Text style={styles.totalDetailValue}>
                    ${selectedOrder.total.toFixed(2)}
                  </Text>
                </View>
              </View>
              
              {selectedOrder.notes && (
                <View style={styles.orderDetailSection}>
                  <Text style={styles.sectionTitle}>Notas</Text>
                  <Text style={styles.detailText}>{selectedOrder.notes}</Text>
                </View>
              )}
              
              <View style={styles.orderDetailSection}>
                <Text style={styles.sectionTitle}>Fechas</Text>
                <Text style={styles.detailText}>
                  Creada: {formatDate(selectedOrder.createdAt)}
                </Text>
                <Text style={styles.detailText}>
                  Actualizada: {formatDate(selectedOrder.updatedAt)}
                </Text>
              </View>
              
              {getStatusActions(selectedOrder.status).length > 0 && (
                <View style={styles.orderDetailSection}>
                  <Text style={styles.sectionTitle}>Acciones</Text>
                  {getStatusActions(selectedOrder.status).map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.actionButton,
                        { backgroundColor: action.color }
                      ]}
                      onPress={() => updateOrderStatus(selectedOrder.id, action.status)}
                    >
                      <Text style={styles.actionButtonText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Órdenes del Restaurante</Text>
        <TouchableOpacity
          style={styles.newOrderButton}
          onPress={() => navigation.navigate('NewOrder')}
        >
          <Text style={styles.newOrderButtonText}>+ Nueva Orden</Text>
        </TouchableOpacity>
      </View>
      
      {renderFilterButtons()}
      
      <FlatList
        data={getFilteredOrders()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filterStatus === 'all' 
                ? 'No hay órdenes registradas' 
                : `No hay órdenes ${getStatusText(filterStatus).toLowerCase()}`
              }
            </Text>
          </View>
        }
      />
      
      {renderOrderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text
  },
  newOrderButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  newOrderButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 14
  },
  filterContainer: {
    backgroundColor: COLORS.surface
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  filterButtonText: {
    color: COLORS.text,
    fontSize: 14
  },
  filterButtonTextActive: {
    color: COLORS.background,
    fontWeight: 'bold'
  },
  ordersList: {
    padding: 20
  },
  orderItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  orderInfo: {
    flex: 1
  },
  orderTable: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5
  },
  orderCustomer: {
    fontSize: 16,
    color: COLORS.textSecondary
  },
  orderStatus: {
    alignItems: 'flex-end'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 5
  },
  statusText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold'
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderTime: {
    fontSize: 14,
    color: COLORS.textSecondary
  },
  dishCount: {
    fontSize: 14,
    color: COLORS.textSecondary
  },
  orderNotes: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.text
  },
  orderDetailSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5
  },
  dishDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 5
  },
  dishDetailName: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1
  },
  dishDetailPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary
  },
  totalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  totalDetailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text
  },
  totalDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },
  actionButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14
  }
});

export default OrdersScreen;