import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: '#79747E',

        tabBarStyle: {
          height: 62,
          paddingBottom: 7,
          paddingTop: 5,
        },
      }}
    >
      {/* ================================
          HOME
      ================================= */}

      <Tabs.Screen
        name="index"
        options={{
          title: 'หน้าหลัก',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ================================
          PRODUCTS LIST
      ================================= */}

      <Tabs.Screen
        name="products-list"
        options={{
          title: 'สินค้า',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="cube-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ================================
          CATEGORIES
      ================================= */}

      <Tabs.Screen
        name="categories"
        options={{
          title: 'หมวดหมู่',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="grid-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ================================
          HIDDEN SCREENS
      ================================= */}

      <Tabs.Screen
        name="products"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="edit"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}