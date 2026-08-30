import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isProducts = pathname === '/product-list';
  const isCategories = pathname === '/categories';

  return (
    <View style={styles.container}>

      {/* HOME */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.replace('/')}
      >
        <Ionicons
          name={isHome ? 'home' : 'home-outline'}
          size={24}
          color={isHome ? '#6200EE' : '#555555'}
        />

        <Text
          style={[
            styles.text,
            isHome && styles.activeText,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* PRODUCTS */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.replace('/product-list')}
      >
        <Ionicons
          name={isProducts ? 'cube' : 'cube-outline'}
          size={24}
          color={isProducts ? '#6200EE' : '#555555'}
        />

        <Text
          style={[
            styles.text,
            isProducts && styles.activeText,
          ]}
        >
          Products
        </Text>
      </TouchableOpacity>

      {/* CATEGORIES */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.replace('/categories')}
      >
        <Ionicons
          name={isCategories ? 'folder' : 'folder-outline'}
          size={24}
          color={isCategories ? '#6200EE' : '#555555'}
        />

        <Text
          style={[
            styles.text,
            isCategories && styles.activeText,
          ]}
        >
          Categories
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',

    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',

    paddingBottom: 5,
  },

  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
    marginTop: 4,
    fontSize: 12,
    color: '#555555',
  },

  activeText: {
    color: '#6200EE',
    fontWeight: 'bold',
  },
});