import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CategoriesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.header}>
        <Text
          style={styles.title}
        >
          หมวดหมู่สินค้า
        </Text>
      </View>

      <View
        style={styles.content}
      >
        <View
          style={styles.iconBox}
        >
          <Ionicons
            name="grid-outline"
            size={50}
            color="#6200EE"
          />
        </View>

        <Text
          style={styles.heading}
        >
          จัดการสินค้า
        </Text>

        <Text
          style={styles.text}
        >
          สามารถดูสินค้าและจัดการสินค้าได้จากหน้าสินค้าทั้งหมด
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push(
              '/products-list'
            )
          }
        >
          <Ionicons
            name="cube-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.buttonText
            }
          >
            ดูสินค้าทั้งหมด
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },

  header: {
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1B1F',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F3EDF7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heading: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: 'bold',
  },

  text: {
    marginTop: 10,
    textAlign: 'center',
    color: '#79747E',
    lineHeight: 22,
  },

  button: {
    marginTop: 25,
    height: 50,
    paddingHorizontal: 25,
    borderRadius: 10,
    backgroundColor: '#6200EE',
    flexDirection: 'row',
    alignItems: 'center',
  },

  buttonText: {
    marginLeft: 7,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});