import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
  Image
} from 'react-native';
import { COLORS, ORDER_STATUS, DISH_CATEGORIES, TOTAL_TABLES, API_URL } from '../config/constants';

const NewOrderScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Mesa, 2: Platos, 3: Vista previa
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  // Datos de ejemplo de platos
  const mockDishes = [
    {
      id: 1,
      name: 'Hamburguesa Clásica',
      description: 'Carne de res, lechuga, tomate, cebolla',
      price: 12.99,
      category: DISH_CATEGORIES.MAIN_COURSES,
      image: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=🍔'
    },
    {
      id: 2,
      name: 'Pizza Margherita',
      description: 'Salsa de tomate, mozzarella, albahaca',
      price: 15.99,
      category: DISH_CATEGORIES.MAIN_COURSES,
      image: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=🍕'
    },
    {
      id: 3,
      name: 'Ensalada César',
      description: 'Lechuga romana, crutones, parmesano',
      price: 8.99,
      category: DISH_CATEGORIES.SALADS,
      image: 'https://via.placeholder.com/100x100/4CAF50/FFFFFF?text=🥗'
    },
    {
      id: 4,
      name: 'Coca Cola',
      description: 'Bebida gaseosa 350ml',
      price: 2.99,
      category: DISH_CATEGORIES.BEVERAGES,
      image: 'https://via.placeholder.com/100x100/2196F3/FFFFFF?text=🥤'
    },
    {
      id: 5,
      name: 'Tiramisú',
      description: 'Postre italiano con café y mascarpone',
      price: 6.99,
      category: DISH_CATEGORIES.DESSERTS,
      image: 'https://via.placeholder.com/100x100/FF9800/FFFFFF?text=🍰'
    },
    {
      id: 6,
      name: 'Alitas de Pollo',
      description: 'Alitas picantes con salsa BBQ',
      price: 9.99,
      category: DISH_CATEGORIES.APPETIZERS,
      image: 'https://via.placeholder.com/100x100/F44336/FFFFFF?text=🍗'
    }
  ];

  useEffect(() => {
    setDishes(mockDishes);
  }, []);

  const generateTables = () => {
    const tables = [];
    for (let i = 1; i <= TOTAL_TABLES; i++) {
      tables.push({
        id: i,
        number: i,
        isOccupied: Math.random() > 0.7 // 30% de probabilidad de estar ocupada
      });
    }
    return tables;
  };

  const tables = generateTables();

  const handleTableSelect = (table) => {
    if (table.isOccupied) {
      Alert.alert('Mesa Ocupada', 'Esta mesa ya está ocupada. Por favor selecciona otra.');
      return;
    }
    setSelectedTable(table);
  };

  const handleDishSelect = (dish) => {
    const existingDish = selectedDishes.find(item => item.id === dish.id);
    if (existingDish) {
      setSelectedDishes(selectedDishes.map(item => 
        item.id === dish.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedDishes([...selectedDishes, { ...dish, quantity: 1 }]);
    }
  };

  const handleDishRemove = (dishId) => {
    const existingDish = selectedDishes.find(item => item.id === dishId);
    if (existingDish && existingDish.quantity > 1) {
      setSelectedDishes(selectedDishes.map(item => 
        item.id === dishId 
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setSelectedDishes(selectedDishes.filter(item => item.id !== dishId));
    }
  };

  const calculateTotal = () => {
    return selectedDishes.reduce((total, dish) => total + (dish.price * dish.quantity), 0);
  };

  const handleSaveOrder = async () => {
    if (!selectedTable || selectedDishes.length === 0 || !customerName.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        tableNumber: selectedTable.number,
        customerName: customerName.trim(),
        dishes: selectedDishes,
        total: calculateTotal(),
        status: ORDER_STATUS.PENDING,
        notes: notes.trim(),
        createdAt: new Date().toISOString()
      };

      // Simular guardado de orden
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Orden Guardada',
        `Orden para mesa ${selectedTable.number} guardada exitosamente.`,
        [
          {
            text: 'Ver Órdenes',
            onPress: () => navigation.navigate('Orders')
          },
          {
            text: 'Nueva Orden',
            onPress: () => {
              setCurrentStep(1);
              setSelectedTable(null);
              setSelectedDishes([]);
              setCustomerName('');
              setNotes('');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la orden. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map(step => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive
          ]}>
            <Text style={[
              styles.stepText,
              currentStep >= step && styles.stepTextActive
            ]}>
              {step}
            </Text>
          </View>
          <Text style={styles.stepLabel}>
            {step === 1 ? 'Mesa' : step === 2 ? 'Platos' : 'Confirmar'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderTableSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Selecciona una Mesa</Text>
      <FlatList
        data={tables}
        numColumns={4}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.tableItem,
              item.isOccupied && styles.tableOccupied,
              selectedTable?.id === item.id && styles.tableSelected
            ]}
            onPress={() => handleTableSelect(item)}
            disabled={item.isOccupied}
          >
            <Text style={[
              styles.tableNumber,
              item.isOccupied && styles.tableNumberOccupied,
              selectedTable?.id === item.id && styles.tableNumberSelected
            ]}>
              {item.number}
            </Text>
            <Text style={styles.tableStatus}>
              {item.isOccupied ? 'Ocupada' : 'Libre'}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.tablesGrid}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Nombre del cliente"
        value={customerName}
        onChangeText={setCustomerName}
      />
      
      <TouchableOpacity
        style={[
          styles.nextButton,
          (!selectedTable || !customerName.trim()) && styles.nextButtonDisabled
        ]}
        onPress={() => setCurrentStep(2)}
        disabled={!selectedTable || !customerName.trim()}
      >
        <Text style={styles.nextButtonText}>Siguiente</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDishSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Selecciona los Platos</Text>
      
      <FlatList
        data={dishes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const selectedDish = selectedDishes.find(dish => dish.id === item.id);
          return (
            <View style={styles.dishItem}>
              <Image source={{ uri: item.image }} style={styles.dishImage} />
              <View style={styles.dishInfo}>
                <Text style={styles.dishName}>{item.name}</Text>
                <Text style={styles.dishDescription}>{item.description}</Text>
                <Text style={styles.dishPrice}>${item.price.toFixed(2)}</Text>
              </View>
              <View style={styles.dishActions}>
                {selectedDish && (
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleDishRemove(item.id)}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.quantity}>
                  {selectedDish ? selectedDish.quantity : 0}
                </Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleDishSelect(item)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentStep(1)}
        >
          <Text style={styles.backButtonText}>Atrás</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedDishes.length === 0 && styles.nextButtonDisabled
          ]}
          onPress={() => setCurrentStep(3)}
          disabled={selectedDishes.length === 0}
        >
          <Text style={styles.nextButtonText}>Vista Previa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrderPreview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Confirmar Orden</Text>
      
      <View style={styles.orderSummary}>
        <Text style={styles.summaryTitle}>Resumen de la Orden</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Mesa:</Text>
          <Text style={styles.summaryValue}>{selectedTable?.number}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Cliente:</Text>
          <Text style={styles.summaryValue}>{customerName}</Text>
        </View>
        
        <Text style={styles.dishesTitle}>Platos:</Text>
        {selectedDishes.map(dish => (
          <View key={dish.id} style={styles.summaryDish}>
            <Text style={styles.summaryDishName}>
              {dish.quantity}x {dish.name}
            </Text>
            <Text style={styles.summaryDishPrice}>
              ${(dish.price * dish.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
        </View>
      </View>
      
      <TextInput
        style={styles.notesInput}
        placeholder="Notas adicionales (opcional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentStep(2)}
        >
          <Text style={styles.backButtonText}>Atrás</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveOrder}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Guardando...' : 'Guardar Orden'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderStepIndicator()}
      <ScrollView style={styles.content}>
        {currentStep === 1 && renderTableSelection()}
        {currentStep === 2 && renderDishSelection()}
        {currentStep === 3 && renderOrderPreview()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.surface
  },
  stepContainer: {
    alignItems: 'center',
    marginHorizontal: 20
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary
  },
  stepText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold'
  },
  stepTextActive: {
    color: COLORS.background
  },
  stepLabel: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  content: {
    flex: 1
  },
  stepContent: {
    padding: 20
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center'
  },
  tablesGrid: {
    paddingBottom: 20
  },
  tableItem: {
    flex: 1,
    margin: 5,
    padding: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border
  },
  tableOccupied: {
    backgroundColor: '#FFEBEE',
    borderColor: COLORS.error
  },
  tableSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: COLORS.primary
  },
  tableNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text
  },
  tableNumberOccupied: {
    color: COLORS.error
  },
  tableNumberSelected: {
    color: COLORS.primary
  },
  tableStatus: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: COLORS.background
  },
  dishItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center'
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15
  },
  dishInfo: {
    flex: 1
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5
  },
  dishDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5
  },
  dishPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary
  },
  dishActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  quantityButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold'
  },
  quantity: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    minWidth: 20,
    textAlign: 'center'
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  backButton: {
    flex: 1,
    padding: 15,
    backgroundColor: COLORS.border,
    borderRadius: 10,
    marginRight: 10
  },
  backButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text
  },
  nextButton: {
    flex: 1,
    padding: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    marginLeft: 10
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.border
  },
  nextButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background
  },
  orderSummary: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.textSecondary
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text
  },
  dishesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 10
  },
  summaryDish: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  summaryDishName: {
    fontSize: 14,
    color: COLORS.text
  },
  summaryDishPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: COLORS.background,
    textAlignVertical: 'top'
  },
  saveButton: {
    flex: 1,
    padding: 15,
    backgroundColor: COLORS.success,
    borderRadius: 10,
    marginLeft: 10
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.border
  },
  saveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background
  }
});

export default NewOrderScreen;