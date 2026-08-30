import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Stack,
  usePathname,
  useRouter,
} from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  async function checkAuth() {
    try {
      console.log('=================================');
      console.log('CHECK AUTH');
      console.log('PATH:', pathname);

      const savedUser =
        await AsyncStorage.getItem(
          'authUser'
        );

      console.log(
        'AUTH USER:',
        savedUser
      );

      const isLoginPage =
        pathname === '/login';

      // ==========================================
      // ยังไม่ได้ Login
      // ==========================================

      if (!savedUser) {
        console.log(
          'NO LOGIN USER'
        );

        if (!isLoginPage) {
          console.log(
            'GO TO LOGIN'
          );

          router.replace('/login');
        }

        return;
      }

      // ==========================================
      // ตรวจข้อมูล User
      // ==========================================

      let user: AuthUser;

      try {
        user = JSON.parse(savedUser);
      } catch {
        console.log(
          'INVALID AUTH USER'
        );

        await AsyncStorage.removeItem(
          'authUser'
        );

        if (!isLoginPage) {
          router.replace('/login');
        }

        return;
      }

      // ==========================================
      // ตรวจข้อมูล User
      // ==========================================

      if (
        !user ||
        !user.id ||
        !user.username ||
        !user.role ||
        (
          user.role !== 'admin' &&
          user.role !== 'user'
        )
      ) {
        console.log(
          'INVALID USER DATA'
        );

        await AsyncStorage.removeItem(
          'authUser'
        );

        if (!isLoginPage) {
          router.replace('/login');
        }

        return;
      }

      console.log(
        'LOGIN USER:',
        user.username
      );

      console.log(
        'ROLE:',
        user.role
      );

      // ==========================================
      // Login อยู่แล้ว แต่เปิด /login
      // ==========================================

      if (isLoginPage) {
        console.log(
          'ALREADY LOGIN -> HOME'
        );

        router.replace('/');
      }

    } catch (error) {
      console.error(
        'CHECK AUTH ERROR:',
        error
      );
    } finally {
      setChecking(false);
    }
  }

  // ============================================
  // LOADING SCREEN
  // ============================================

  if (checking) {
    return (
      <View
        style={styles.loadingContainer}
      >

        {/* Background decoration */}

        <View
          style={styles.circleTop}
        />

        <View
          style={styles.circleBottom}
        />

        <View
          style={styles.redLine}
        />

        {/* Logo */}

        <View
          style={styles.logoOuter}
        >
          <View
            style={styles.logoInner}
          >
            <Text
              style={styles.logoIcon}
            >
              🏍
            </Text>
          </View>
        </View>

        {/* Brand */}

        <Text
          style={styles.brand}
        >
          MOTO
          <Text
            style={styles.brandRed}
          >
            COLOR
          </Text>
        </Text>

        <Text
          style={styles.title}
        >
          ระบบจัดการสินค้า
        </Text>

        <Text
          style={styles.subtitle}
        >
          ชุดสีมอเตอร์ไซค์
        </Text>

        {/* Loading */}

        <View
          style={styles.loadingBox}
        >
          <ActivityIndicator
            size="small"
            color="#FF3B30"
          />

          <Text
            style={styles.loadingText}
          >
            กำลังตรวจสอบระบบ...
          </Text>
        </View>

        {/* Footer */}

        <Text
          style={styles.footer}
        >
          MOTORCYCLE FAIRING
        </Text>

      </View>
    );
  }

  // ============================================
  // APP
  // ============================================

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

  // ================================================
  // LOADING
  // ================================================

  loadingContainer: {
    flex: 1,

    backgroundColor: '#0D0D0F',

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 25,

    overflow: 'hidden',
  },

  // ================================================
  // BACKGROUND
  // ================================================

  circleTop: {
    position: 'absolute',

    width: 350,
    height: 350,

    borderRadius: 175,

    backgroundColor: '#17171B',

    top: -180,
    right: -140,
  },

  circleBottom: {
    position: 'absolute',

    width: 300,
    height: 300,

    borderRadius: 150,

    backgroundColor: '#151519',

    bottom: -150,
    left: -140,
  },

  redLine: {
    position: 'absolute',

    width: 550,
    height: 2,

    backgroundColor: '#FF3B30',

    opacity: 0.15,

    transform: [
      {
        rotate: '-25deg',
      },
    ],
  },

  // ================================================
  // LOGO
  // ================================================

  logoOuter: {
    width: 105,
    height: 105,

    borderRadius: 53,

    backgroundColor: '#211719',

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#392124',

    marginBottom: 18,

    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 18,

    elevation: 10,
  },

  logoInner: {
    width: 82,
    height: 82,

    borderRadius: 41,

    backgroundColor: '#FF3B30',

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,

    elevation: 8,
  },

  logoIcon: {
    fontSize: 40,
  },

  // ================================================
  // BRAND
  // ================================================

  brand: {
    fontSize: 29,

    fontWeight: '900',

    color: '#FFFFFF',

    letterSpacing: 3,

    textAlign: 'center',
  },

  brandRed: {
    color: '#FF3B30',
  },

  title: {
    marginTop: 8,

    fontSize: 21,

    fontWeight: '800',

    color: '#FFFFFF',

    textAlign: 'center',
  },

  subtitle: {
    marginTop: 5,

    fontSize: 13,

    color: '#8B8B93',

    letterSpacing: 0.8,

    textAlign: 'center',
  },

  // ================================================
  // LOADING BOX
  // ================================================

  loadingBox: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 35,

    paddingHorizontal: 20,
    paddingVertical: 12,

    borderRadius: 30,

    backgroundColor: '#18181C',

    borderWidth: 1,
    borderColor: '#29292F',
  },

  loadingText: {
    marginLeft: 10,

    fontSize: 13,

    color: '#A5A5AE',
  },

  // ================================================
  // FOOTER
  // ================================================

  footer: {
    position: 'absolute',

    bottom: 28,

    fontSize: 9,

    fontWeight: '800',

    color: '#55555D',

    letterSpacing: 1.5,
  },

});