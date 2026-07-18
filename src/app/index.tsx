import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 1. กำหนด โครงสร้างข้อมูลสำหรับชุดสีมอเตอร์ไซค์
interface Product {
  id: string;
  name: string;
  stock: number;
  stock_text: string;
  category: string;
  location_text: string;
  badge_status: string;
  image_url: string;
}

// 2. ⚠️ อย่าลืมเปลี่ยนตรงนี้ให้เป็นลิงก์ Raw URL จาก GitHub ของคุณนะครับ
const PRODUCTS_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/products.json';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter(); // ใช้สำหรับกดเปลี่ยนหน้า

  // ฟังก์ชันดึงข้อมูล JSON จาก GitHub Raw URL
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(PRODUCTS_URL);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    }
    void loadProducts();
  }, []);

  // ฟังก์ชันแสดงการ์ดสินค้าแต่ละชิ้น (เหมือนในรูปหน้าจอของคุณ)
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      {/* แสดงรูปภาพสินค้า */}
      <Image source={{ uri: item.image_url }} style={styles.productImage} />
      
      {/* แสดงรายละเอียดสินค้า */}
      <View style={styles.productDetails}>
        <Text style={styles.stockText}>{item.stock_text}</Text>
        <Text style={styles.infoText}>Category: {item.category}</Text>
        <Text style={styles.infoText}>Location: {item.location_text}</Text>
        <Text style={styles.productName}>{item.name}</Text>
      </View>

      {/* ปุ่มสถานะ และ ปุ่มลูกศรสำหรับกดลิงก์ไปหน้าอื่น */}
      <View style={styles.rightActions}>
        <View style={[
          styles.badge, 
          { backgroundColor: item.badge_status === 'Active' ? '#6200EE' : '#B3261E' } // สีพื้นหลังปุ่มสถานะ
        ]}>
          <Text style={styles.badgeText}>{item.badge_status}</Text>
        </View>

        {/* 🌟 จุดกดลิงก์: เมื่อกดปุ่มลูกศรจะพาไปหน้าดูรายละเอียดสินค้า (ส่ง id ติดไปด้วย) */}
        <TouchableOpacity 
          style={styles.arrowButton} 
          onPress={() => router.push(`/product-detail?id=${item.id}`)}
        >
          <Ionicons name="chevron-forward" size={14} color="#6200EE" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. ส่วนหัวบนสุด (Header Component) */}
      <View style={styles.header}>
        <Ionicons name="menu" size={24} color="black" />
        <Text style={styles.headerTitle}>Expo Starter</Text>
        <View style={styles.profileCircle}>
          <Ionicons name="person" size={16} color="white" />
        </View>
      </View>

      {/* 2. แถบค้นหาและปุ่มเพิ่มสินค้า (Action Bar) */}
      <View style={styles.actionBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#79747E" />
          <Text style={styles.searchPlaceholder}>Search products...</Text>
        </View>

        {/* 🌟 จุดกดลิงก์: เมื่อกดปุ่มนี้จะพาเปลี่ยนเส้นทางไปหน้าฟอร์มเพิ่มสินค้า */}
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/add')}
        >
          <Text style={styles.addButtonText}>+ Add Product</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Filter </Text>
          <Ionicons name="funnel" size={14} color="#6200EE" />
        </TouchableOpacity>
      </View>

      {/* 3. รายการสินค้าทั้งหมดที่ดึงมาจาก GitHub (FlatList) */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

// ส่วนตกแต่งความสวยงาม (Styles) ให้ตรงกับหน้าจอของคุณ
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#EEEEEE' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  profileCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6200EE', justifyContent: 'center', alignItems: 'center' },
  actionBar: { flexDirection: 'row', padding: 12, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' },
  searchBox: { flexDirection: 'row', backgroundColor: '#F3F3F3', padding: 8, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  searchPlaceholder: { color: '#79747E', marginLeft: 8, fontSize: 14 },
  addButton: { backgroundColor: '#6200EE', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 8 },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  filterButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#6200EE', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8 },
  filterButtonText: { color: '#6200EE', fontSize: 13 },
  listContainer: { padding: 12 },
  productCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EEEEEE' },
  productImage: { width: 65, height: 65, borderRadius: 8, resizeMode: 'contain' },
  productDetails: { flex: 1, marginLeft: 16 },
  stockText: { fontSize: 12, color: '#79747E' },
  infoText: { fontSize: 12, color: '#79747E', marginTop: 2 },
  productName: { fontSize: 15, fontWeight: 'bold', marginTop: 6, color: '#1C1B1F' },
  rightActions: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, marginRight: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: 'white' },
  arrowButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3EDF7', justifyContent: 'center', alignItems: 'center' }
});