import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { noticeService } from "../src/services/Notice/noticeService";
import { TenantProfile, tenantService } from "../src/services/tenantApi";
import { styles } from "../src/styles/Tenant/TenantDashboard.styles";

interface NoticeItem {
  id: string;
  flatId?: string | null;
  pgName?: string;
  title: string;
  desc: string;
  date: string;
  urgent: boolean;
}

const CACHE_KEY = "cached_tenant_profile";

export default function TenantDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const getFlatIdFromTenant = (tenantObj: any) => {
    if (!tenantObj) return null;
    const target = tenantObj.data || tenantObj;

    return (
      target.flatId ||
      target.FlatId ||
      target.flat_id ||
      target.flat?._id ||
      target.flat?.id ||
      target.flatIdGuid ||
      null
    );
  };

  const loadInitialData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsedTenant = JSON.parse(cachedData);
        setTenant(parsedTenant);
        setLoading(false);

        const targetFlatId = getFlatIdFromTenant(parsedTenant);
        if (targetFlatId) {
          fetchTenantNotices(String(targetFlatId));
          return;
        }
      }
    } catch (e) {
      console.log("Error reading cached profile", e);
    } finally {
      await loadProfile(false);
    }
  };

  const loadProfile = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);

      const response = await tenantService.fetchTenantProfileData();
      const rawData =
        response &&
        typeof response === "object" &&
        "data" in response &&
        (response as any).data
          ? (response as any).data
          : response;

      if (rawData) {
        const formattedTenant: TenantProfile = {
          ...rawData,
          id: rawData.id || rawData.Id || tenantService.getTenantId(), // 👈 Ensure ID is captured
          pgName: rawData.pgName || rawData.apartmentName || "Apartment",
          rentAmount: rawData.rentAmount || rawData.rent || 0,
          roomNumber: rawData.flatNumber
            ? `Flat ${rawData.flatNumber} - ${rawData.roomName || ""} (${rawData.bedName || ""})`
            : rawData.roomNumber || "N/A",
          isRentPaid:
            rawData.isRentPaid ??
            (rawData.pendingAmount === 0 || rawData.advancePaid > 0),
          flatId: getFlatIdFromTenant(response),
        };

        setTenant(formattedTenant);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(formattedTenant));

        const targetFlatId = formattedTenant.flatId;
        if (targetFlatId) {
          await fetchTenantNotices(String(targetFlatId));
        } else {
          setNotices([]);
        }
      }
    } catch (error) {
      console.log("Failed to load tenant profile from API", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTenantNotices = async (flatId: string | null) => {
    if (!flatId) {
      setNotices([]);
      return;
    }

    try {
      const response = await noticeService.getNoticesByFlatId(flatId);
      const rawList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

      const formattedNotices: NoticeItem[] = rawList.map((item: any) => ({
        id: item.id || item.Id || Math.random().toString(),
        flatId: item.flatId || item.FlatId || null,
        pgName: item.pgName || item.PgName || "Notice",
        title: item.title || item.Title || "Untitled",
        desc: item.desc || item.description || item.Description || "",
        date: item.date || item.Date || "Today",
        urgent:
          item.urgent !== undefined
            ? item.urgent
            : item.IsUrgent !== undefined
              ? item.IsUrgent
              : false,
      }));

      setNotices(formattedNotices);
    } catch (error: any) {
      setNotices([]);
    }
  };

  const onRefresh = () => {
    loadProfile(true);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(CACHE_KEY);
          await tenantService.clearSessionData();
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading && !tenant) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome back 👋</Text>
          <Text style={styles.tenantName} numberOfLines={1}>
            {tenant?.name || "Tenant"}
          </Text>
          {tenant?.pgName ? (
            <View style={styles.pgBadge}>
              <Ionicons name="business-outline" size={12} color="#38BDF8" />
              <Text style={styles.pgNameText} numberOfLines={1}>
                {tenant.pgName}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Header Action Elements */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            style={[
              styles.logoutBtn,
              {
                backgroundColor: "rgba(56, 189, 248, 0.08)",
                borderColor: "rgba(56, 189, 248, 0.2)",
                borderWidth: 1,
              },
            ]}
            onPress={() => setIsNotificationsOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color="#38BDF8" />
            {notices.length > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#EF4444",
                }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={[
              styles.logoutBtn,
              {
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                borderColor: "rgba(239, 68, 68, 0.2)",
                borderWidth: 1,
              },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
          />
        }
      >
        {/* Room & Rent Summary Card */}
        <View
          style={[
            styles.summaryCard,
            tenant?.isRentPaid && styles.summaryCardPaid,
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.cardLabel}>ROOM / BED</Text>
              <Text style={styles.cardValue} numberOfLines={1}>
                {tenant?.roomNumber || "N/A"}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: tenant?.isRentPaid
                    ? "rgba(52, 211, 153, 0.15)"
                    : "rgba(245, 158, 11, 0.15)",
                },
              ]}
            >
              <Ionicons
                name={tenant?.isRentPaid ? "checkmark-circle" : "alert-circle"}
                size={14}
                color={tenant?.isRentPaid ? "#34D399" : "#F59E0B"}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: tenant?.isRentPaid ? "#34D399" : "#F59E0B" },
                ]}
              >
                {tenant?.isRentPaid ? "Rent Paid" : "Payment Due"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Financial Breakdown */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <View>
                <Text style={styles.cardLabel}>TOTAL RENT AMOUNT</Text>
                <Text
                  style={[styles.rentAmount, { fontSize: 26, marginTop: 2 }]}
                >
                  ₹{tenant?.rentAmount?.toLocaleString() ?? 0}
                </Text>
              </View>
              <View style={styles.alignRight}>
                <Text style={styles.cardLabel}>BILLING CYCLE</Text>
                <Text style={[styles.dueDate, { marginTop: 4 }]}>
                  {tenant?.dueDate ? `${tenant.dueDate}` : "N/A"}
                </Text>
              </View>
            </View>

            {!tenant?.isRentPaid && (
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 14,
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.06)",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardLabel, { fontSize: 10 }]}>
                    PAID SO FAR
                  </Text>
                  <Text
                    style={{
                      color: "#34D399",
                      fontWeight: "700",
                      fontSize: 14,
                      marginTop: 2,
                    }}
                  >
                    ₹{tenant?.paidAmount?.toLocaleString() ?? 0}
                  </Text>
                </View>
                <View
                  style={{
                    width: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    marginHorizontal: 10,
                  }}
                />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[styles.cardLabel, { fontSize: 10 }]}>
                    BALANCE DUE
                  </Text>
                  <Text
                    style={{
                      color: "#F59E0B",
                      fontWeight: "700",
                      fontSize: 14,
                      marginTop: 2,
                    }}
                  >
                    ₹{tenant?.pendingAmount?.toLocaleString() ?? 0}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {!tenant?.isRentPaid ? (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => router.push("/(tenant)/rent-payments" as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="card-outline" size={18} color="#FFF" />
              <Text style={styles.payButtonText}>Pay Remaining Rent</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.paidSuccessBox}>
              <Ionicons name="shield-checkmark" size={16} color="#34D399" />
              <Text style={styles.paidSuccessText}>
                This month's rent has been successfully paid!
              </Text>
            </View>
          )}
        </View>

        {/* Services & Support Grid */}
        <Text style={styles.sectionTitle}>Services & Support</Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => router.push("/Tenantcomplaints" as any)} // 👈 Updated Route
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: "rgba(245, 158, 11, 0.12)" },
              ]}
            >
              <Ionicons name="construct-outline" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.gridTitle}>Raise Issue</Text>
            <Text style={styles.gridSub}>Fan, WiFi, Plumbing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() =>
              Alert.alert(
                "Mess",
                "Today's food menu is updated in the dining area.",
              )
            }
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: "rgba(99, 102, 241, 0.12)" },
              ]}
            >
              <Ionicons name="restaurant-outline" size={24} color="#6366F1" />
            </View>
            <Text style={styles.gridTitle}>Food Menu</Text>
            <Text style={styles.gridSub}>Check Mess Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => router.push("/(tenant)/TenantRentScreen" as any)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: "rgba(52, 211, 153, 0.12)" },
              ]}
            >
              <Ionicons name="receipt-outline" size={24} color="#34D399" />
            </View>
            <Text style={styles.gridTitle}>Payment History</Text>
            <Text style={styles.gridSub}>View Receipts & Bills</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() =>
              Alert.alert(
                "PG Rules",
                "1. Gate closes at 10:30 PM.\n2. Visitors allowed till 8 PM.",
              )
            }
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: "rgba(168, 85, 247, 0.12)" },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color="#A855F7"
              />
            </View>
            <Text style={styles.gridTitle}>PG Rules</Text>
            <Text style={styles.gridSub}>Timing & Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Notice Board Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
            marginBottom: 12,
          }}
        >
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
            Notice Board 📢
          </Text>
          {notices.length > 0 && (
            <View
              style={{
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                borderColor: "rgba(56, 189, 248, 0.2)",
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 20,
              }}
            >
              <Text
                style={{ color: "#38BDF8", fontSize: 11, fontWeight: "600" }}
              >
                {notices.length} Active
              </Text>
            </View>
          )}
        </View>

        {/* 🌟 IMPROVED NOTICE CARDS (Dashboard UI) */}
        {notices.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 32,
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderRadius: 16,
              borderStyle: "dashed",
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.1)",
              marginBottom: 10,
            }}
          >
            <Ionicons
              name="notifications-off-outline"
              size={30}
              color="#64748B"
              style={{ marginBottom: 8 }}
            />
            <Text style={{ color: "#9CA3AF", fontSize: 13, fontWeight: "500" }}>
              No active notices right now.
            </Text>
          </View>
        ) : (
          notices.map((item) => (
            <View
              key={item.id}
              style={{
                borderRadius: 16,
                padding: 16,
                backgroundColor: item.urgent
                  ? "rgba(239, 68, 68, 0.07)"
                  : "rgba(30, 41, 59, 0.6)",
                borderWidth: 1,
                borderColor: item.urgent
                  ? "rgba(239, 68, 68, 0.45)"
                  : "rgba(255, 255, 255, 0.08)",
                marginBottom: 14,
                shadowColor: item.urgent ? "#EF4444" : "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              {/* Card Top Row */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: item.urgent
                      ? "rgba(239, 68, 68, 0.15)"
                      : "rgba(56, 189, 248, 0.12)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                    borderWidth: 1,
                    borderColor: item.urgent
                      ? "rgba(239, 68, 68, 0.3)"
                      : "rgba(56, 189, 248, 0.2)",
                  }}
                >
                  <Ionicons
                    name={item.urgent ? "alert-circle" : "megaphone-outline"}
                    size={20}
                    color={item.urgent ? "#EF4444" : "#38BDF8"}
                  />
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: "#F8FAFC",
                      letterSpacing: 0.2,
                    }}
                  >
                    {item.title}
                  </Text>
                </View>

                {item.urgent && (
                  <View
                    style={{
                      backgroundColor: "#EF4444",
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFF",
                        fontSize: 9,
                        fontWeight: "800",
                        letterSpacing: 0.5,
                      }}
                    >
                      URGENT
                    </Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <Text
                style={{
                  color: "#CBD5E1",
                  fontSize: 13.5,
                  lineHeight: 20,
                  marginBottom: 12,
                }}
              >
                {item.desc}
              </Text>

              {/* Footer Date / Time */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255, 255, 255, 0.06)",
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={13}
                  color="#94A3B8"
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={{
                    fontSize: 11.5,
                    color: "#94A3B8",
                    fontWeight: "500",
                  }}
                >
                  {item.date}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 🌟 MODERN BOTTOM SHEET MODAL (Notifications) */}
      <Modal
        visible={isNotificationsOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNotificationsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsNotificationsOpen(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: "#0F172A",
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingHorizontal: 20,
                  paddingTop: 14,
                  paddingBottom: 35,
                  maxHeight: "85%",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -10 },
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                  elevation: 15,
                }}
              >
                {/* Drag Handle Bar */}
                <View style={{ alignItems: "center", marginBottom: 14 }}>
                  <View
                    style={{
                      width: 44,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: "rgba(255, 255, 255, 0.25)",
                    }}
                  />
                </View>

                {/* Bottom Sheet Header */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(56, 189, 248, 0.3)",
                      }}
                    >
                      <Ionicons
                        name="notifications"
                        size={18}
                        color="#38BDF8"
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#F8FAFC",
                      }}
                    >
                      Notifications Center
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsNotificationsOpen(false)}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: 20,
                      padding: 6,
                    }}
                  >
                    <Ionicons name="close" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Bottom Sheet Scroll List */}
                <ScrollView showsVerticalScrollIndicator={false}>
                  {notices.length === 0 ? (
                    <View style={{ alignItems: "center", paddingVertical: 50 }}>
                      <Ionicons
                        name="notifications-off-outline"
                        size={38}
                        color="#64748B"
                        style={{ marginBottom: 12 }}
                      />
                      <Text
                        style={{
                          color: "#9CA3AF",
                          fontSize: 14,
                          fontWeight: "500",
                        }}
                      >
                        No new notifications right now.
                      </Text>
                    </View>
                  ) : (
                    notices.map((item) => (
                      <View
                        key={item.id}
                        style={{
                          backgroundColor: item.urgent
                            ? "rgba(239, 68, 68, 0.08)"
                            : "rgba(30, 41, 59, 0.7)",
                          borderRadius: 16,
                          padding: 16,
                          marginBottom: 12,
                          borderWidth: 1,
                          borderColor: item.urgent
                            ? "rgba(239, 68, 68, 0.45)"
                            : "rgba(255, 255, 255, 0.08)",
                          shadowColor: item.urgent ? "#EF4444" : "#000",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.15,
                          shadowRadius: 6,
                          elevation: 3,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "700",
                              color: "#F8FAFC",
                              flex: 1,
                              marginRight: 8,
                            }}
                          >
                            {item.title}
                          </Text>
                          {item.urgent && (
                            <View
                              style={{
                                backgroundColor: "#EF4444",
                                paddingHorizontal: 7,
                                paddingVertical: 2.5,
                                borderRadius: 5,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#FFF",
                                  fontSize: 8.5,
                                  fontWeight: "800",
                                }}
                              >
                                URGENT
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={{
                            color: "#CBD5E1",
                            fontSize: 13,
                            lineHeight: 19,
                          }}
                        >
                          {item.desc}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 10,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderTopColor: "rgba(255, 255, 255, 0.05)",
                          }}
                        >
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color="#94A3B8"
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={{
                              color: "#94A3B8",
                              fontSize: 11,
                              fontWeight: "500",
                            }}
                          >
                            {item.date}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
