import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
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
  image_url?: string;
}

interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export default function HomeScreen() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [logoutModal, setLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ==========================================
  // LOAD USER + PRODUCTS
  // ==========================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const savedUser =
        await AsyncStorage.getItem('authUser');

      if (!savedUser) {
        router.replace('/login');
        return;
      }

      let currentUser: AuthUser;

      try {
        currentUser = JSON.parse(savedUser);
      } catch {
        await AsyncStorage.removeItem('authUser');
        router.replace('/login');
        return;
      }

      if (
        !currentUser.username ||
        !currentUser.role
      ) {
        await AsyncStorage.removeItem('authUser');
        router.replace('/login');
        return;
      }

      setUser(currentUser);

      const response = await fetch(API_URL, {
        method: 'GET',

        headers: {
          Accept: 'application/json',

          'x-username':
            currentUser.username,

          'x-role':
            currentUser.role,
        },
      });

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          'Server ไม่ได้ส่ง JSON กลับมา'
        );
      }

      if (response.status === 401) {
        await AsyncStorage.removeItem(
          'authUser'
        );

        router.replace('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'โหลดสินค้าไม่สำเร็จ'
        );
      }

      setProducts(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        'HOME ERROR:',
        error
      );

      Alert.alert(
        'เกิดข้อผิดพลาด',
        error instanceof Error
          ? error.message
          : 'ไม่สามารถโหลดข้อมูลได้'
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ==========================================
  // REFRESH
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ==========================================
  // LOGOUT
  // ==========================================

  function openLogoutModal() {
    if (loggingOut) {
      return;
    }

    setLogoutModal(true);
  }

  function closeLogoutModal() {
    if (loggingOut) {
      return;
    }

    setLogoutModal(false);
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await AsyncStorage.removeItem(
        'authUser'
      );

      setLogoutModal(false);

      setUser(null);
      setProducts([]);

      router.replace('/login');
    } catch (error) {
      console.error(
        'LOGOUT ERROR:',
        error
      );

      Alert.alert(
        'ออกจากระบบไม่สำเร็จ',
        'กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setLoggingOut(false);
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
          <View style={styles.loadingLogo}>
            <Ionicons
              name="bicycle"
              size={38}
              color="#FF4D00"
            />
          </View>

          <Text style={styles.loadingBrand}>
            MOTO GARAGE
          </Text>

          <ActivityIndicator
            size="large"
            color="#FF4D00"
          />

          <Text
            style={styles.loadingTitle}
          >
            กำลังเตรียมระบบ
          </Text>

          <Text
            style={styles.loadingText}
          >
            กำลังโหลดข้อมูลสินค้า...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // HOME
  // ==========================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <FlatList
        data={products.slice(0, 5)}
        keyExtractor={(item) =>
          String(item.id)
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.mainList
        }
        ListHeaderComponent={
          <>
            {/* =================================
                HEADER
            ================================= */}

            <View style={styles.header}>
              <View
                style={styles.userSection}
              >
                <View style={styles.avatar}>
                  <Text
                    style={styles.avatarText}
                  >
                    {user?.username
                      ?.charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                <View>
                  <View
                    style={
                      styles.welcomeRow
                    }
                  >
                    <View
                      style={
                        styles.statusDot
                      }
                    />

                    <Text
                      style={
                        styles.welcomeText
                      }
                    >
                      GARAGE ONLINE
                    </Text>
                  </View>

                  <Text
                    style={styles.username}
                  >
                    {user?.username}
                  </Text>

                  <View
                    style={styles.roleBadge}
                  >
                    <Ionicons
                      name={
                        user?.role === 'admin'
                          ? 'shield-checkmark'
                          : 'person'
                      }
                      size={11}
                      color="#FF4D00"
                    />

                    <Text
                      style={styles.roleText}
                    >
                      {user?.role === 'admin'
                        ? ' ADMIN'
                        : ' USER'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={
                  styles.logoutTopButton
                }
                onPress={
                  openLogoutModal
                }
                activeOpacity={0.75}
                disabled={loggingOut}
              >
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {/* =================================
                HERO
            ================================= */}

            <View
              style={styles.heroCard}
            >
              <View
                style={styles.heroStripe}
              />

              <View
                style={styles.heroGlow}
              />

              <View
                style={
                  styles.heroContent
                }
              >
                <View
                  style={styles.heroTag}
                >
                  <Ionicons
                    name="flash"
                    size={13}
                    color="#FF4D00"
                  />

                  <Text
                    style={
                      styles.heroTagText
                    }
                  >
                    PERFORMANCE PARTS
                  </Text>
                </View>

                <Text
                  style={styles.heroSmall}
                >
                  RIDE YOUR STYLE
                </Text>

                <Text
                  style={styles.heroTitle}
                >
                  ชุดสี
                </Text>

                <Text
                  style={
                    styles.heroTitleAccent
                  }
                >
                  มอเตอร์ไซค์
                </Text>

                <Text
                  style={
                    styles.heroSubtitle
                  }
                >
                  เปลี่ยนลุครถของคุณ
                  ให้โดดเด่นทุกเส้นทาง
                </Text>

                <TouchableOpacity
                  style={
                    styles.heroButton
                  }
                  onPress={() =>
                    router.push(
                      '/products-list'
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={
                      styles.heroButtonText
                    }
                  >
                    EXPLORE PRODUCTS
                  </Text>

                  <View
                    style={
                      styles.heroButtonIcon
                    }
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color="#FFFFFF"
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Decorative bike */}

              <View
                style={
                  styles.heroBikeIcon
                }
              >
                <Ionicons
                  name="bicycle"
                  size={125}
                  color="rgba(255,255,255,0.08)"
                />
              </View>

              <View
                style={
                  styles.heroNumber
                }
              >
                <Text
                  style={
                    styles.heroNumberText
                  }
                >
                  01
                </Text>
              </View>
            </View>

            {/* =================================
                SECTION HEADER
            ================================= */}

            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <View
                  style={
                    styles.sectionTitleRow
                  }
                >
                  <View
                    style={
                      styles.orangeBar
                    }
                  />

                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    GARAGE STATUS
                  </Text>
                </View>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  ภาพรวมสินค้าในระบบ
                </Text>
              </View>

              <View
                style={styles.countBadge}
              >
                <Text
                  style={
                    styles.countBadgeNumber
                  }
                >
                  {products.length}
                </Text>

                <Text
                  style={
                    styles.countBadgeLabel
                  }
                >
                  ITEMS
                </Text>
              </View>
            </View>

            {/* =================================
                SUMMARY
            ================================= */}

            <TouchableOpacity
              style={
                styles.summaryCard
              }
              onPress={() =>
                router.push(
                  '/products-list'
                )
              }
              activeOpacity={0.85}
            >
              <View
                style={
                  styles.summaryAccent
                }
              />

              <View
                style={
                  styles.summaryIcon
                }
              >
                <Ionicons
                  name="cube"
                  size={25}
                  color="#FF4D00"
                />
              </View>

              <View
                style={
                  styles.summaryInfo
                }
              >
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  TOTAL PRODUCTS
                </Text>

                <View
                  style={
                    styles.summaryNumberRow
                  }
                >
                  <Text
                    style={
                      styles.summaryNumber
                    }
                  >
                    {products.length}
                  </Text>

                  <Text
                    style={
                      styles.summaryUnit
                    }
                  >
                    รายการ
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.summaryArrow
                }
              >
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#FF4D00"
                />
              </View>
            </TouchableOpacity>

            {/* =================================
                QUICK ACTION
            ================================= */}

            <View
              style={styles.quickRow}
            >
              <TouchableOpacity
                style={
                  styles.quickCard
                }
                onPress={() =>
                  router.push(
                    '/products-list'
                  )
                }
                activeOpacity={0.8}
              >
                <View
                  style={
                    styles.quickTop
                  }
                >
                  <View
                    style={
                      styles.quickIcon
                    }
                  >
                    <Ionicons
                      name="grid-outline"
                      size={22}
                      color="#FF4D00"
                    />
                  </View>

                  <Ionicons
                    name="arrow-up-outline"
                    size={15}
                    color="#555555"
                  />
                </View>

                <Text
                  style={
                    styles.quickTitle
                  }
                >
                  สินค้าทั้งหมด
                </Text>

                <Text
                  style={
                    styles.quickSubtitle
                  }
                >
                  VIEW INVENTORY
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.quickCard
                }
                onPress={() =>
                  router.push(
                    '/categories'
                  )
                }
                activeOpacity={0.8}
              >
                <View
                  style={
                    styles.quickTop
                  }
                >
                  <View
                    style={[
                      styles.quickIcon,
                      styles.quickIconBlue,
                    ]}
                  >
                    <Ionicons
                      name="layers-outline"
                      size={22}
                      color="#5B61FF"
                    />
                  </View>

                  <Ionicons
                    name="arrow-up-outline"
                    size={15}
                    color="#555555"
                  />
                </View>

                <Text
                  style={
                    styles.quickTitle
                  }
                >
                  หมวดหมู่
                </Text>

                <Text
                  style={
                    styles.quickSubtitle
                  }
                >
                  BIKE MODELS
                </Text>
              </TouchableOpacity>
            </View>

            {/* =================================
                PRODUCT TITLE
            ================================= */}

            <View
              style={
                styles.productsHeader
              }
            >
              <View>
                <View
                  style={
                    styles.sectionTitleRow
                  }
                >
                  <View
                    style={
                      styles.orangeBar
                    }
                  />

                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    FEATURED PARTS
                  </Text>
                </View>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  สินค้าล่าสุดจาก Garage
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push(
                    '/products-list'
                  )
                }
              >
                <View
                  style={
                    styles.seeAllBox
                  }
                >
                  <Text
                    style={styles.seeAll}
                  >
                    VIEW ALL
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color="#FF4D00"
                  />
                </View>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={
              styles.productCard
            }
            onPress={() =>
              router.push({
                pathname:
                  '/products',
                params: {
                  id: String(
                    item.id
                  ),
                },
              })
            }
            activeOpacity={0.88}
          >
            {/* IMAGE */}

            <View
              style={
                styles.productImageWrap
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
                    styles.productNoImage
                  }
                >
                  <Ionicons
                    name="image-outline"
                    size={32}
                    color="#666666"
                  />
                </View>
              )}

              <View
                style={
                  styles.productImageBadge
                }
              >
                <Ionicons
                  name="flash"
                  size={10}
                  color="#FF4D00"
                />
              </View>
            </View>

            {/* INFO */}

            <View
              style={
                styles.productInfo
              }
            >
              <View
                style={
                  styles.productTopRow
                }
              >
                <Text
                  style={
                    styles.productModel
                  }
                  numberOfLines={1}
                >
                  {item.model}
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
                        styles.stockTextOut,
                    ]}
                  >
                    {item.stock > 0
                      ? `${item.stock} LEFT`
                      : 'SOLD OUT'}
                  </Text>
                </View>
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
                  styles.productBottom
                }
              >
                <View>
                  <Text
                    style={
                      styles.priceLabel
                    }
                  >
                    PRICE
                  </Text>

                  <Text
                    style={
                      styles.productPrice
                    }
                  >
                    ฿
                    {Number(
                      item.price
                    ).toLocaleString(
                      'th-TH'
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.detailArrow
                  }
                >
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View
            style={styles.empty}
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="bicycle-outline"
                size={45}
                color="#666666"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              GARAGE EMPTY
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              ยังไม่มีสินค้าในระบบ
            </Text>
          </View>
        }
        ListFooterComponent={
          <View
            style={styles.footerSpace}
          />
        }
      />

      {/* ======================================
          LOGOUT MODAL
      ====================================== */}

      <Modal
        visible={logoutModal}
        transparent
        animationType="fade"
        onRequestClose={
          closeLogoutModal
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
              style={styles.modalTopLine}
            />

            <View
              style={styles.modalIcon}
            >
              <Ionicons
                name="log-out-outline"
                size={34}
                color="#FF4D00"
              />
            </View>

            <Text
              style={styles.modalTag}
            >
              SYSTEM EXIT
            </Text>

            <Text
              style={styles.modalTitle}
            >
              ออกจากระบบ?
            </Text>

            <Text
              style={styles.modalMessage}
            >
              คุณต้องการออกจากระบบ
              ใช่หรือไม่
            </Text>

            <View
              style={styles.modalButtons}
            >
              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={
                  closeLogoutModal
                }
                disabled={loggingOut}
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  ยกเลิก
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.confirmLogoutButton
                }
                onPress={
                  handleLogout
                }
                disabled={loggingOut}
                activeOpacity={0.8}
              >
                {loggingOut ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                )}

                <Text
                  style={
                    styles.confirmLogoutText
                  }
                >
                  {loggingOut
                    ? 'กำลังออก...'
                    : 'ออกจากระบบ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // LOADING
  // ================================================

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0B',
  },

  loadingLogo: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  loadingBrand: {
    color: '#FF4D00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  loadingText: {
    marginTop: 5,
    color: '#777777',
    fontSize: 13,
  },

  // ================================================
  // LIST
  // ================================================

  mainList: {
    paddingBottom: 20,
    backgroundColor: '#0B0B0B',
  },

  // ================================================
  // HEADER
  // ================================================

  header: {
    backgroundColor: '#101010',
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 15,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },

  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: '#1A1A1A',

    borderWidth: 1,
    borderColor: '#333333',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 11,
  },

  avatarText: {
    color: '#FF4D00',
    fontSize: 19,
    fontWeight: '900',
  },

  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4D00',
    marginRight: 6,
  },

  welcomeText: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  username: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  roleText: {
    color: '#FF4D00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  logoutTopButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#191919',

    borderWidth: 1,
    borderColor: '#303030',

    justifyContent: 'center',
    alignItems: 'center',
  },

  // ================================================
  // HERO
  // ================================================

  heroCard: {
    margin: 15,
    marginBottom: 5,
    height: 255,

    borderRadius: 22,
    backgroundColor: '#151515',

    overflow: 'hidden',
    position: 'relative',

    borderWidth: 1,
    borderColor: '#292929',
  },

  heroContent: {
    padding: 22,
    zIndex: 3,
  },

  heroStripe: {
    position: 'absolute',
    right: -70,
    top: 0,
    width: 160,
    height: 310,
    backgroundColor: '#FF4D00',
    opacity: 0.06,
    transform: [
      {
        rotate: '18deg',
      },
    ],
  },

  heroGlow: {
    position: 'absolute',
    right: -60,
    bottom: -70,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor:
      'rgba(255,77,0,0.14)',
  },

  heroTag: {
    alignSelf: 'flex-start',

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 6,

    backgroundColor:
      'rgba(255,77,0,0.12)',

    borderWidth: 1,
    borderColor:
      'rgba(255,77,0,0.25)',
  },

  heroTagText: {
    color: '#FF5A1F',
    fontSize: 8,
    fontWeight: '900',
    marginLeft: 5,
    letterSpacing: 1,
  },

  heroSmall: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 16,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 3,
    lineHeight: 31,
  },

  heroTitleAccent: {
    color: '#FF4D00',
    fontSize: 29,
    fontWeight: '900',
    lineHeight: 31,
  },

  heroSubtitle: {
    color: '#858585',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
    width: '58%',
  },

  heroButton: {
    height: 39,
    paddingLeft: 13,
    paddingRight: 5,

    alignSelf: 'flex-start',

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FF4D00',
    borderRadius: 9,

    marginTop: 15,
  },

  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginRight: 9,
  },

  heroButtonIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroBikeIcon: {
    position: 'absolute',
    right: -12,
    bottom: 0,
    transform: [
      {
        rotate: '-8deg',
      },
    ],
  },

  heroNumber: {
    position: 'absolute',
    right: 17,
    top: 14,
  },

  heroNumberText: {
    color: '#2A2A2A',
    fontSize: 26,
    fontWeight: '900',
    fontStyle: 'italic',
  },

  // ================================================
  // SECTION
  // ================================================

  sectionHeader: {
    paddingHorizontal: 18,
    marginTop: 20,
    marginBottom: 10,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  orangeBar: {
    width: 4,
    height: 17,
    borderRadius: 2,
    backgroundColor: '#FF4D00',
    marginRight: 8,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  sectionSubtitle: {
    marginTop: 4,
    color: '#666666',
    fontSize: 10,
  },

  countBadge: {
    minWidth: 49,
    height: 42,
    paddingHorizontal: 8,

    borderRadius: 11,

    backgroundColor: '#161616',

    borderWidth: 1,
    borderColor: '#292929',

    justifyContent: 'center',
    alignItems: 'center',
  },

  countBadgeNumber: {
    color: '#FF4D00',
    fontWeight: '900',
    fontSize: 16,
  },

  countBadgeLabel: {
    color: '#666666',
    fontWeight: '800',
    fontSize: 7,
    letterSpacing: 1,
  },

  // ================================================
  // SUMMARY
  // ================================================

  summaryCard: {
    marginHorizontal: 15,

    backgroundColor: '#151515',
    borderRadius: 17,

    padding: 14,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#292929',

    overflow: 'hidden',
  },

  summaryAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FF4D00',
  },

  summaryIcon: {
    width: 51,
    height: 51,
    borderRadius: 14,

    backgroundColor:
      'rgba(255,77,0,0.10)',

    justifyContent: 'center',
    alignItems: 'center',

    marginLeft: 2,
  },

  summaryInfo: {
    flex: 1,
    marginLeft: 13,
  },

  summaryLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  summaryNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 1,
  },

  summaryNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  summaryUnit: {
    color: '#777777',
    fontSize: 10,
    marginLeft: 5,
  },

  summaryArrow: {
    width: 35,
    height: 35,
    borderRadius: 10,

    backgroundColor: '#202020',

    justifyContent: 'center',
    alignItems: 'center',
  },

  // ================================================
  // QUICK ACTION
  // ================================================

  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 11,
    marginTop: 9,
  },

  quickCard: {
    flex: 1,

    backgroundColor: '#151515',
    borderRadius: 17,

    padding: 14,

    borderWidth: 1,
    borderColor: '#292929',

    marginHorizontal: 4,
  },

  quickTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  quickIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,

    backgroundColor:
      'rgba(255,77,0,0.10)',

    justifyContent: 'center',
    alignItems: 'center',
  },

  quickIconBlue: {
    backgroundColor:
      'rgba(91,97,255,0.10)',
  },

  quickTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 12,
  },

  quickSubtitle: {
    fontSize: 8,
    color: '#666666',
    marginTop: 4,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  // ================================================
  // PRODUCTS HEADER
  // ================================================

  productsHeader: {
    paddingHorizontal: 18,
    marginTop: 24,
    marginBottom: 11,

    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  seeAllBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  seeAll: {
    color: '#FF4D00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ================================================
  // PRODUCT CARD
  // ================================================

  productCard: {
    marginHorizontal: 15,
    marginBottom: 11,

    padding: 10,

    backgroundColor: '#151515',
    borderRadius: 17,

    flexDirection: 'row',

    borderWidth: 1,
    borderColor: '#292929',

    overflow: 'hidden',
  },

  productImageWrap: {
    width: 92,
    height: 92,
    position: 'relative',
  },

  productImage: {
    width: 92,
    height: 92,

    borderRadius: 13,

    backgroundColor: '#202020',
    resizeMode: 'contain',
  },

  productNoImage: {
    width: 92,
    height: 92,

    borderRadius: 13,

    backgroundColor: '#202020',

    justifyContent: 'center',
    alignItems: 'center',
  },

  productImageBadge: {
    position: 'absolute',
    left: 7,
    top: 7,

    width: 24,
    height: 24,

    borderRadius: 7,

    backgroundColor:
      'rgba(10,10,10,0.85)',

    justifyContent: 'center',
    alignItems: 'center',
  },

  productInfo: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 3,
  },

  productTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  productModel: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '800',
    flex: 1,
    marginRight: 5,
  },

  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      'rgba(37,174,86,0.10)',

    paddingHorizontal: 7,
    paddingVertical: 4,

    borderRadius: 7,
  },

  stockBadgeOut: {
    backgroundColor:
      'rgba(255,77,0,0.10)',
  },

  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#28A745',
    marginRight: 4,
  },

  stockDotOut: {
    backgroundColor: '#FF4D00',
  },

  stockText: {
    color: '#35B85A',
    fontSize: 8,
    fontWeight: '900',
  },

  stockTextOut: {
    color: '#FF4D00',
  },

  productName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
    marginTop: 6,
  },

  productBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',

    marginTop: 7,
  },

  priceLabel: {
    color: '#555555',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },

  productPrice: {
    color: '#FF4D00',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 1,
  },

  detailArrow: {
    width: 29,
    height: 29,
    borderRadius: 9,

    backgroundColor: '#FF4D00',

    justifyContent: 'center',
    alignItems: 'center',
  },

  // ================================================
  // EMPTY
  // ================================================

  empty: {
    alignItems: 'center',
    paddingTop: 55,
    paddingBottom: 40,
  },

  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 24,

    backgroundColor: '#151515',

    borderWidth: 1,
    borderColor: '#292929',

    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },

  emptyText: {
    marginTop: 4,
    color: '#666666',
    fontSize: 11,
  },

  footerSpace: {
    height: 20,
  },

  // ================================================
  // MODAL
  // ================================================

  modalOverlay: {
    flex: 1,

    backgroundColor:
      'rgba(0,0,0,0.78)',

    justifyContent: 'center',
    alignItems: 'center',

    padding: 20,
  },

  modalBox: {
    width: '100%',
    maxWidth: 400,

    backgroundColor: '#151515',

    borderRadius: 22,

    padding: 25,

    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#303030',

    overflow: 'hidden',
  },

  modalTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FF4D00',
  },

  modalIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,

    backgroundColor:
      'rgba(255,77,0,0.10)',

    borderWidth: 1,
    borderColor:
      'rgba(255,77,0,0.25)',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 12,
  },

  modalTag: {
    color: '#FF4D00',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },

  modalTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 5,
  },

  modalMessage: {
    color: '#777777',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 23,
  },

  modalButtons: {
    width: '100%',
    flexDirection: 'row',
  },

  cancelButton: {
    flex: 1,
    height: 49,

    borderWidth: 1,
    borderColor: '#333333',

    borderRadius: 12,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 5,

    backgroundColor: '#1B1B1B',
  },

  cancelText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '800',
  },

  confirmLogoutButton: {
    flex: 1,
    height: 49,

    backgroundColor: '#FF4D00',

    borderRadius: 12,

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    marginLeft: 5,
  },

  confirmLogoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 6,
  },
});