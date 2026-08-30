import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
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

interface Product {
  id: number;
  name: string;
  model: string;
  color: string;
  price: number | string;
  stock: number;
  description?: string;
  image_url?: string;
}

interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export default function EditScreen() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{
      id?: string;
    }>();

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
  // LOAD DATA
  // ==========================================

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);

      // ----------------------------------------
      // CHECK ID
      // ----------------------------------------

      if (!id) {
        throw new Error(
          'ไม่พบรหัสสินค้า'
        );
      }

      // ----------------------------------------
      // LOAD USER
      // ----------------------------------------

      const saved =
        await AsyncStorage.getItem(
          'authUser'
        );

      if (!saved) {
        router.replace('/login');
        return;
      }

      let currentUser: AuthUser;

      try {
        currentUser =
          JSON.parse(saved);
      } catch {
        await AsyncStorage.removeItem(
          'authUser'
        );

        router.replace('/login');

        return;
      }

      setUser(currentUser);

      // ----------------------------------------
      // CHECK ADMIN
      // ----------------------------------------

      if (
        currentUser.role !== 'admin'
      ) {
        Alert.alert(
          'ไม่มีสิทธิ์',
          'เฉพาะ Admin เท่านั้นที่สามารถแก้ไขสินค้าได้',
          [
            {
              text: 'กลับ',
              onPress: () =>
                router.back(),
            },
          ]
        );

        return;
      }

      // ----------------------------------------
      // GET PRODUCT
      // ----------------------------------------

      const response =
        await fetch(
          `${API_URL}/${id}`,
          {
            method: 'GET',

            headers: {
              Accept:
                'application/json',

              'Content-Type':
                'application/json',

              'x-username':
                currentUser.username,

              'x-role':
                currentUser.role,
            },
          }
        );

      const text =
        await response.text();

      let data: any;

      try {
        data =
          JSON.parse(text);
      } catch {
        throw new Error(
          `Server ไม่ได้ส่ง JSON กลับมา (HTTP ${response.status})`
        );
      }

      // ----------------------------------------
      // SESSION EXPIRED
      // ----------------------------------------

      if (
        response.status === 401
      ) {
        await AsyncStorage.removeItem(
          'authUser'
        );

        router.replace('/login');

        return;
      }

      // ----------------------------------------
      // ERROR
      // ----------------------------------------

      if (!response.ok) {
        throw new Error(
          data.message ||
            'ไม่พบสินค้า'
        );
      }

      // ----------------------------------------
      // SET PRODUCT DATA
      // ----------------------------------------

      const product: Product =
        data;

      setName(
        product.name || ''
      );

      setModel(
        product.model || ''
      );

      setColor(
        product.color || ''
      );

      setPrice(
        String(
          product.price ?? ''
        )
      );

      setStock(
        String(
          product.stock ?? ''
        )
      );

      setDescription(
        product.description || ''
      );

      setImageUrl(
        product.image_url || ''
      );
    } catch (error) {
      console.error(
        'LOAD EDIT ERROR:',
        error
      );

      Alert.alert(
        'เกิดข้อผิดพลาด',
        error instanceof Error
          ? error.message
          : 'ไม่สามารถโหลดสินค้าได้',
        [
          {
            text: 'กลับ',
            onPress: () =>
              router.back(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // UPDATE PRODUCT
  // ==========================================

  async function updateProduct() {
    if (saving) {
      return;
    }

    if (!id || !user) {
      return;
    }

    // ----------------------------------------
    // CHECK ADMIN
    // ----------------------------------------

    if (
      user.role !== 'admin'
    ) {
      Alert.alert(
        'ไม่มีสิทธิ์',
        'เฉพาะ Admin เท่านั้น'
      );

      return;
    }

    // ----------------------------------------
    // VALIDATE
    // ----------------------------------------

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
      Number.isNaN(
        priceNumber
      )
    ) {
      Alert.alert(
        'ข้อมูลไม่ถูกต้อง',
        'ราคาสินค้าต้องเป็นตัวเลข'
      );

      return;
    }

    if (
      Number.isNaN(
        stockNumber
      )
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
        await fetch(
          `${API_URL}/${id}`,
          {
            method: 'PUT',

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

            body:
              JSON.stringify({
                name:
                  name.trim(),

                model:
                  model.trim(),

                color:
                  color.trim(),

                price:
                  priceNumber,

                stock:
                  stockNumber,

                description:
                  description.trim(),

                image_url:
                  imageUrl.trim(),
              }),
          }
        );

      // ========================================
      // RESPONSE
      // ========================================

      const text =
        await response.text();

      let data: any = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        console.error(
          'SERVER RESPONSE:',
          text
        );

        throw new Error(
          `Server ไม่ได้ส่ง JSON กลับมา (HTTP ${response.status})`
        );
      }

      // ========================================
      // SESSION EXPIRED
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
            'คุณไม่มีสิทธิ์แก้ไขสินค้า'
        );
      }

      // ========================================
      // OTHER ERROR
      // ========================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'แก้ไขสินค้าไม่สำเร็จ'
        );
      }

      // ========================================
      // SUCCESS
      // ========================================

      console.log(
        'UPDATE PRODUCT SUCCESS:',
        data
      );

      /*
       * สำคัญมาก
       *
       * เมื่อแก้ไขสำเร็จ
       * กลับหน้า Home ทันที
       *
       * ไม่ใช้ /products
       * ไม่ใช้ Alert ที่ต้องกดตกลง
       */

      router.replace('/(main)');
    } catch (error) {
      console.error(
        'UPDATE PRODUCT ERROR:',
        error
      );

      Alert.alert(
        'แก้ไขสินค้าไม่สำเร็จ',
        error instanceof Error
          ? error.message
          : 'ไม่สามารถแก้ไขสินค้าได้'
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
          style={styles.center}
        >
          <View
            style={styles.loadingIcon}
          >
            <Ionicons
              name="speedometer-outline"
              size={32}
              color="#FF5A1F"
            />
          </View>

          <ActivityIndicator
            size="large"
            color="#FF5A1F"
          />

          <Text
            style={
              styles.loadingTitle
            }
          >
            กำลังโหลดสินค้า
          </Text>

          <Text
            style={
              styles.loadingText
            }
          >
            กรุณารอสักครู่...
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
          style={styles.center}
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
            style={
              styles.noPermission
            }
          >
            ไม่มีสิทธิ์
          </Text>

          <Text
            style={
              styles.noPermissionText
            }
          >
            เฉพาะ Admin เท่านั้น
            ที่สามารถแก้ไขสินค้าได้
          </Text>

          <TouchableOpacity
            style={
              styles.backButtonLarge
            }
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
              style={
                styles.backButtonText
              }
            >
              กลับ
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* ======================================
          HEADER
      ====================================== */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          style={
            styles.headerBack
          }
          onPress={() =>
            router.back()
          }
          disabled={saving}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerTitleBox
          }
        >
          <Ionicons
            name="create-outline"
            size={20}
            color="#FF5A1F"
          />

          <Text
            style={
              styles.headerTitle
            }
          >
            แก้ไขสินค้า
          </Text>
        </View>

        <View
          style={
            styles.headerRight
          }
        />
      </View>

      {/* ======================================
          FORM
      ====================================== */}

      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
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
          {/* PAGE TITLE */}

          <View
            style={
              styles.pageTitleBox
            }
          >
            <View
              style={
                styles.pageTitleIcon
              }
            >
              <Ionicons
                name="construct-outline"
                size={28}
                color="#FF5A1F"
              />
            </View>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.pageTitle
                }
              >
                ปรับแต่งสินค้า
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }
              >
                แก้ไขข้อมูลชุดสีมอเตอร์ไซค์
              </Text>
            </View>
          </View>

          {/* ====================================
              PRODUCT INFORMATION
          ==================================== */}

          <View
            style={
              styles.sectionCard
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.sectionIcon
                }
              >
                <Ionicons
                  name="cube-outline"
                  size={19}
                  color="#FF5A1F"
                />
              </View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                ข้อมูลสินค้า
              </Text>
            </View>

            {/* NAME */}

            <Text
              style={styles.label}
            >
              ชื่อสินค้า *
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="ชื่อสินค้า"
              placeholderTextColor="#666666"
              editable={!saving}
            />

            {/* MODEL */}

            <Text
              style={styles.label}
            >
              รุ่นรถ *
            </Text>

            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder="รุ่นรถ"
              placeholderTextColor="#666666"
              editable={!saving}
            />

            {/* COLOR */}

            <Text
              style={styles.label}
            >
              สี *
            </Text>

            <TextInput
              style={styles.input}
              value={color}
              onChangeText={setColor}
              placeholder="สีสินค้า"
              placeholderTextColor="#666666"
              editable={!saving}
            />

            {/* PRICE */}

            <Text
              style={styles.label}
            >
              ราคา *
            </Text>

            <View
              style={
                styles.inputWithIcon
              }
            >
              <Text
                style={
                  styles.priceIcon
                }
              >
                ฿
              </Text>

              <TextInput
                style={
                  styles.inputInside
                }
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                placeholderTextColor="#666666"
                keyboardType="numeric"
                editable={!saving}
              />
            </View>

            {/* STOCK */}

            <Text
              style={styles.label}
            >
              จำนวนสินค้า *
            </Text>

            <View
              style={
                styles.inputWithIcon
              }
            >
              <Ionicons
                name="layers-outline"
                size={19}
                color="#888888"
              />

              <TextInput
                style={
                  styles.inputInside
                }
                value={stock}
                onChangeText={setStock}
                placeholder="0"
                placeholderTextColor="#666666"
                keyboardType="numeric"
                editable={!saving}
              />
            </View>
          </View>

          {/* ====================================
              IMAGE URL
          ==================================== */}

          <View
            style={
              styles.sectionCard
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.sectionIcon
                }
              >
                <Ionicons
                  name="image-outline"
                  size={19}
                  color="#FF5A1F"
                />
              </View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                รูปสินค้า
              </Text>
            </View>

            <Text
              style={styles.label}
            >
              URL รูปสินค้า
            </Text>

            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#666666"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!saving}
            />

            <View
              style={
                styles.imageHint
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={17}
                color="#777777"
              />

              <Text
                style={
                  styles.imageHintText
                }
              >
                ใช้ URL รูปภาพสินค้า
                เช่น รูปจาก GitHub
                หรือเซิร์ฟเวอร์ของคุณ
              </Text>
            </View>
          </View>

          {/* ====================================
              DESCRIPTION
          ==================================== */}

          <View
            style={
              styles.sectionCard
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.sectionIcon
                }
              >
                <Ionicons
                  name="document-text-outline"
                  size={19}
                  color="#FF5A1F"
                />
              </View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                รายละเอียดสินค้า
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
              ]}
              value={description}
              onChangeText={
                setDescription
              }
              placeholder="รายละเอียดสินค้า..."
              placeholderTextColor="#666666"
              multiline
              textAlignVertical="top"
              editable={!saving}
            />
          </View>

          {/* ====================================
              SAVE BUTTON
          ==================================== */}

          <TouchableOpacity
            style={[
              styles.saveButton,
              saving &&
                styles.disabledButton,
            ]}
            onPress={
              updateProduct
            }
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color="#111111"
              />
            ) : (
              <Ionicons
                name="flash"
                size={21}
                color="#111111"
              />
            )}

            <Text
              style={
                styles.saveButtonText
              }
            >
              {saving
                ? 'กำลังบันทึก...'
                : 'บันทึกการแก้ไข'}
            </Text>
          </TouchableOpacity>

          <Text
            style={
              styles.requiredText
            }
          >
            * กรุณากรอกข้อมูลที่จำเป็น
            ให้ครบ
          </Text>

          <View
            style={
              styles.bottomSpace
            }
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
    backgroundColor: '#0B0B0B',
  },

  // ================================================
  // CENTER
  // ================================================

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#0B0B0B',
  },

  loadingIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  loadingTitle: {
    marginTop: 18,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  loadingText: {
    marginTop: 5,
    color: '#777777',
    fontSize: 12,
  },

  // ================================================
  // HEADER
  // ================================================

  header: {
    height: 62,
    paddingHorizontal: 16,

    backgroundColor: '#111111',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },

  headerBack: {
    width: 38,
    height: 38,
    borderRadius: 12,

    backgroundColor: '#1C1C1C',

    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 7,
  },

  headerRight: {
    width: 38,
  },

  // ================================================
  // CONTENT
  // ================================================

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // ================================================
  // PAGE TITLE
  // ================================================

  pageTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  pageTitleIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,

    backgroundColor: '#171717',

    borderWidth: 1,
    borderColor: '#303030',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
  },

  pageTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  pageSubtitle: {
    color: '#777777',
    fontSize: 12,
    marginTop: 3,
  },

  // ================================================
  // SECTION
  // ================================================

  sectionCard: {
    backgroundColor: '#151515',

    borderRadius: 19,

    padding: 17,

    marginBottom: 13,

    borderWidth: 1,
    borderColor: '#292929',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 5,
  },

  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,

    backgroundColor:
      'rgba(255,90,31,0.12)',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 9,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  // ================================================
  // INPUT
  // ================================================

  label: {
    color: '#B7B7B7',
    fontSize: 12,
    fontWeight: '800',

    marginTop: 14,
    marginBottom: 7,
  },

  input: {
    minHeight: 49,

    backgroundColor: '#0E0E0E',

    borderWidth: 1,
    borderColor: '#303030',

    borderRadius: 11,

    paddingHorizontal: 14,

    color: '#FFFFFF',

    fontSize: 14,

    outlineStyle: 'none',
  } as any,

  inputWithIcon: {
    minHeight: 49,

    backgroundColor: '#0E0E0E',

    borderWidth: 1,
    borderColor: '#303030',

    borderRadius: 11,

    paddingHorizontal: 14,

    flexDirection: 'row',
    alignItems: 'center',
  },

  priceIcon: {
    color: '#FF5A1F',
    fontSize: 17,
    fontWeight: '900',
    marginRight: 9,
  },

  inputInside: {
    flex: 1,
    height: 48,

    color: '#FFFFFF',

    fontSize: 14,

    outlineStyle: 'none',
  } as any,

  descriptionInput: {
    height: 120,
    paddingTop: 13,
  },

  // ================================================
  // IMAGE
  // ================================================

  imageHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginTop: 10,

    padding: 10,

    backgroundColor: '#101010',

    borderRadius: 10,
  },

  imageHintText: {
    flex: 1,

    marginLeft: 7,

    color: '#777777',

    fontSize: 11,

    lineHeight: 17,
  },

  // ================================================
  // SAVE
  // ================================================

  saveButton: {
    height: 54,

    marginTop: 4,

    borderRadius: 13,

    backgroundColor: '#FF5A1F',

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 5,
  },

  saveButtonText: {
    color: '#111111',

    fontSize: 15,

    fontWeight: '900',

    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  requiredText: {
    color: '#666666',

    fontSize: 10,

    textAlign: 'center',

    marginTop: 11,
  },

  bottomSpace: {
    height: 20,
  },

  // ================================================
  // PERMISSION
  // ================================================

  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 25,

    backgroundColor: '#171717',

    borderWidth: 1,
    borderColor: '#303030',

    justifyContent: 'center',
    alignItems: 'center',
  },

  noPermission: {
    marginTop: 15,

    fontSize: 22,

    fontWeight: '900',

    color: '#FF5A1F',
  },

  noPermissionText: {
    marginTop: 8,

    color: '#777777',

    textAlign: 'center',

    fontSize: 12,

    lineHeight: 19,
  },

  backButtonLarge: {
    marginTop: 20,

    paddingHorizontal: 30,
    paddingVertical: 12,

    backgroundColor: '#FF5A1F',

    borderRadius: 10,

    flexDirection: 'row',
    alignItems: 'center',
  },

  backButtonText: {
    color: '#111111',

    fontWeight: '900',

    marginLeft: 7,
  },
});