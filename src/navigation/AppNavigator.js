import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Importar pantallas
import NewOrderScreen from '../screens/NewOrderScreen';
import OrdersScreen from '../screens/OrdersScreen';

// Importar constantes
import { COLORS } from '../config/constants';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Componente de header personalizado
const CustomHeader = ({ title }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerContent}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>🍽️</Text>
        <Text style={styles.appName}>RestaurantApp</Text>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  </View>
);

// Stack Navigator para Nueva Orden
const NewOrderStack = () => (
  <Stack.Navigator
    screenOptions={{
      header: ({ route }) => (
        <CustomHeader title="Nueva Orden" />
      ),
    }}
  >
    <Stack.Screen 
      name="NewOrderMain" 
      component={NewOrderScreen}
      options={{ headerShown: true }}
    />
  </Stack.Navigator>
);

// Stack Navigator para Órdenes
const OrdersStack = () => (
  <Stack.Navigator
    screenOptions={{
      header: ({ route }) => (
        <CustomHeader title="Órdenes" />
      ),
    }}
  >
    <Stack.Screen 
      name="OrdersMain" 
      component={OrdersScreen}
      options={{ headerShown: true }}
    />
  </Stack.Navigator>
);

// Navegador principal con tabs
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'NewOrder') {
              iconName = focused ? 'plus-circle' : 'plus-circle-outline';
            } else if (route.name === 'Orders') {
              iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 5
          },
          headerShown: false
        })}
      >
        <Tab.Screen 
          name="NewOrder" 
          component={NewOrderStack}
          options={{
            tabBarLabel: 'Nueva Orden',
          }}
        />
        <Tab.Screen 
          name="Orders" 
          component={OrdersStack}
          options={{
            tabBarLabel: 'Órdenes',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingTop: 50, // Para el status bar
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  logoText: {
    fontSize: 24,
    marginRight: 8
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.background
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.background,
    textAlign: 'center',
    flex: 1
  }
});

export default AppNavigator;