import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFocusEffect,
  useRouter,
} from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
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

export default function ProductsListScreen() {
  const router = useRouter();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [
    deleteModalVisible,
    setDeleteModalVisible,
  ] = useState(false);

  const [
    successModalVisible,
    setSuccessModalVisible,
  ] = useState(false);

  const [
    errorModalVisible,
    setErrorModalVisible,
  ] = useState(false);

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<Product | null>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  // ============================================
  // USER
  // ============================================

  async function getUser() {
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
        'GET USER ERROR:',
        error
      );

      await AsyncStorage.removeItem(
        'authUser'
      );

      router.replace('/login');

      return null;
    }
  }

  // ============================================
  // LOAD PRODUCTS
  // ============================================

  const loadProducts =
    useCallback(async () => {
      try {
        setLoading(true);

        const currentUser =
          await getUser();

        if (!currentUser) {
          return;
        }

        const response =
          await fetch(API_URL, {
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
          });

        const text =
          await response.text();

        console.log(
          'PRODUCT LIST STATUS:',
          response.status
        );

        console.log(
          'PRODUCT LIST RESPONSE:',
          text
        );

        let data: any;

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            `Server ไม่ได้ส่ง JSON กลับมา (HTTP ${response.status})`
          );
        }

        // ======================================
        // UNAUTHORIZED
        // ======================================

        if (
          response.status === 401
        ) {
          await AsyncStorage.removeItem(
            'authUser'
          );

          router.replace('/login');

          return;
        }

        // ======================================
        // ERROR
        // ======================================

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              'ไม่สามารถโหลดสินค้าได้'
          );
        }

        // ======================================
        // CHECK DATA
        // ======================================

        if (!Array.isArray(data)) {
          throw new Error(
            'รูปแบบข้อมูลสินค้าไม่ถูกต้อง'
          );
        }

        setProducts(data);

      } catch (error) {
        console.error(
          'LOAD PRODUCTS ERROR:',
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'ไม่สามารถโหลดสินค้าได้'
        );

        setErrorModalVisible(true);

      } finally {
        setLoading(false);
      }
    }, []);

  // ============================================
  // FOCUS
  // ============================================

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  // ============================================
  // REFRESH
  // ============================================

  async function refreshProducts() {
    try {
      setRefreshing(true);

      await loadProducts();

    } finally {
      setRefreshing(false);
    }
  }

  // ============================================
  // SEARCH
  // ============================================

  const keyword =
    search.trim().toLowerCase();

  const filteredProducts =
    products.filter((item) => {
      if (!keyword) {
        return true;
      }

      return (
        item.name
          ?.toLowerCase()
          .includes(keyword) ||

        item.model
          ?.toLowerCase()
          .includes(keyword) ||

        item.color
          ?.toLowerCase()
          .includes(keyword)
      );
    });

  // ============================================
  // DETAIL
  // ============================================

  function openProduct(id: number) {
    router.push({
      pathname: '/products',
      params: {
        id: String(id),
      },
    });
  }

  // ============================================
  // DELETE MODAL
  // ============================================

  function openDeleteModal(
    product: Product
  ) {
    // เฉพาะ Admin
    if (user?.role !== 'admin') {
      setErrorMessage(
        'เฉพาะ Admin เท่านั้นที่สามารถลบสินค้าได้'
      );

      setErrorModalVisible(true);

      return;
    }

    setSelectedProduct(product);

    setDeleteModalVisible(true);
  }

  function closeDeleteModal() {
    if (deletingId !== null) {
      return;
    }

    setDeleteModalVisible(false);

    setSelectedProduct(null);
  }

  // ============================================
  // DELETE PRODUCT
  // ============================================

  async function deleteProduct() {
    if (
      !selectedProduct ||
      deletingId !== null
    ) {
      return;
    }

    // ==========================================
    // CHECK USER
    // ==========================================

    if (!user) {
      setDeleteModalVisible(false);

      setSelectedProduct(null);

      router.replace('/login');

      return;
    }

    // ==========================================
    // CHECK ADMIN
    // ==========================================

    if (user.role !== 'admin') {
      setDeleteModalVisible(false);

      setSelectedProduct(null);

      setErrorMessage(
        'คุณไม่มีสิทธิ์ลบสินค้า'
      );

      setErrorModalVisible(true);

      return;
    }

    const id =
      selectedProduct.id;

    try {
      setDeletingId(id);

      // ========================================
      // DELETE API
      // ========================================

      const response =
        await fetch(
          `${API_URL}/${id}`,
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

      console.log(
        'DELETE PRODUCT STATUS:',
        response.status
      );

      console.log(
        'DELETE PRODUCT RESPONSE:',
        text
      );

      // ========================================
      // PARSE RESPONSE
      // ========================================

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
      // SESSION EXPIRED
      // ========================================

      if (
        response.status === 401
      ) {
        await AsyncStorage.removeItem(
          'authUser'
        );

        setDeleteModalVisible(false);

        setSelectedProduct(null);

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
      // REMOVE FROM LOCAL LIST
      // ========================================

      setProducts(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id
          )
      );

      // ========================================
      // CLOSE DELETE CONFIRM MODAL
      // ========================================

      setDeleteModalVisible(false);

      setSelectedProduct(null);

      // ========================================
      // SHOW SUCCESS MESSAGE
      // ========================================

      setSuccessModalVisible(true);

    } catch (error) {
      console.error(
        'DELETE ERROR:',
        error
      );

      setDeleteModalVisible(false);

      setSelectedProduct(null);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถลบสินค้าได้'
      );

      setErrorModalVisible(true);

    } finally {
      setDeletingId(null);
    }
  }

  // ============================================
  // LOADING SCREEN
  // ============================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={
            styles.loadingScreen
          }
        >

          <View
            style={
              styles.loadingLogo
            }
          >
            <Ionicons
              name="speedometer-outline"
              size={42}
              color="#FF3131"
            />
          </View>

          <Text
            style={
              styles.loadingTitle
            }
          >
            GARAGE
          </Text>

          <Text
            style={
              styles.loadingText
            }
          >
            กำลังโหลดสินค้า...
          </Text>

          <ActivityIndicator
            size="small"
            color="#FF3131"
            style={{
              marginTop: 18,
            }}
          />

        </View>
      </SafeAreaView>
    );
  }

  // ============================================
  // MAIN
  // ============================================

  return (
    <SafeAreaView
      style={styles.container}
    >

      {/* ========================================
          HEADER
      ======================================== */}

      <View
        style={styles.header}
      >

        <View
          style={styles.headerLeft}
        >

          <View
            style={styles.logoBox}
          >
            <Ionicons
              name="bicycle-outline"
              size={26}
              color="#FFFFFF"
            />
          </View>

          <View>

            <Text
              style={
                styles.headerKicker
              }
            >
              MOTORCYCLE
            </Text>

            <Text
              style={
                styles.headerTitle
              }
            >
              GARAGE
            </Text>

            <View
              style={
                styles.titleLine
              }
            />

          </View>

        </View>

        {/* ADD PRODUCT */}

        {user?.role ===
          'admin' && (
          <TouchableOpacity
            style={
              styles.addButton
            }
            onPress={() =>
              router.push('/add')
            }
            activeOpacity={0.8}
          >

            <Ionicons
              name="add"
              size={22}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.addButtonText
              }
            >
              เพิ่มสินค้า
            </Text>

          </TouchableOpacity>
        )}

      </View>

      {/* ========================================
          SEARCH
      ======================================== */}

      <View
        style={
          styles.searchSection
        }
      >

        <View
          style={styles.searchBox}
        >

          <View
            style={
              styles.searchIconBox
            }
          >
            <Ionicons
              name="search"
              size={20}
              color="#FF3131"
            />
          </View>

          <TextInput
            style={
              styles.searchInput
            }
            placeholder="ค้นหาชื่อ รุ่น หรือสี..."
            placeholderTextColor="#777777"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                setSearch('')
              }
            >
              <Ionicons
                name="close-circle"
                size={21}
                color="#777777"
              />
            </TouchableOpacity>
          )}

        </View>

        <View
          style={
            styles.searchBottomLine
          }
        />

      </View>

      {/* ========================================
          RESULT HEADER
      ======================================== */}

      <View
        style={
          styles.resultHeader
        }
      >

        <View>

          <Text
            style={
              styles.sectionKicker
            }
          >
            PRODUCT INVENTORY
          </Text>

          <Text
            style={styles.resultText}
          >
            {search
              ? `พบ ${filteredProducts.length} รายการ`
              : `${products.length} รายการสินค้า`}
          </Text>

        </View>

        <View
          style={styles.countBadge}
        >

          <Text
            style={
              styles.countNumber
            }
          >
            {filteredProducts.length}
          </Text>

          <Text
            style={
              styles.countLabel
            }
          >
            ITEMS
          </Text>

        </View>

      </View>

      {/* ========================================
          PRODUCT LIST
      ======================================== */}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) =>
          String(item.id)
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.listContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              refreshProducts
            }
            tintColor="#FF3131"
            colors={[
              '#FF3131',
            ]}
          />
        }
        renderItem={({ item }) => (
          <View
            style={
              styles.productCard
            }
          >

            {/* RED ACCENT */}

            <View
              style={
                styles.cardAccent
              }
            />

            {/* PRODUCT IMAGE */}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                openProduct(
                  item.id
                )
              }
              style={
                styles.imageWrapper
              }
            >

              {item.image_url ? (
                <Image
                  source={{
                    uri:
                      item.image_url,
                  }}
                  style={
                    styles.productImage
                  }
                />
              ) : (
                <View
                  style={
                    styles.noImage
                  }
                >

                  <Ionicons
                    name="image-outline"
                    size={42}
                    color="#555555"
                  />

                  <Text
                    style={
                      styles.noImageText
                    }
                  >
                    NO IMAGE
                  </Text>

                </View>
              )}

              <View
                style={
                  styles.imageOverlay
                }
              >
                <Ionicons
                  name="scan-outline"
                  size={17}
                  color="#FFFFFF"
                />
              </View>

            </TouchableOpacity>

            {/* PRODUCT INFO */}

            <TouchableOpacity
              style={
                styles.productInfo
              }
              activeOpacity={0.7}
              onPress={() =>
                openProduct(
                  item.id
                )
              }
            >

              <View
                style={
                  styles.modelBadge
                }
              >

                <Text
                  style={
                    styles.modelBadgeText
                  }
                >
                  {item.model ||
                    'MOTORCYCLE'}
                </Text>

              </View>

              <Text
                style={
                  styles.productName
                }
                numberOfLines={2}
              >
                {item.name}
              </Text>

              <View
                style={
                  styles.detailRow
                }
              >

                <Ionicons
                  name="color-palette-outline"
                  size={14}
                  color="#888888"
                />

                <Text
                  style={
                    styles.infoText
                  }
                >
                  {item.color ||
                    '-'}
                </Text>

              </View>

              <View
                style={
                  styles.priceRow
                }
              >

                <Text
                  style={
                    styles.priceText
                  }
                >
                  ฿
                  {Number(
                    item.price
                  ).toLocaleString(
                    'th-TH'
                  )}
                </Text>

                <View
                  style={[
                    styles.stockBadge,
                    item.stock <= 0 &&
                      styles.stockBadgeOut,
                  ]}
                >

                  <View
                    style={[
                      styles.stockDot,
                      item.stock <= 0 &&
                        styles.stockDotOut,
                    ]}
                  />

                  <Text
                    style={[
                      styles.stockText,
                      item.stock <= 0 &&
                        styles.outOfStock,
                    ]}
                  >
                    {item.stock > 0
                      ? `${item.stock} IN STOCK`
                      : 'OUT OF STOCK'}
                  </Text>

                </View>

              </View>

            </TouchableOpacity>

            {/* ACTIONS */}

            <View
              style={
                styles.actions
              }
            >

              {/* DETAIL */}

              <TouchableOpacity
                style={
                  styles.detailButton
                }
                onPress={() =>
                  openProduct(
                    item.id
                  )
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-forward"
                  size={21}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              {/* DELETE */}

              {user?.role ===
                'admin' && (
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    deletingId ===
                      item.id &&
                      styles.disabledButton,
                  ]}
                  disabled={
                    deletingId !==
                    null
                  }
                  onPress={() =>
                    openDeleteModal(
                      item
                    )
                  }
                  activeOpacity={0.8}
                >

                  {deletingId ===
                  item.id ? (
                    <ActivityIndicator
                      size="small"
                      color="#FF3131"
                    />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#FF3131"
                    />
                  )}

                </TouchableOpacity>
              )}

            </View>

          </View>
        )}

        /* ======================================
            EMPTY
        ====================================== */

        ListEmptyComponent={
          <View
            style={
              styles.emptyContainer
            }
          >

            <View
              style={
                styles.emptyIconBox
              }
            >
              <Ionicons
                name="speedometer-outline"
                size={55}
                color="#FF3131"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              NO BIKE FOUND
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {search
                ? 'ไม่พบสินค้าที่ตรงกับคำค้นหา'
                : 'ยังไม่มีสินค้าในระบบ'}
            </Text>

            {search && (
              <TouchableOpacity
                style={
                  styles.clearButton
                }
                onPress={() =>
                  setSearch('')
                }
              >

                <Ionicons
                  name="refresh"
                  size={17}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.clearButtonText
                  }
                >
                  ล้างการค้นหา
                </Text>

              </TouchableOpacity>
            )}

          </View>
        }
      />

      {/* ========================================
          DELETE CONFIRM MODAL
      ======================================== */}

      <Modal
        visible={
          deleteModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeDeleteModal
        }
      >

        <View
          style={
            styles.modalOverlay
          }
        >

          <View
            style={styles.modalBox}
          >

            <View
              style={
                styles.modalTopLine
              }
            />

            {/* ICON */}

            <View
              style={
                styles.modalIconDelete
              }
            >
              <Ionicons
                name="trash-outline"
                size={32}
                color="#FF3131"
              />
            </View>

            <Text
              style={
                styles.modalKicker
              }
            >
              DELETE PRODUCT
            </Text>

            <Text
              style={
                styles.modalTitle
              }
            >
              ลบสินค้า?
            </Text>

            <Text
              style={
                styles.modalMessage
              }
            >
              คุณต้องการลบสินค้านี้ใช่หรือไม่?
            </Text>

            {/* SELECTED PRODUCT */}

            {selectedProduct && (
              <View
                style={
                  styles.selectedProductBox
                }
              >

                {selectedProduct.image_url ? (
                  <Image
                    source={{
                      uri:
                        selectedProduct.image_url,
                    }}
                    style={
                      styles.modalProductImage
                    }
                  />
                ) : (
                  <View
                    style={
                      styles.modalNoImage
                    }
                  >
                    <Ionicons
                      name="bicycle-outline"
                      size={30}
                      color="#555555"
                    />
                  </View>
                )}

                <View
                  style={
                    styles.modalProductInfo
                  }
                >

                  <Text
                    style={
                      styles.modalProductName
                    }
                    numberOfLines={2}
                  >
                    {
                      selectedProduct.name
                    }
                  </Text>

                  <Text
                    style={
                      styles.modalProductDetail
                    }
                  >
                    {
                      selectedProduct.model ||
                      '-'
                    }
                  </Text>

                  <Text
                    style={
                      styles.modalProductColor
                    }
                  >
                    {
                      selectedProduct.color ||
                      '-'
                    }
                  </Text>

                </View>

              </View>
            )}

            {/* WARNING */}

            <View
              style={
                styles.warningBar
              }
            >

              <Ionicons
                name="warning-outline"
                size={17}
                color="#FF3131"
              />

              <Text
                style={
                  styles.warningText
                }
              >
                เมื่อลบแล้วจะไม่สามารถกู้คืนได้
              </Text>

            </View>

            {/* BUTTONS */}

            <View
              style={
                styles.modalButtons
              }
            >

              {/* CANCEL */}

              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={
                  closeDeleteModal
                }
                disabled={
                  deletingId !== null
                }
              >

                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  ยกเลิก
                </Text>

              </TouchableOpacity>

              {/* CONFIRM */}

              <TouchableOpacity
                style={
                  styles.confirmDeleteButton
                }
                onPress={
                  deleteProduct
                }
                disabled={
                  deletingId !== null
                }
              >

                {deletingId !==
                null ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                )}

                <Text
                  style={
                    styles.confirmDeleteText
                  }
                >
                  {deletingId !==
                  null
                    ? 'กำลังลบ...'
                    : 'ยืนยันลบ'}
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

      {/* ========================================
          SUCCESS MODAL
      ======================================== */}

      <Modal
        visible={
          successModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSuccessModalVisible(
            false
          )
        }
      >

        <View
          style={
            styles.modalOverlay
          }
        >

          <View
            style={styles.modalBox}
          >

            {/* SUCCESS ICON */}

            <View
              style={
                styles.successIcon
              }
            >
              <Ionicons
                name="checkmark"
                size={40}
                color="#38D39F"
              />
            </View>

            <Text
              style={
                styles.modalKicker
              }
            >
              SYSTEM UPDATED
            </Text>

            <Text
              style={
                styles.modalTitle
              }
            >
              ลบสินค้าสำเร็จ
            </Text>

            <Text
              style={
                styles.modalMessage
              }
            >
              ลบสินค้าออกจากระบบเรียบร้อยแล้ว
            </Text>

            {/* OK → HOME */}

            <TouchableOpacity
              style={
                styles.successButton
              }
              onPress={() => {
                setSuccessModalVisible(
                  false
                );

                // =================================
                // กลับไปหน้า HOME
                // app/main/index.tsx
                // =================================

                router.replace(
                  '/main'
                );
              }}
              activeOpacity={0.8}
            >

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

      </Modal>

      {/* ========================================
          ERROR MODAL
      ======================================== */}

      <Modal
        visible={
          errorModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setErrorModalVisible(
            false
          )
        }
      >

        <View
          style={
            styles.modalOverlay
          }
        >

          <View
            style={styles.modalBox}
          >

            {/* ERROR ICON */}

            <View
              style={
                styles.errorIcon
              }
            >
              <Ionicons
                name="close"
                size={40}
                color="#FF3131"
              />
            </View>

            <Text
              style={
                styles.modalKicker
              }
            >
              SYSTEM ERROR
            </Text>

            <Text
              style={
                styles.modalTitle
              }
            >
              เกิดข้อผิดพลาด
            </Text>

            <Text
              style={
                styles.modalMessage
              }
            >
              {errorMessage}
            </Text>

            <TouchableOpacity
              style={
                styles.errorButton
              }
              onPress={() =>
                setErrorModalVisible(
                  false
                )
              }
              activeOpacity={0.8}
            >

              <Text
                style={
                  styles.errorButtonText
                }
              >
                ปิด
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({

  // ==========================================
  // BASE
  // ==========================================

  container: {
    flex: 1,
    backgroundColor: '#0B0C0E',
  },

  // ==========================================
  // LOADING
  // ==========================================

  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0C0E',
  },

  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#15171A',
    borderWidth: 1,
    borderColor: '#2A2D31',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 5,
    color: '#FFFFFF',
  },

  loadingText: {
    marginTop: 6,
    fontSize: 13,
    color: '#777777',
    letterSpacing: 1,
  },

  // ==========================================
  // HEADER
  // ==========================================

  header: {
    minHeight: 82,
    paddingHorizontal: 17,
    paddingVertical: 12,
    backgroundColor: '#111316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#272A2E',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoBox: {
    width: 48,
    height: 48,
    backgroundColor: '#FF3131',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderRadius: 8,
  },

  headerKicker: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },

  headerTitle: {
    marginTop: -1,
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },

  titleLine: {
    width: 35,
    height: 3,
    marginTop: 3,
    backgroundColor: '#FF3131',
  },

  addButton: {
    height: 43,
    paddingHorizontal: 14,
    backgroundColor: '#FF3131',
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    marginLeft: 5,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  // ==========================================
  // SEARCH
  // ==========================================

  searchSection: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 4,
    backgroundColor: '#0B0C0E',
  },

  searchBox: {
    height: 48,
    backgroundColor: '#15171A',
    borderWidth: 1,
    borderColor: '#292C30',
    borderRadius: 9,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchIconBox: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    marginLeft: 5,
    fontSize: 14,
    color: '#FFFFFF',
    outlineStyle: 'none',
  } as any,

  searchBottomLine: {
    height: 2,
    width: 55,
    marginTop: 5,
    backgroundColor: '#FF3131',
  },

  // ==========================================
  // RESULT HEADER
  // ==========================================

  resultHeader: {
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionKicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
    color: '#FF3131',
  },

  resultText: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  countBadge: {
    minWidth: 52,
    height: 44,
    paddingHorizontal: 8,
    backgroundColor: '#15171A',
    borderWidth: 1,
    borderColor: '#2B2E32',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FF3131',
  },

  countLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: '#666666',
    letterSpacing: 1,
  },

  // ==========================================
  // LIST
  // ==========================================

  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 35,
  },

  // ==========================================
  // PRODUCT CARD
  // ==========================================

  productCard: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 145,
    marginBottom: 12,
    padding: 10,
    paddingLeft: 13,
    backgroundColor: '#15171A',
    borderWidth: 1,
    borderColor: '#292C30',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FF3131',
  },

  imageWrapper: {
    width: 105,
    height: 115,
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: '#0D0E10',
    borderWidth: 1,
    borderColor: '#2B2E32',
  },

  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  imageOverlay: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 27,
    height: 27,
    borderRadius: 6,
    backgroundColor:
      'rgba(255,49,49,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101114',
  },

  noImageText: {
    marginTop: 4,
    fontSize: 7,
    fontWeight: '900',
    color: '#555555',
    letterSpacing: 1,
  },

  // ==========================================
  // PRODUCT INFO
  // ==========================================

  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 7,
    minWidth: 0,
  },

  modelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 5,
    backgroundColor: '#24272B',
    borderRadius: 4,
  },

  modelBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#AAAAAA',
    letterSpacing: 0.8,
  },

  productName: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 5,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#8B8F94',
  },

  priceRow: {
    marginTop: 9,
  },

  priceText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FF3131',
    letterSpacing: 0.3,
  },

  stockBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#10251E',
    borderRadius: 4,
  },

  stockBadgeOut: {
    backgroundColor: '#2A1515',
  },

  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38D39F',
    marginRight: 5,
  },

  stockDotOut: {
    backgroundColor: '#FF3131',
  },

  stockText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#38D39F',
    letterSpacing: 0.5,
  },

  outOfStock: {
    color: '#FF3131',
  },

  // ==========================================
  // ACTIONS
  // ==========================================

  actions: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },

  detailButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FF3131',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#241719',
    borderWidth: 1,
    borderColor: '#492527',
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.45,
  },

  // ==========================================
  // EMPTY
  // ==========================================

  emptyContainer: {
    alignItems: 'center',
    paddingTop: 75,
    paddingHorizontal: 25,
  },

  emptyIconBox: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: '#15171A',
    borderWidth: 1,
    borderColor: '#2C2F33',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFFFFF',
  },

  emptyText: {
    marginTop: 7,
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
  },

  clearButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 7,
    backgroundColor: '#FF3131',
    flexDirection: 'row',
    alignItems: 'center',
  },

  clearButtonText: {
    marginLeft: 6,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },

  // ==========================================
  // MODAL
  // ==========================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  modalBox: {
    position: 'relative',
    width: '100%',
    maxWidth: 450,
    overflow: 'hidden',
    backgroundColor: '#15171A',
    borderWidth: 1,
    borderColor: '#303338',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },

  modalTopLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FF3131',
  },

  modalIconDelete: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#281719',
    borderWidth: 1,
    borderColor: '#5A292D',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },

  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#10251E',
    borderWidth: 1,
    borderColor: '#245440',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },

  errorIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#281719',
    borderWidth: 1,
    borderColor: '#5A292D',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },

  modalKicker: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FF3131',
    letterSpacing: 2,
    marginBottom: 4,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  modalMessage: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#888888',
    textAlign: 'center',
  },

  // ==========================================
  // SELECTED PRODUCT
  // ==========================================

  selectedProductBox: {
    width: '100%',
    marginTop: 18,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#0D0E10',
    borderWidth: 1,
    borderColor: '#292C30',
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalProductImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#111316',
    resizeMode: 'contain',
  },

  modalNoImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#111316',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalProductInfo: {
    flex: 1,
    marginLeft: 12,
  },

  modalProductName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  modalProductDetail: {
    marginTop: 4,
    fontSize: 11,
    color: '#888888',
  },

  modalProductColor: {
    marginTop: 2,
    fontSize: 11,
    color: '#FF3131',
    fontWeight: '700',
  },

  // ==========================================
  // WARNING
  // ==========================================

  warningBar: {
    width: '100%',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#241719',
    borderWidth: 1,
    borderColor: '#492527',
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  warningText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 11,
    color: '#FF8A8A',
  },

  // ==========================================
  // MODAL BUTTONS
  // ==========================================

  modalButtons: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 18,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#383B40',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    backgroundColor: '#1B1D20',
  },

  cancelButtonText: {
    color: '#BBBBBB',
    fontWeight: '800',
    fontSize: 14,
  },

  confirmDeleteButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FF3131',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },

  confirmDeleteText: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginLeft: 6,
    fontSize: 14,
  },

  // ==========================================
  // SUCCESS
  // ==========================================

  successButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#38D39F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  successButtonText: {
    color: '#07130F',
    fontWeight: '900',
    fontSize: 14,
  },

  // ==========================================
  // ERROR
  // ==========================================

  errorButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FF3131',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  errorButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },

});