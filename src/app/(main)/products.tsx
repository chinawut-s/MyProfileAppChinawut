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
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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

export default function ProductsScreen() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{
      id?: string;
    }>();

  const [product, setProduct] =
    useState<Product | null>(null);

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [deleting, setDeleting] =
    useState(false);

  // กล่องยืนยันก่อนลบ
  const [
    showDeleteConfirm,
    setShowDeleteConfirm,
  ] = useState(false);

  // กล่องแจ้งเตือนหลังลบสำเร็จ
  const [
    showDeleteSuccess,
    setShowDeleteSuccess,
  ] = useState(false);

  // ============================================
  // USER
  // ============================================

  async function loadUser() {
    try {
      const saved =
        await AsyncStorage.getItem(
          'authUser'
        );

      if (!saved) {
        router.replace('/login');
        return null;
      }

      const currentUser: AuthUser =
        JSON.parse(saved);

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      console.error(
        'LOAD USER ERROR:',
        error
      );

      router.replace('/login');

      return null;
    }
  }

  // ============================================
  // LOAD PRODUCT
  // ============================================

  useEffect(() => {
    loadProduct();
  }, [id]);

  async function loadProduct() {
    if (!id) {
      setLoading(false);

      Alert.alert(
        'ไม่พบสินค้า',
        'ไม่พบรหัสสินค้าที่ต้องการดู',
        [
          {
            text: 'กลับหน้า Home',
            onPress: () =>
              router.replace('/(main)'),
          },
        ]
      );

      return;
    }

    try {
      setLoading(true);

      const currentUser =
        await loadUser();

      if (!currentUser) {
        return;
      }

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
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Server ไม่ได้ส่ง JSON กลับมา (HTTP ${response.status})`
        );
      }

      if (
        response.status === 401
      ) {
        await AsyncStorage.removeItem(
          'authUser'
        );

        router.replace('/login');

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'ไม่พบสินค้านี้'
        );
      }

      setProduct(data);
    } catch (error) {
      console.error(
        'PRODUCT DETAIL ERROR:',
        error
      );

      Alert.alert(
        'เกิดข้อผิดพลาด',
        error instanceof Error
          ? error.message
          : 'ไม่สามารถโหลดข้อมูลสินค้าได้',
        [
          {
            text: 'กลับหน้า Home',
            onPress: () =>
              router.replace('/(main)'),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // EDIT
  // ============================================

  function openEdit() {
    if (!product) {
      return;
    }

    if (user?.role !== 'admin') {
      Alert.alert(
        'ไม่มีสิทธิ์',
        'เฉพาะ Admin เท่านั้นที่สามารถแก้ไขสินค้าได้'
      );

      return;
    }

    router.push({
      pathname: '/edit',
      params: {
        id: String(product.id),
      },
    });
  }

  // ============================================
  // DELETE CONFIRM
  // ============================================

  function confirmDelete() {
    if (!product || deleting) {
      return;
    }

    if (user?.role !== 'admin') {
      Alert.alert(
        'ไม่มีสิทธิ์',
        'เฉพาะ Admin เท่านั้นที่สามารถลบสินค้าได้'
      );

      return;
    }

    setShowDeleteConfirm(true);
  }

  function cancelDelete() {
    if (deleting) {
      return;
    }

    setShowDeleteConfirm(false);
  }

  // ============================================
  // DELETE
  // ============================================

  async function deleteProduct() {
    if (
      !product ||
      deleting
    ) {
      return;
    }

    if (!user) {
      setShowDeleteConfirm(false);
      router.replace('/login');
      return;
    }

    if (user.role !== 'admin') {
      setShowDeleteConfirm(false);

      Alert.alert(
        'ไม่มีสิทธิ์',
        'เฉพาะ Admin เท่านั้นที่สามารถลบสินค้าได้'
      );

      return;
    }

    try {
      setDeleting(true);

      const response =
        await fetch(
          `${API_URL}/${product.id}`,
          {
            method: 'DELETE',

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
          }
        );

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
      // SESSION หมดอายุ
      // ========================================

      if (
        response.status === 401
      ) {
        await AsyncStorage.removeItem(
          'authUser'
        );

        setShowDeleteConfirm(false);

        router.replace('/login');

        return;
      }

      // ========================================
      // DELETE ERROR
      // ========================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'ลบสินค้าไม่สำเร็จ'
        );
      }

      // ========================================
      // DELETE SUCCESS
      // ========================================

      console.log(
        'DELETE SUCCESS:',
        data
      );

      // ปิดกล่องยืนยันลบ
      setShowDeleteConfirm(false);

      // เปิดกล่องแจ้งเตือนลบสำเร็จ
      setShowDeleteSuccess(true);

    } catch (error) {
      console.error(
        'DELETE ERROR:',
        error
      );

      setShowDeleteConfirm(false);

      Alert.alert(
        'เกิดข้อผิดพลาด',
        error instanceof Error
          ? error.message
          : 'ไม่สามารถลบสินค้าได้'
      );
    } finally {
      setDeleting(false);
    }
  }

  // ============================================
  // BACK HOME AFTER DELETE
  // ============================================

  function goHomeAfterDelete() {
    // ปิดกล่องแจ้งเตือนก่อน
    setShowDeleteSuccess(false);

    // กลับหน้า Home
    router.replace('/(main)');
  }

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.center}>
          <View
            style={styles.loadingCircle}
          >
            <Ionicons
              name="speedometer-outline"
              size={38}
              color="#FF3D00"
            />
          </View>

          <ActivityIndicator
            size="small"
            color="#FF3D00"
          />

          <Text
            style={styles.loadingTitle}
          >
            กำลังโหลดข้อมูล
          </Text>

          <Text
            style={styles.loadingText}
          >
            กำลังเตรียมรายละเอียดสินค้า...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================
  // NOT FOUND
  // ============================================

  if (!product) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.center}>
          <View
            style={styles.notFoundIcon}
          >
            <Ionicons
              name="cube-outline"
              size={55}
              color="#777777"
            />
          </View>

          <Text
            style={styles.notFound}
          >
            ไม่พบสินค้า
          </Text>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() =>
              router.replace('/(main)')
            }
          >
            <Ionicons
              name="home-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text
              style={styles.homeButtonText}
            >
              กลับหน้า Home
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isLowStock =
    product.stock < 5;

  return (
    <SafeAreaView
      style={styles.container}
    >

      {/* ====================================
          HEADER
      ==================================== */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
          disabled={deleting}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View
          style={styles.headerCenter}
        >
          <Text
            style={styles.headerMini}
          >
            GARAGE
          </Text>

          <Text
            style={styles.headerTitle}
          >
            รายละเอียดสินค้า
          </Text>
        </View>

        <View
          style={styles.headerBadge}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={19}
            color="#FF3D00"
          />
        </View>
      </View>

      {/* ====================================
          CONTENT
      ==================================== */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >

        {/* ====================================
            PRODUCT IMAGE
        ==================================== */}

        <View
          style={styles.imageSection}
        >
          <View
            style={styles.imageTopBar}
          >
            <View
              style={styles.racingBadge}
            >
              <Ionicons
                name="flash-outline"
                size={15}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.racingBadgeText
                }
              >
                RACING PART
              </Text>
            </View>

            <Text
              style={styles.productId}
            >
              #{product.id}
            </Text>
          </View>

          {product.image_url ? (
            <Image
              source={{
                uri:
                  product.image_url,
              }}
              style={
                styles.productImage
              }
              resizeMode="contain"
            />
          ) : (
            <View
              style={styles.noImage}
            >
              <Ionicons
                name="image-outline"
                size={65}
                color="#555555"
              />

              <Text
                style={
                  styles.noImageText
                }
              >
                ไม่มีรูปสินค้า
              </Text>
            </View>
          )}

          <View
            style={styles.imageBottom}
          >
            <View
              style={
                styles.imageLine
              }
            />

            <Text
              style={styles.imageCaption}
            >
              MOTORCYCLE • FAIRING
            </Text>
          </View>
        </View>

        {/* ====================================
            PRODUCT TITLE
        ==================================== */}

        <View
          style={styles.titleSection}
        >
          <Text
            style={styles.productName}
          >
            {product.name}
          </Text>

          <View
            style={styles.modelBadge}
          >
            <Ionicons
              name="bicycle-outline"
              size={17}
              color="#FF3D00"
            />

            <Text
              style={styles.modelBadgeText}
            >
              {product.model}
            </Text>
          </View>
        </View>

        {/* ====================================
            PRICE
        ==================================== */}

        <View
          style={styles.priceCard}
        >
          <View>
            <Text
              style={styles.priceLabel}
            >
              ราคาจำหน่าย
            </Text>

            <Text
              style={styles.price}
            >
              ฿
              {Number(
                product.price
              ).toLocaleString(
                'th-TH'
              )}
            </Text>
          </View>

          <View
            style={styles.priceIcon}
          >
            <Ionicons
              name="pricetag-outline"
              size={27}
              color="#FF3D00"
            />
          </View>
        </View>

        {/* ====================================
            SPECIFICATION
        ==================================== */}

        <View
          style={styles.sectionTitleRow}
        >
          <View
            style={styles.sectionLine}
          />

          <Text
            style={styles.sectionTitle}
          >
            SPECIFICATION
          </Text>

          <View
            style={styles.sectionLine}
          />
        </View>

        <View
          style={styles.infoGrid}
        >

          {/* MODEL */}

          <View
            style={styles.infoCard}
          >
            <View
              style={styles.infoIcon}
            >
              <Ionicons
                name="bicycle-outline"
                size={21}
                color="#FF3D00"
              />
            </View>

            <Text
              style={styles.infoLabel}
            >
              รุ่นรถ
            </Text>

            <Text
              style={styles.infoValue}
            >
              {product.model ||
                '-'}
            </Text>
          </View>

          {/* COLOR */}

          <View
            style={styles.infoCard}
          >
            <View
              style={styles.infoIcon}
            >
              <Ionicons
                name="color-palette-outline"
                size={21}
                color="#FF3D00"
              />
            </View>

            <Text
              style={styles.infoLabel}
            >
              สี
            </Text>

            <Text
              style={styles.infoValue}
            >
              {product.color ||
                '-'}
            </Text>
          </View>

          {/* STOCK */}

          <View
            style={styles.infoCard}
          >
            <View
              style={styles.infoIcon}
            >
              <Ionicons
                name="cube-outline"
                size={21}
                color={
                  isLowStock
                    ? '#FF3D00'
                    : '#42A047'
                }
              />
            </View>

            <Text
              style={styles.infoLabel}
            >
              สต็อก
            </Text>

            <Text
              style={[
                styles.infoValue,
                isLowStock &&
                  styles.lowStock,
              ]}
            >
              {product.stock}{' '}
              ชิ้น
            </Text>

            <View
              style={[
                styles.stockBadge,
                isLowStock
                  ? styles.stockLow
                  : styles.stockGood,
              ]}
            >
              <Text
                style={
                  styles.stockBadgeText
                }
              >
                {isLowStock
                  ? 'เหลือน้อย'
                  : 'พร้อมขาย'}
              </Text>
            </View>
          </View>

        </View>

        {/* ====================================
            DESCRIPTION
        ==================================== */}

        <View
          style={styles.descriptionBox}
        >
          <View
            style={
              styles.descriptionHeader
            }
          >
            <View
              style={
                styles.descriptionIcon
              }
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#FF3D00"
              />
            </View>

            <Text
              style={
                styles.descriptionTitle
              }
            >
              รายละเอียดสินค้า
            </Text>
          </View>

          <Text
            style={styles.description}
          >
            {product.description ||
              'ไม่มีรายละเอียดสินค้า'}
          </Text>
        </View>

        {/* ====================================
            ADMIN ACTIONS
        ==================================== */}

        {user?.role ===
          'admin' && (
          <View
            style={styles.adminSection}
          >

            <View
              style={
                styles.adminHeader
              }
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color="#FF3D00"
              />

              <Text
                style={
                  styles.adminHeaderText
                }
              >
                ADMIN CONTROL
              </Text>
            </View>

            {/* EDIT */}

            <TouchableOpacity
              style={[
                styles.editButton,
                deleting &&
                  styles.disabledButton,
              ]}
              onPress={
                openEdit
              }
              disabled={deleting}
              activeOpacity={0.8}
            >
              <View
                style={
                  styles.actionIcon
                }
              >
                <Ionicons
                  name="create-outline"
                  size={21}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={
                  styles.actionTextBox
                }
              >
                <Text
                  style={
                    styles.actionTitle
                  }
                >
                  แก้ไขสินค้า
                </Text>

                <Text
                  style={
                    styles.actionSubtitle
                  }
                >
                  แก้ไขข้อมูลสินค้า
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* DELETE */}

            <TouchableOpacity
              style={[
                styles.deleteButton,
                deleting &&
                  styles.disabledButton,
              ]}
              onPress={
                confirmDelete
              }
              disabled={deleting}
              activeOpacity={0.8}
            >
              <View
                style={
                  styles.actionIcon
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={21}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={
                  styles.actionTextBox
                }
              >
                <Text
                  style={
                    styles.actionTitle
                  }
                >
                  ลบสินค้า
                </Text>

                <Text
                  style={
                    styles.actionSubtitle
                  }
                >
                  ลบออกจากระบบถาวร
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

          </View>
        )}

        {/* ====================================
            HOME BUTTON
        ==================================== */}

        <TouchableOpacity
          style={
            styles.homeButtonBottom
          }
          onPress={() =>
            router.replace('/(main)')
          }
          disabled={deleting}
          activeOpacity={0.8}
        >
          <Ionicons
            name="home-outline"
            size={20}
            color="#FF3D00"
          />

          <Text
            style={
              styles.homeButtonBottomText
            }
          >
            กลับหน้า Home
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.footerText}
        >
          MOTORCYCLE INVENTORY SYSTEM
        </Text>

      </ScrollView>

      {/* ====================================
          DELETE CONFIRM MODAL
      ==================================== */}

      {showDeleteConfirm && (
        <View
          style={styles.overlay}
        >
          <View
            style={styles.confirmBox}
          >

            <View
              style={
                styles.confirmTopLine
              }
            />

            <View
              style={
                styles.confirmIcon
              }
            >
              <Ionicons
                name="trash-outline"
                size={35}
                color="#FF3D00"
              />
            </View>

            <Text
              style={
                styles.confirmTitle
              }
            >
              ลบสินค้า?
            </Text>

            <Text
              style={
                styles.confirmMessage
              }
            >
              คุณต้องการลบสินค้านี้ใช่หรือไม่
            </Text>

            <View
              style={
                styles.confirmProduct
              }
            >
              <Text
                style={
                  styles.confirmProductName
                }
                numberOfLines={2}
              >
                {product.name}
              </Text>
            </View>

            <View
              style={
                styles.warningBox
              }
            >
              <Ionicons
                name="warning-outline"
                size={18}
                color="#FF3D00"
              />

              <Text
                style={
                  styles.confirmWarning
                }
              >
                เมื่อลบแล้วจะไม่สามารถกู้คืนได้
              </Text>
            </View>

            <View
              style={
                styles.confirmButtons
              }
            >

              {/* CANCEL */}

              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={
                  cancelDelete
                }
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  ยกเลิก
                </Text>
              </TouchableOpacity>

              {/* CONFIRM DELETE */}

              <TouchableOpacity
                style={
                  styles.confirmDeleteButton
                }
                onPress={
                  deleteProduct
                }
                disabled={deleting}
                activeOpacity={0.8}
              >

                {deleting ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={19}
                    color="#FFFFFF"
                  />
                )}

                <Text
                  style={
                    styles.confirmDeleteText
                  }
                >
                  {deleting
                    ? 'กำลังลบ...'
                    : 'ยืนยันลบ'}
                </Text>

              </TouchableOpacity>

            </View>

          </View>
        </View>
      )}

      {/* ====================================
          DELETE SUCCESS MODAL
      ==================================== */}

      {showDeleteSuccess && (
        <View
          style={styles.overlay}
        >
          <View
            style={styles.successBox}
          >

            {/* TOP LINE */}

            <View
              style={
                styles.successTopLine
              }
            />

            {/* SUCCESS ICON */}

            <View
              style={
                styles.successIcon
              }
            >
              <Ionicons
                name="checkmark"
                size={40}
                color="#42A047"
              />
            </View>

            {/* TITLE */}

            <Text
              style={
                styles.successTitle
              }
            >
              ลบสินค้าสำเร็จ
            </Text>

            {/* MESSAGE */}

            <Text
              style={
                styles.successMessage
              }
            >
              ลบสินค้าออกจากระบบเรียบร้อยแล้ว
            </Text>

            {/* OK BUTTON */}

            <TouchableOpacity
              style={
                styles.successButton
              }
              onPress={
                goHomeAfterDelete
              }
              activeOpacity={0.8}
            >
              <Ionicons
                name="home-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.successButtonText
                }
              >
                ตกลง
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  loadingCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2B2B2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  loadingTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  loadingText: {
    marginTop: 6,
    fontSize: 13,
    color: '#777777',
  },

  notFoundIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#171719',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#29292C',
  },

  notFound: {
    marginTop: 15,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ================================================
  // HEADER
  // ================================================

  header: {
    height: 68,
    backgroundColor: '#101012',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#242426',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1C1C1F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerMini: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#FF3D00',
  },

  headerTitle: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1C1C1F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },

  // ================================================
  // CONTENT
  // ================================================

  content: {
    padding: 16,
    paddingBottom: 45,
  },

  // ================================================
  // IMAGE
  // ================================================

  imageSection: {
    backgroundColor: '#121214',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#29292C',
  },

  imageTopBar: {
    height: 45,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181A',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },

  racingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3D00',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },

  racingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 4,
    letterSpacing: 0.8,
  },

  productId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
  },

  productImage: {
    width: '100%',
    height: 290,
    backgroundColor: '#151517',
  },

  noImage: {
    width: '100%',
    height: 290,
    backgroundColor: '#151517',
    justifyContent: 'center',
    alignItems: 'center',
  },

  noImageText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 13,
  },

  imageBottom: {
    height: 38,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  imageLine: {
    width: 28,
    height: 3,
    backgroundColor: '#FF3D00',
    marginRight: 8,
  },

  imageCaption: {
    fontSize: 9,
    fontWeight: '800',
    color: '#666666',
    letterSpacing: 1.5,
  },

  // ================================================
  // TITLE
  // ================================================

  titleSection: {
    marginTop: 20,
  },

  productName: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  modelBadge: {
    alignSelf: 'flex-start',
    marginTop: 11,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#19191B',
    borderWidth: 1,
    borderColor: '#303034',
    flexDirection: 'row',
    alignItems: 'center',
  },

  modelBadgeText: {
    color: '#BBBBBB',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },

  // ================================================
  // PRICE
  // ================================================

  priceCard: {
    marginTop: 18,
    backgroundColor: '#171719',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#29292C',
  },

  priceLabel: {
    fontSize: 11,
    color: '#777777',
    fontWeight: '700',
    letterSpacing: 1,
  },

  price: {
    marginTop: 4,
    fontSize: 29,
    fontWeight: '900',
    color: '#FF3D00',
  },

  priceIcon: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: '#221510',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ================================================
  // SECTION
  // ================================================

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 27,
    marginBottom: 13,
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#29292C',
  },

  sectionTitle: {
    marginHorizontal: 10,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#777777',
  },

  // ================================================
  // INFO
  // ================================================

  infoGrid: {
    flexDirection: 'row',
    gap: 9,
  },

  infoCard: {
    flex: 1,
    minHeight: 145,
    backgroundColor: '#171719',
    borderRadius: 15,
    padding: 13,
    borderWidth: 1,
    borderColor: '#29292C',
  },

  infoIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: '#221510',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  infoLabel: {
    fontSize: 10,
    color: '#6F6F73',
    fontWeight: '700',
    marginBottom: 5,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  lowStock: {
    color: '#FF3D00',
  },

  stockBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },

  stockGood: {
    backgroundColor: '#14351C',
  },

  stockLow: {
    backgroundColor: '#3A1812',
  },

  stockBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CCCCCC',
  },

  // ================================================
  // DESCRIPTION
  // ================================================

  descriptionBox: {
    marginTop: 13,
    backgroundColor: '#171719',
    borderRadius: 16,
    padding: 17,
    borderWidth: 1,
    borderColor: '#29292C',
  },

  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  descriptionIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: '#221510',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  descriptionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  description: {
    fontSize: 14,
    lineHeight: 23,
    color: '#999999',
  },

  // ================================================
  // ADMIN
  // ================================================

  adminSection: {
    marginTop: 25,
  },

  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  adminHeaderText: {
    marginLeft: 7,
    color: '#FF3D00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
  },

  editButton: {
    minHeight: 65,
    backgroundColor: '#2420A8',
    borderRadius: 14,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  deleteButton: {
    minHeight: 65,
    backgroundColor: '#B3261E',
    borderRadius: 14,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor:
      'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionTextBox: {
    flex: 1,
    marginLeft: 11,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  actionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color:
      'rgba(255,255,255,0.65)',
  },

  disabledButton: {
    opacity: 0.55,
  },

  // ================================================
  // HOME
  // ================================================

  homeButton: {
    marginTop: 22,
    paddingHorizontal: 22,
    height: 49,
    borderRadius: 12,
    backgroundColor: '#FF3D00',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  homeButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 7,
  },

  homeButtonBottom: {
    height: 53,
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#FF3D00',
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#171719',
  },

  homeButtonBottomText: {
    color: '#FF3D00',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },

  footerText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#3F3F42',
  },

  // ================================================
  // DELETE MODAL
  // ================================================

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
    elevation: 999,
  },

  confirmBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#171719',
    borderRadius: 20,
    padding: 23,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333336',
    elevation: 15,
  },

  confirmTopLine: {
    position: 'absolute',
    top: 0,
    left: 35,
    right: 35,
    height: 4,
    backgroundColor: '#FF3D00',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  confirmIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#321A14',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
  },

  confirmTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 9,
  },

  confirmMessage: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 12,
  },

  confirmProduct: {
    width: '100%',
    backgroundColor: '#101012',
    borderRadius: 11,
    padding: 12,
    borderWidth: 1,
    borderColor: '#29292C',
    marginBottom: 12,
  },

  confirmProductName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  warningBox: {
    width: '100%',
    padding: 10,
    borderRadius: 9,
    backgroundColor: '#321A14',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  confirmWarning: {
    fontSize: 11,
    color: '#FF8A65',
    textAlign: 'center',
    marginLeft: 6,
  },

  confirmButtons: {
    width: '100%',
    flexDirection: 'row',
  },

  cancelButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#3A3A3D',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    backgroundColor: '#202023',
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#BBBBBB',
  },

  confirmDeleteButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#FF3D00',
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },

  confirmDeleteText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 7,
  },

  // ================================================
  // DELETE SUCCESS MODAL
  // ================================================

  successBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#171719',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333336',
    elevation: 15,
  },

  successTopLine: {
    position: 'absolute',
    top: 0,
    left: 35,
    right: 35,
    height: 4,
    backgroundColor: '#42A047',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#14351C',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 7,
    marginBottom: 16,
  },

  successTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 9,
  },

  successMessage: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },

  successButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#42A047',
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  successButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 7,
  },

});