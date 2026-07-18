import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

// 1. กำหนดโครงสร้างข้อมูลสินค้าให้ตรงกับไฟล์ JSON บน GitHub
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

// 2. ใส่ลิงก์ Raw URL ของไฟล์ products.json จาก GitHub ของคุณตรงนี้
const PRODUCTS_URL = 'https://raw.githubusercontent.com/chinawut-s/MyProfileAppChinawut/refs/heads/main/products.json';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ดึงข้อมูลสินค้าจาก GitHub
  useEffect(() => {
    fetch(PRODUCTS_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ฟังก์ชันเรนเดอร์การ์ดสินค้าแต่ละชิ้น (สไตล์ตารางรายชื่อสินค้า)
  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image_url }} style={styles.productImage} />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#79747E" />
          <Text style={styles.locationText}>{item.location_text}</Text>
        </View>
      </View>

      <View style={styles.stockContainer}>
        <Text style={[styles.stockNumber, item.stock < 5 ? styles.lowStock : null]}>
          {item.stock}
        </Text>
        <Text style={styles.stockUnit}>ชิ้น</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>เกิดข้อผิดพลาด: {error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ส่วนหัวของหน้าจอ */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>คลังสินค้าทั้งหมด</Text>
        <Text style={styles.headerSubtitle}>รวมรายการชุดสีมอเตอร์ไซค์ในระบบ</Text>
      </View>

      {/* รายการสินค้า */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#79747E',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  productCategory: {
    fontSize: 13,
    color: '#6200EE',
    marginTop: 2,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#79747E',
    marginLeft: 4,
  },
  stockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stockNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32', // สีเขียวปกติเมื่อมีของในคลังเยอะ
  },
  lowStock: {
    color: '#D32F2F', // เปลี่ยนเป็นสีแดงถ้าของเหลือน้อยกว่า 5 ชิ้น
  },
  stockUnit: {
    fontSize: 12,
    color: '#79747E',
    marginTop: 2,
  },
  errorText: {
    marginTop: 8,
    color: '#D32F2F',
    fontSize: 14,
  },
});