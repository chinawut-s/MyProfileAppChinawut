import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL =
  'http://119.59.102.161:3055/api/products';

interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export default function AddScreen() {
  const router = useRouter();

  // ==========================================
  // STATE
  // ==========================================

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [name, setName] =
    useState('');

  const [model, setModel] =
    useState('');

  const [color, setColor] =
    useState('');

  const [price, setPrice] =
    useState('');

  const [stock, setStock] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [imageUrl, setImageUrl] =
    useState('');

  // ==========================================
  // LOAD USER
  // ==========================================

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      setLoading(true);

      const savedUser =
        await AsyncStorage.getItem(
          'authUser'
        );

      if (!savedUser) {
        router.replace('/login');
        return;
      }

      let currentUser: AuthUser;

      try {
        currentUser =
          JSON.parse(savedUser);
      } catch {
        await AsyncStorage.removeItem(
          'authUser'
        );

        router.replace('/login');
        return;
      }

      if (
        !currentUser.username ||
        !currentUser.role
      ) {
        await AsyncStorage.removeItem(
          'authUser'
        );

        router.replace('/login');
        return;
      }

      setUser(currentUser);

      // เฉพาะ Admin เท่านั้น
      if (
        currentUser.role !== 'admin'
      ) {
        Alert.alert(
          'ไม่มีสิทธิ์',
          'เฉพาะ Admin เท่านั้นที่สามารถเพิ่มสินค้าได้',
          [
            {
              text: 'กลับ',
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error(
        'LOAD USER ERROR:',
        error
      );

      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถตรวจสอบผู้ใช้งานได้',
        [
          {
            text: 'กลับ',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // ADD PRODUCT
  // ==========================================

  async function addProduct() {
    if (saving) {
      return;
    }

    if (!user) {
      return;
    }

    if (
      user.role !== 'admin'
    ) {
      Alert.alert(
        'ไม่มีสิทธิ์',
        'เฉพาะ Admin เท่านั้นที่สามารถเพิ่มสินค้าได้'
      );

      return;
    }

    // ========================================
    // VALIDATE
    // ========================================

    if (
      !name.trim() ||
      !model.trim() ||
      !color.trim() ||
      !price.trim() ||
      !stock.trim()
    ) {
      Alert.alert(
        'ข้อมูลไม่ครบ',
        'กรุณากรอกข้อมูลสินค้าให้ครบ'
      );

      return;
    }

    const priceNumber =
      Number(price);

    const stockNumber =
      Number(stock);

    if (
      Number.isNaN(priceNumber)
    ) {
      Alert.alert(
        'ข้อมูลไม่ถูกต้อง',
        'ราคาสินค้าต้องเป็นตัวเลข'
      );

      return;
    }

    if (
      Number.isNaN(stockNumber)
    ) {
      Alert.alert(
        'ข้อมูลไม่ถูกต้อง',
        'จำนวนสินค้าต้องเป็นตัวเลข'
      );

      return;
    }

    if (priceNumber < 0) {
      Alert.alert(
        'ข้อมูลไม่ถูกต้อง',
        'ราคาสินค้าต้องไม่ติดลบ'
      );

      return;
    }

    if (stockNumber < 0) {
      Alert.alert(
        'ข้อมูลไม่ถูกต้อง',
        'จำนวนสินค้าต้องไม่ติดลบ'
      );

      return;
    }

    // ========================================
    // SAVE
    // ========================================

    try {
      setSaving(true);

      const response =
        await fetch(API_URL, {
          method: 'POST',

          headers: {
            Accept:
              'application/json',

            'Content-Type':
              'application/json',

            'x-username':
              user.username,

            'x-role':
              user.role,
          },

          body: JSON.stringify({
            name: name.trim(),

            model: model.trim(),

            color: color.trim(),

            price: priceNumber,

            stock: stockNumber,

            description:
              description.trim(),

            image_url:
              imageUrl.trim(),
          }),
        });

      // ========================================
      // READ RESPONSE
      // ========================================

      const text =
        await response.text();

      let data: any = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          `Server ไม่ได้ส่ง JSON กลับมา (HTTP ${response.status})`
        );
      }

      // ========================================
      // UNAUTHORIZED
      // ========================================

      if (
        response.status === 401
      ) {
        await AsyncStorage.removeItem(
          'authUser'
        );

        router.replace('/login');

        return;
      }

      // ========================================
      // FORBIDDEN
      // ========================================

      if (
        response.status === 403
      ) {
        throw new Error(
          data.message ||
            'คุณไม่มีสิทธิ์เพิ่มสินค้า'
        );
      }

      // ========================================
      // ERROR
      // ========================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'เพิ่มสินค้าไม่สำเร็จ'
        );
      }

      // ========================================
      // SUCCESS
      // ========================================

      console.log(
        'ADD PRODUCT SUCCESS:',
        data
      );

      // เคลียร์ข้อมูลในฟอร์ม
      setName('');
      setModel('');
      setColor('');
      setPrice('');
      setStock('');
      setDescription('');
      setImageUrl('');

      /*
       * สำคัญ:
       * ไม่ใช้ Alert.alert ก่อนกลับ Home
       * เพราะต้องการให้กดบันทึกแล้วเด้งกลับทันที
       */

      router.replace('/(main)');
    } catch (error) {
      console.error(
        'ADD PRODUCT ERROR:',
        error
      );

      Alert.alert(
        'เพิ่มสินค้าไม่สำเร็จ',
        error instanceof Error
          ? error.message
          : 'ไม่สามารถเพิ่มสินค้าได้'
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.loadingContainer}
        >
          <View
            style={styles.loadingIcon}
          >
            <Ionicons
              name="bicycle"
              size={36}
              color="#FFFFFF"
            />
          </View>

          <ActivityIndicator
            size="large"
            color="#FF5A1F"
          />

          <Text
            style={styles.loadingTitle}
          >
            กำลังเตรียมระบบ
          </Text>

          <Text
            style={styles.loadingText}
          >
            กำลังตรวจสอบสิทธิ์...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // NO PERMISSION
  // ==========================================

  if (
    user &&
    user.role !== 'admin'
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.permissionContainer}
        >
          <View
            style={styles.permissionIcon}
          >
            <Ionicons
              name="lock-closed-outline"
              size={42}
              color="#FF5A1F"
            />
          </View>

          <Text
            style={styles.permissionTitle}
          >
            ไม่มีสิทธิ์
          </Text>

          <Text
            style={styles.permissionText}
          >
            เฉพาะ Admin เท่านั้น
            {'\n'}
            ที่สามารถเพิ่มสินค้าได้
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color="#FFFFFF"
            />

            <Text
              style={styles.backButtonText}
            >
              กลับ
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // ADD SCREEN
  // ==========================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* ======================================
          HEADER
      ====================================== */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() =>
            router.back()
          }
          disabled={saving}
          activeOpacity={0.75}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View
          style={styles.headerCenter}
        >
          <Text
            style={styles.headerTitle}
          >
            เพิ่มสินค้า
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            MOTORCYCLE PARTS
          </Text>
        </View>

        <View
          style={styles.headerRight}
        />
      </View>

      {/* ======================================
          FORM
      ====================================== */}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================================
              FORM TITLE
          ================================== */}

          <View
            style={styles.formIntro}
          >
            <View
              style={styles.formIntroIcon}
            >
              <Ionicons
                name="construct-outline"
                size={24}
                color="#FF5A1F"
              />
            </View>

            <View
              style={styles.formIntroText}
            >
              <Text
                style={styles.formTitle}
              >
                ข้อมูลสินค้า
              </Text>

              <Text
                style={styles.formSubtitle}
              >
                กรอกรายละเอียดชุดสีมอเตอร์ไซค์
              </Text>
            </View>
          </View>

          {/* ==================================
              NAME
          ================================== */}

          <Text
            style={styles.label}
          >
            ชื่อสินค้า *
          </Text>

          <View
            style={styles.inputWrapper}
          >
            <Ionicons
              name="pricetag-outline"
              size={19}
              color="#999999"
            />

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="เช่น ชุดสี Wave 125i"
              placeholderTextColor="#AAAAAA"
              editable={!saving}
            />
          </View>

          {/* ==================================
              MODEL
          ================================== */}

          <Text
            style={styles.label}
          >
            รุ่นรถ *
          </Text>

          <View
            style={styles.inputWrapper}
          >
            <Ionicons
              name="bicycle-outline"
              size={19}
              color="#999999"
            />

            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder="เช่น Wave 125i"
              placeholderTextColor="#AAAAAA"
              editable={!saving}
            />
          </View>

          {/* ==================================
              COLOR
          ================================== */}

          <Text
            style={styles.label}
          >
            สี *
          </Text>

          <View
            style={styles.inputWrapper}
          >
            <Ionicons
              name="color-palette-outline"
              size={19}
              color="#999999"
            />

            <TextInput
              style={styles.input}
              value={color}
              onChangeText={setColor}
              placeholder="เช่น แดง-ดำ"
              placeholderTextColor="#AAAAAA"
              editable={!saving}
            />
          </View>

          {/* ==================================
              PRICE
          ================================== */}

          <Text
            style={styles.label}
          >
            ราคา *
          </Text>

          <View
            style={styles.inputWrapper}
          >
            <Text
              style={styles.bahtIcon}
            >
              ฿
            </Text>

            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="เช่น 2500"
              placeholderTextColor="#AAAAAA"
              keyboardType="numeric"
              editable={!saving}
            />
          </View>

          {/* ==================================
              STOCK
          ================================== */}

          <Text
            style={styles.label}
          >
            จำนวนสินค้า *
          </Text>

          <View
            style={styles.inputWrapper}
          >
            <Ionicons
              name="cube-outline"
              size={19}
              color="#999999"
            />

            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              placeholder="เช่น 10"
              placeholderTextColor="#AAAAAA"
              keyboardType="numeric"
              editable={!saving}
            />
          </View>

          {/* ==================================
              IMAGE URL
          ================================== */}

          <Text
            style={styles.label}
          >
            URL รูปสินค้า
          </Text>

          <View
            style={styles.inputWrapper}
          >
            <Ionicons
              name="image-outline"
              size={19}
              color="#999999"
            />

            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://..."
              placeholderTextColor="#AAAAAA"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!saving}
            />
          </View>

          <Text
            style={styles.helperText}
          >
            ใส่ URL รูปภาพ เช่น รูปจาก GitHub หรือเว็บไซต์ที่เก็บรูป
          </Text>

          {/* ==================================
              DESCRIPTION
          ================================== */}

          <Text
            style={styles.label}
          >
            รายละเอียดสินค้า
          </Text>

          <View
            style={[
              styles.inputWrapper,
              styles.descriptionWrapper,
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={19}
              color="#999999"
              style={styles.descriptionIcon}
            />

            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
              ]}
              value={description}
              onChangeText={
                setDescription
              }
              placeholder="รายละเอียดเพิ่มเติมของสินค้า..."
              placeholderTextColor="#AAAAAA"
              multiline
              textAlignVertical="top"
              editable={!saving}
            />
          </View>

          {/* ==================================
              SAVE BUTTON
          ================================== */}

          <TouchableOpacity
            style={[
              styles.saveButton,
              saving &&
                styles.disabledButton,
            ]}
            onPress={addProduct}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={23}
                color="#FFFFFF"
              />
            )}

            <Text
              style={
                styles.saveButtonText
              }
            >
              {saving
                ? 'กำลังบันทึก...'
                : 'บันทึกสินค้า'}
            </Text>
          </TouchableOpacity>

          {/* ==================================
              INFO
          ================================== */}

          <View
            style={styles.infoBox}
          >
            <Ionicons
              name="information-circle-outline"
              size={19}
              color="#FF5A1F"
            />

            <Text
              style={styles.infoText}
            >
            
            </Text>
          </View>

          <View
            style={styles.bottomSpace}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },

  // ================================================
  // LOADING
  // ================================================

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },

  loadingText: {
    marginTop: 5,
    fontSize: 13,
    color: '#888888',
  },

  // ================================================
  // HEADER
  // ================================================

  header: {
    height: 68,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  headerBackButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerCenter: {
    alignItems: 'center',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: '#FF5A1F',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 2,
  },

  headerRight: {
    width: 42,
  },

  // ================================================
  // CONTENT
  // ================================================

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  // ================================================
  // FORM INTRO
  // ================================================

  formIntro: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  formIntroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor:
      'rgba(255,90,31,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  formIntroText: {
    marginLeft: 12,
    flex: 1,
  },

  formTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  formSubtitle: {
    color: '#999999',
    fontSize: 11,
    marginTop: 3,
  },

  // ================================================
  // LABEL
  // ================================================

  label: {
    fontSize: 13,
    fontWeight: '900',
    color: '#222222',
    marginBottom: 7,
    marginTop: 9,
  },

  // ================================================
  // INPUT
  // ================================================

  inputWrapper: {
    minHeight: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  input: {
    flex: 1,
    minHeight: 48,
    marginLeft: 9,
    fontSize: 14,
    color: '#111111',
    paddingVertical: 10,
    outlineStyle: 'none',
  } as any,

  bahtIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF5A1F',
    width: 19,
    textAlign: 'center',
  },

  helperText: {
    fontSize: 10,
    color: '#999999',
    marginTop: 5,
    marginLeft: 3,
  },

  // ================================================
  // DESCRIPTION
  // ================================================

  descriptionWrapper: {
    minHeight: 125,
    alignItems: 'flex-start',
    paddingTop: 12,
  },

  descriptionIcon: {
    marginTop: 2,
  },

  descriptionInput: {
    height: 105,
    paddingTop: 0,
  },

  // ================================================
  // SAVE
  // ================================================

  saveButton: {
    height: 54,
    backgroundColor: '#FF5A1F',
    borderRadius: 14,
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#FF5A1F',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
  },

  // ================================================
  // INFO
  // ================================================

  infoBox: {
    marginTop: 13,
    backgroundColor: '#FFF4EE',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoText: {
    flex: 1,
    marginLeft: 8,
    color: '#777777',
    fontSize: 11,
    lineHeight: 17,
  },

  bottomSpace: {
    height: 20,
  },

  // ================================================
  // PERMISSION
  // ================================================

  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  permissionIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: '#FFF0EA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  permissionTitle: {
    marginTop: 17,
    fontSize: 23,
    fontWeight: '900',
    color: '#B3261E',
  },

  permissionText: {
    marginTop: 8,
    color: '#777777',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
  },

  backButton: {
    marginTop: 22,
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 13,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 7,
  },
});