import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { styles } from "../src/styles/Admin/AdminNoticesStyles";

// Minimal local stub for noticeService to avoid "Cannot find name 'noticeService'".
// Replace with actual service import when available, e.g.:
// import noticeService from '../src/services/noticeService';
const noticeService: any = {
  getAdminFlats: async (_userId: string) => {
    return [];
  },
  getNotices: async (_flatId: string | null) => {
    return [];
  },
  createNotice: async (_payload: any) => {
    return { status: 200, data: { success: true } };
  },
};

interface NoticeItem {
  id: string;
  flatId?: string | null;
  pgName: string;
  title: string;
  desc: string;
  date: string;
  urgent: boolean;
}

export default function AdminNoticesScreen() {
  const router = useRouter();

  const [pgBranches, setPgBranches] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: "All PGs (Common)" }]);

  const [selectedPG, setSelectedPG] = useState<{
    id: string | null;
    name: string;
  }>({
    id: null,
    name: "All PGs (Common)",
  });

  const [loadingFlats, setLoadingFlats] = useState<boolean>(true);
  const [loadingNotices, setLoadingNotices] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("today");

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);

  const [notices, setNotices] = useState<NoticeItem[]>([]);

  useEffect(() => {
    loadFlatsAndNotices();
  }, []);

  useEffect(() => {
    loadNotices(selectedPG.id);
  }, [selectedPG]);

  const loadFlatsAndNotices = async () => {
    try {
      setLoadingFlats(true);
      const storedUserId = await AsyncStorage.getItem("userId");
      if (!storedUserId) {
        setLoadingFlats(false);
        return;
      }

      const flatList = await noticeService.getAdminFlats(storedUserId);

      const dynamicFlats = flatList.map((flat: any) => ({
        id: flat.Id,
        name: `${flat.ApartmentName} (${flat.FlatNumber})`,
      }));

      setPgBranches([{ id: null, name: "All PGs (Common)" }, ...dynamicFlats]);
    } catch (error) {
      console.log("Failed to load flats", error);
    } finally {
      setLoadingFlats(false);
    }
  };

  const loadNotices = async (flatId: string | null) => {
    try {
      setLoadingNotices(true);
      console.log("=== CALLING API WITH FLATID ===", flatId); // <--- Yeh print karke dekhein

      const response = await noticeService.getNotices(flatId);
      console.log("=== RAW API RESPONSE ===", response);
      console.log("=== RAW API RESPONSE ===", response);

      // Agar response object ke andar 'data' array hai toh use extract karein
      const rawList = Array.isArray(response) ? response : response?.data || [];

      const formattedNotices = rawList.map((item: any) => ({
        id: item.id || item.Id || Math.random().toString(),
        flatId: item.flatId || item.FlatId || null,
        pgName: item.pgName || item.PgName || selectedPG.name,
        title: item.title || item.Title || "Untitled",
        desc: item.desc || item.description || item.Description || "",
        date: item.date || item.Date || "Today", // Ensure karein ki date "Today" match kare
        urgent:
          item.urgent !== undefined
            ? item.urgent
            : item.IsUrgent !== undefined
              ? item.IsUrgent
              : false,
      }));

      console.log("=== FORMATTED NOTICES ===", formattedNotices);
      setNotices(formattedNotices);
    } catch (error) {
      console.log("Failed to fetch admin notices", error);
    } finally {
      setLoadingNotices(false);
    }
  };
  const handlePostNotice = async () => {
    Keyboard.dismiss();
    if (!title || !desc) return;

    try {
      const storedUserId =
        (await AsyncStorage.getItem("userId")) || "admin_user_01";

      const payload = {
        title,
        description: desc,
        flatId: selectedPG.id,
        isUrgent: isUrgent,
        sendNotification: sendNotification,
        createdByAdminId: storedUserId,
      };

      const response = await noticeService.createNotice(payload);

      if (response.status === 200 || response.data?.success) {
        loadNotices(selectedPG.id);

        setTitle("");
        setDesc("");
        setIsUrgent(false);
        setSendNotification(true);
        setModalVisible(false);
        setActiveTab("today");
      }
    } catch (error) {
      console.log("Failed to post notice", error);
    }
  };

  const todayNotices = notices.filter((item) => item.date === "Today");
  const previousNotices = notices.filter((item) => item.date !== "Today");

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notice Board Manager</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addButtonHeader}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* PG / Common Branch Selector Bar */}
      <View style={styles.pgBarContainer}>
        {loadingFlats ? (
          <ActivityIndicator
            size="small"
            color="#06B6D4"
            style={{ marginVertical: 6 }}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollRow}
          >
            {pgBranches.map((pg) => (
              <TouchableOpacity
                key={pg.id || "common"}
                style={[
                  styles.pgChip,
                  selectedPG.name === pg.name && styles.pgChipActive,
                  pg.id === null && styles.commonChip,
                ]}
                onPress={() => setSelectedPG(pg)}
              >
                <Ionicons
                  name={pg.id === null ? "globe-outline" : "business-outline"}
                  size={14}
                  color={selectedPG.name === pg.name ? "#FFF" : "#4B5563"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.pgChipText,
                    selectedPG.name === pg.name && styles.pgChipTextActive,
                  ]}
                >
                  {pg.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Notice Section Switcher Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "today" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("today")}
        >
          <Ionicons
            name="today-outline"
            size={16}
            color={activeTab === "today" ? "#06B6D4" : "#6B7280"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "today" && styles.activeTabText,
            ]}
          >
            Today's Notices ({todayNotices.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "previous" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("previous")}
        >
          <Ionicons
            name="archive-outline"
            size={16}
            color={activeTab === "previous" ? "#06B6D4" : "#6B7280"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "previous" && styles.activeTabText,
            ]}
          >
            Previous History ({previousNotices.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[styles.banner, selectedPG.id === null && styles.commonBanner]}
        >
          <Ionicons
            name="megaphone-outline"
            size={28}
            color="#38BDF8"
            style={{ marginBottom: 4 }}
          />
          <Text style={styles.bannerLabel}>{selectedPG.name}</Text>
          <Text style={styles.bannerSubLabel}>
            {activeTab === "today"
              ? "Today's Active Broadcasts"
              : "Archived Notice History"}
          </Text>
        </View>

        {loadingNotices ? (
          <ActivityIndicator
            size="large"
            color="#06B6D4"
            style={{ marginTop: 30 }}
          />
        ) : activeTab === "today" ? (
          <>
            {todayNotices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="notifications-off-outline"
                  size={40}
                  color="#D1D5DB"
                />
                <Text style={styles.emptyText}>
                  No new notices posted for today in {selectedPG.name}
                </Text>
              </View>
            ) : (
              todayNotices.map((item) => (
                <View
                  key={item.id}
                  style={[styles.card, item.urgent && styles.urgentCard]}
                >
                  <View style={styles.cardHeaderTop}>
                    <View style={styles.titleRow}>
                      <View
                        style={[
                          styles.iconContainer,
                          item.urgent && styles.urgentIconContainer,
                        ]}
                      >
                        <Ionicons
                          name={
                            item.urgent
                              ? "alert-circle-outline"
                              : "megaphone-outline"
                          }
                          size={20}
                          color={item.urgent ? "#EF4444" : "#06B6D4"}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.noticeTitle}>{item.title}</Text>
                        <Text style={styles.noticeCategory}>
                          {item.pgName} • {item.date}
                        </Text>
                      </View>
                    </View>
                    {item.urgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>URGENT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.noticeDesc}>{item.desc}</Text>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {previousNotices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="archive-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  No previous history available for {selectedPG.name}
                </Text>
              </View>
            ) : (
              previousNotices.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    styles.archiveCard,
                    item.urgent && styles.urgentCard,
                  ]}
                >
                  <View style={styles.cardHeaderTop}>
                    <View style={styles.titleRow}>
                      <View
                        style={[
                          styles.iconContainer,
                          styles.archiveIconContainer,
                          item.urgent && styles.urgentIconContainer,
                        ]}
                      >
                        <Ionicons
                          name={
                            item.urgent
                              ? "alert-circle-outline"
                              : "archive-outline"
                          }
                          size={20}
                          color={item.urgent ? "#EF4444" : "#6B7280"}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.noticeTitle}>{item.title}</Text>
                        <Text style={styles.noticeCategory}>
                          {item.pgName} • {item.date}
                        </Text>
                      </View>
                    </View>
                    {item.urgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>URGENT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.noticeDesc}>{item.desc}</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Broadcast Notice Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeaderTop}>
                  <Text style={styles.modalTitle}>Broadcast Notice</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.targetPgText}>
                  Target Group:{" "}
                  <Text style={{ fontWeight: "bold", color: "#06B6D4" }}>
                    {selectedPG.name}
                  </Text>
                </Text>

                <Text style={styles.inputLabel}>Notice Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Water Supply Maintenance"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />

                <Text style={styles.inputLabel}>Notice Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write detailed message for tenants..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={desc}
                  onChangeText={setDesc}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                />

                <View style={styles.switchRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.switchLabel}>Mark as Urgent</Text>
                    <Text style={styles.switchSub}>
                      Highlights in red for tenants
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#D1D5DB", true: "#FCA5A5" }}
                    thumbColor={isUrgent ? "#EF4444" : "#F4F3F4"}
                    value={isUrgent}
                    onValueChange={setIsUrgent}
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.switchLabel}>
                      Send SMS / WhatsApp Alert
                    </Text>
                    <Text style={styles.switchSub}>
                      Instantly message all active tenants
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#D1D5DB", true: "#99F6E4" }}
                    thumbColor={sendNotification ? "#06B6D4" : "#F4F3F4"}
                    value={sendNotification}
                    onValueChange={setSendNotification}
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handlePostNotice}
                >
                  <Text style={styles.saveBtnText}>Publish & Broadcast</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
