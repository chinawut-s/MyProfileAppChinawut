import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6200EE',   // สีม่วงเวลากดเลือก
        tabBarInactiveTintColor: '#79747E', // สีเทาเวลาไม่ได้เลือก
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: -4,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EEEEEE',
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false,
      }}
    >
      {/* 1. หน้า Home (ไฟล์ index.tsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* 2. หน้า Add (ต้องมีไฟล์ชื่อ add.tsx หรือเปลี่ยนชื่อตามไฟล์จริงของคุณ) */}
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* 3. หน้า Products (ต้องมีไฟล์ชื่อ products.tsx) */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "archive" : "archive-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* 4. หน้า Categories (ตรงนี้ถ้าในเครื่องคุณยังเป็นไฟล์ชื่อ explore.tsx ให้เปลี่ยนคำว่า name="categories" เป็น name="explore" ไปก่อนได้ครับ เมนูถึงจะยอมขึ้นโชว์) */}
      <Tabs.Screen
        name="categories" 
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "folder" : "folder-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}