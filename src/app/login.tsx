import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const API_URL =
  'http://119.59.102.161:3055/api';

interface LoginResponse {
  message: string;

  user?: {
    id: number;
    username: string;
    role: 'admin' | 'user';
  };
}

export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  async function handleLogin() {
    if (loading) {
      return;
    }

    const cleanUsername =
      username.trim();

    if (!cleanUsername || !password) {
      Alert.alert(
        'ข้อมูลไม่ครบ',
        'กรุณากรอก Username และ Password'
      );

      return;
    }

    try {
      setLoading(true);

      console.log(
        '================================='
      );

      console.log('LOGIN');

      const response = await fetch(
        `${API_URL}/login`,
        {
          method: 'POST',

          headers: {
            Accept:
              'application/json',

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            username:
              cleanUsername,

            password,
          }),
        }
      );

      const text =
        await response.text();

      console.log(
        'LOGIN STATUS:',
        response.status
      );

      console.log(
        'LOGIN RESPONSE:',
        text
      );

      let data: LoginResponse;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Server ไม่ได้ส่ง JSON กลับมา (HTTP ${response.status})`
        );
      }

      // ==========================================
      // LOGIN ERROR
      // ==========================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Username หรือ Password ไม่ถูกต้อง'
        );
      }

      // ==========================================
      // CHECK USER
      // ==========================================

      if (!data.user) {
        throw new Error(
          'Server ไม่ได้ส่งข้อมูลผู้ใช้กลับมา'
        );
      }

      // ==========================================
      // CHECK ROLE
      // ==========================================

      if (
        data.user.role !== 'admin' &&
        data.user.role !== 'user'
      ) {
        throw new Error(
          'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบ'
        );
      }

      // ==========================================
      // SAVE LOGIN
      // ==========================================

      await AsyncStorage.setItem(
        'authUser',
        JSON.stringify(data.user)
      );

      console.log(
        '================================='
      );

      console.log(
        'LOGIN SUCCESS'
      );

      console.log(
        'USERNAME:',
        data.user.username
      );

      console.log(
        'ROLE:',
        data.user.role
      );

      console.log(
        'AUTH USER SAVED'
      );

      // ==========================================
      // CLEAR PASSWORD
      // ==========================================

      setPassword('');

      // ==========================================
      // GO HOME
      // ==========================================

      router.replace('/');

    } catch (error) {
      console.error(
        'LOGIN ERROR:',
        error
      );

      Alert.alert(
        'เข้าสู่ระบบไม่สำเร็จ',
        error instanceof Error
          ? error.message
          : 'ไม่สามารถเข้าสู่ระบบได้'
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        {/* =====================================
            BACKGROUND DECORATION
        ====================================== */}

        <View
          style={styles.backgroundCircle1}
        />

        <View
          style={styles.backgroundCircle2}
        />

        <View
          style={styles.backgroundLine}
        />

        {/* =====================================
            LOGIN CARD
        ====================================== */}

        <View style={styles.loginBox}>

          {/* Logo */}

          <View
            style={styles.logoOuter}
          >
            <View
              style={styles.logoInner}
            >
              <Ionicons
                name="bicycle"
                size={43}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* Brand */}

          <Text
            style={styles.brand}
          >
            MOTO
            <Text
              style={styles.brandAccent}
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

          {/* =================================
              USERNAME
          ================================== */}

          <View
            style={styles.inputWrapper}
          >
            <View
              style={styles.iconBox}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color="#FF3B30"
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#8B8B93"
              value={username}
              onChangeText={
                setUsername
              }
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* =================================
              PASSWORD
          ================================== */}

          <View
            style={styles.inputWrapper}
          >
            <View
              style={styles.iconBox}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#FF3B30"
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#8B8B93"
              value={password}
              onChangeText={
                setPassword
              }
              secureTextEntry={
                !showPassword
              }
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onSubmitEditing={
                handleLogin
              }
            />

            <TouchableOpacity
              style={
                styles.eyeButton
              }
              onPress={() =>
                setShowPassword(
                  !showPassword
                )
              }
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  showPassword
                    ? 'eye-off-outline'
                    : 'eye-outline'
                }
                size={21}
                color="#777780"
              />
            </TouchableOpacity>
          </View>

          {/* =================================
              LOGIN BUTTON
          ================================== */}

          <TouchableOpacity
            style={[
              styles.loginButton,
              loading &&
                styles.disabledButton,
            ]}
            onPress={
              handleLogin
            }
            disabled={loading}
            activeOpacity={0.85}
          >
            <View
              style={
                styles.loginIcon
              }
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="log-in-outline"
                  size={22}
                  color="#FFFFFF"
                />
              )}
            </View>

            <Text
              style={
                styles.loginButtonText
              }
            >
              {loading
                ? 'กำลังเข้าสู่ระบบ...'
                : 'เข้าสู่ระบบ'}
            </Text>

            {!loading && (
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#FFFFFF"
                style={
                  styles.arrowIcon
                }
              />
            )}
          </TouchableOpacity>

          {/* =================================
              FOOTER
          ================================== */}

          <View
            style={styles.footer}
          >
            <View
              style={styles.footerLine}
            />

            <Text
              style={
                styles.footerText
              }
            >
              MOTORCYCLE FAIRING
            </Text>

            <View
              style={styles.footerLine}
            />
          </View>

          <Text
            style={styles.version}
          >
            Inventory Management System
          </Text>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

  // ================================================
  // SCREEN
  // ================================================

  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },

  keyboard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },

  // ================================================
  // BACKGROUND
  // ================================================

  backgroundCircle1: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: '#17171B',
    top: -150,
    right: -120,
  },

  backgroundCircle2: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#141418',
    bottom: -130,
    left: -130,
  },

  backgroundLine: {
    position: 'absolute',
    width: 500,
    height: 2,
    backgroundColor: '#FF3B30',
    opacity: 0.12,
    transform: [
      {
        rotate: '-25deg',
      },
    ],
  },

  // ================================================
  // LOGIN CARD
  // ================================================

  loginBox: {
    width: '100%',
    maxWidth: 440,

    backgroundColor: '#18181C',

    borderRadius: 26,

    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 25,

    borderWidth: 1,
    borderColor: '#29292F',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.35,
    shadowRadius: 25,

    elevation: 12,
  },

  // ================================================
  // LOGO
  // ================================================

  logoOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,

    alignSelf: 'center',

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: '#231719',

    borderWidth: 1,
    borderColor: '#3B2021',

    marginBottom: 13,
  },

  logoInner: {
    width: 70,
    height: 70,
    borderRadius: 35,

    backgroundColor: '#FF3B30',

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,

    elevation: 8,
  },

  // ================================================
  // BRAND
  // ================================================

  brand: {
    textAlign: 'center',

    fontSize: 25,
    fontWeight: '900',

    letterSpacing: 2.5,

    color: '#FFFFFF',
  },

  brandAccent: {
    color: '#FF3B30',
  },

  title: {
    marginTop: 7,

    textAlign: 'center',

    fontSize: 20,
    fontWeight: '800',

    color: '#FFFFFF',
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 25,

    textAlign: 'center',

    fontSize: 13,

    color: '#8B8B93',

    letterSpacing: 0.5,
  },

  // ================================================
  // INPUT
  // ================================================

  inputWrapper: {
    height: 55,

    backgroundColor: '#222227',

    borderRadius: 13,

    borderWidth: 1,
    borderColor: '#303037',

    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 13,

    paddingHorizontal: 8,
  },

  iconBox: {
    width: 38,
    height: 38,

    borderRadius: 10,

    backgroundColor: '#2B2021',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 5,
  },

  input: {
    flex: 1,

    height: '100%',

    fontSize: 15,

    color: '#FFFFFF',

    paddingHorizontal: 8,

    outlineStyle: 'none',
  } as any,

  eyeButton: {
    width: 42,
    height: 42,

    justifyContent: 'center',
    alignItems: 'center',
  },

  // ================================================
  // LOGIN BUTTON
  // ================================================

  loginButton: {
    height: 56,

    marginTop: 8,

    backgroundColor: '#FF3B30',

    borderRadius: 13,

    flexDirection: 'row',
    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,

    elevation: 7,
  },

  disabledButton: {
    opacity: 0.55,
  },

  loginIcon: {
    width: 30,
    height: 30,

    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButtonText: {
    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '800',

    marginLeft: 5,

    letterSpacing: 0.3,
  },

  arrowIcon: {
    position: 'absolute',
    right: 17,
  },

  // ================================================
  // FOOTER
  // ================================================

  footer: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 25,

    paddingHorizontal: 5,
  },

  footerLine: {
    flex: 1,

    height: 1,

    backgroundColor: '#303037',
  },

  footerText: {
    marginHorizontal: 10,

    fontSize: 9,

    fontWeight: '800',

    color: '#66666F',

    letterSpacing: 1.2,
  },

  version: {
    textAlign: 'center',

    marginTop: 9,

    fontSize: 9,

    color: '#55555D',

    letterSpacing: 0.5,
  },

});