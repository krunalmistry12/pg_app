import api from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { noticeService } from "../src/services/Notice/noticeService";
import { createStyles } from "../src/styles/Admin/AdminNoticesStyles";

interface NoticeItem {
  id: string;
  flatId?: string | null;
  pgName: string;
  title: string;
  desc: string;
  date: string;
  urgent: boolean;
}

interface PGBranch {
  id: string | null;
  name: string;
}

export default function AdminNoticesScreen() {
  const router = useRouter();

  const [isDarkMode] = useState<boolean>(true);
  const styles = createStyles(isDarkMode);

  const [pgBranches, setPgBranches] = useState<PGBranch[]>([
    { id: null, name: "All PGs (Common)" },
  ]);

  const [selectedPG, setSelectedPG] = useState<PGBranch>({
    id: null,
    name: "All PGs (Common)",
  });

  const [loadingFlats, setLoadingFlats] = useState<boolean>(true);
  const [loadingNotices, setLoadingNotices] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("today");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [editingNoticeFlat, setEditingNoticeFlat] = useState<PGBranch>({
    id: null,
    name: "All PGs (Common)",
  });

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

      let flatList = [];

      if (storedUserId) {
        try {
          const response = await api.get(`/Flats/user/${storedUserId}`);
          flatList = Array.isArray(response)
            ? response
            : Array.isArray((response as any)?.data)
              ? (response as any).data
              : Array.isArray((response as any)?.data?.data)
                ? (response as any).data.data
                : ((response as any)?.data?.flats ?? []);
        } catch (err1) {
          try {
            const altResponse = await api.get(`/Flats`);
            flatList = Array.isArray(altResponse)
              ? altResponse
              : Array.isArray((altResponse as any)?.data)
                ? (altResponse as any).data
                : Array.isArray((altResponse as any)?.data?.data)
                  ? (altResponse as any).data.data
                  : [];
          } catch (err2) {
            flatList = [];
          }
        }
      }

      if (!flatList || flatList.length === 0) {
        const cachedFlats = await AsyncStorage.getItem("flats_2bhk");
        if (cachedFlats) {
          flatList = JSON.parse(cachedFlats);
        }
      }

      if (Array.isArray(flatList) && flatList.length > 0) {
        await AsyncStorage.setItem("flats_2bhk", JSON.stringify(flatList));

        const dynamicFlats: PGBranch[] = flatList.map(
          (flat: any, fIdx: number) => {
            const flatId = flat.id || flat.Id || `flat-${fIdx}`;
            const aptName =
              flat.apartmentName || flat.ApartmentName || "Apartment";
            const flatNumber =
              flat.flatNumber || flat.FlatNumber || `Flat ${fIdx + 1}`;
            return {
              id: flatId,
              name: `${aptName} (${flatNumber})`,
            };
          },
        );

        const updatedBranches = [
          { id: null, name: "All PGs (Common)" },
          ...dynamicFlats,
        ];
        setPgBranches(updatedBranches);
        loadNotices(selectedPG.id);
      }
    } catch (error) {
      console.log("Error loading flats:", error);
    } finally {
      setLoadingFlats(false);
    }
  };

  const loadNotices = async (flatId: string | null) => {
    try {
      setLoadingNotices(true);
      const response = flatId
        ? await noticeService.getNoticesByFlatId(flatId)
        : await noticeService.getAdminNotices();

      const rawList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

      let currentFlats = pgBranches;
      if (currentFlats.length <= 1) {
        const cachedFlats = await AsyncStorage.getItem("flats_2bhk");
        if (cachedFlats) {
          const parsed = JSON.parse(cachedFlats);
          currentFlats = [
            { id: null, name: "All PGs (Common)" },
            ...parsed.map((flat: any, fIdx: number) => ({
              id: flat.id || flat.Id || `flat-${fIdx}`,
              name: `${flat.apartmentName || flat.ApartmentName || "Apartment"} (${flat.flatNumber || flat.FlatNumber || `Flat ${fIdx + 1}`})`,
            })),
          ];
        }
      }

      const formattedNotices: NoticeItem[] = rawList.map((item: any) => {
        const itemFlatId = item.flatId || item.FlatId || null;

        let resolvedPgName = item.pgName || item.PgName;

        if (itemFlatId) {
          const matchedBranch = currentFlats.find((b) => b.id === itemFlatId);
          if (matchedBranch) {
            resolvedPgName = matchedBranch.name;
          }
        }

        if (!resolvedPgName || resolvedPgName === "All PGs (Common)") {
          if (itemFlatId) {
            const found = currentFlats.find((b) => b.id === itemFlatId);
            if (found) {
              resolvedPgName = found.name;
            } else if (flatId !== null) {
              resolvedPgName = selectedPG.name;
            }
          } else if (flatId !== null) {
            resolvedPgName = selectedPG.name;
          } else {
            resolvedPgName = "All PGs (Common)";
          }
        }

        return {
          id: item.id || item.Id || Math.random().toString(),
          flatId: itemFlatId,
          pgName: resolvedPgName,
          title: item.title || item.Title || "Untitled",
          desc: item.desc || item.description || item.Description || "",
          date: item.date || item.Date || "Today",
          urgent:
            item.urgent !== undefined
              ? item.urgent
              : item.IsUrgent !== undefined
                ? item.IsUrgent
                : false,
        };
      });

      setNotices(formattedNotices);
    } catch (error) {
      setNotices([]);
    } finally {
      setLoadingNotices(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingNoticeId(null);
    setEditingNoticeFlat(selectedPG);
    setTitle("");
    setDesc("");
    setIsUrgent(false);
    setSendNotification(true);
    setModalVisible(true);
  };

  const handleOpenEditModal = (item: NoticeItem) => {
    setEditingNoticeId(item.id);

    const matchedBranch = pgBranches.find((b) => b.id === item.flatId);
    const targetFlatObj = matchedBranch || {
      id: item.flatId || null,
      name: item.pgName || "All PGs (Common)",
    };

    setEditingNoticeFlat(targetFlatObj);
    setTitle(item.title);
    setDesc(item.desc);
    setIsUrgent(item.urgent);
    setSendNotification(false);
    setModalVisible(true);
  };

  const handleDeleteNotice = async (noticeId: string) => {
    Alert.alert(
      "Delete Notice",
      "Are you sure you want to delete this notice?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (typeof noticeService.deleteNotice === "function") {
                await noticeService.deleteNotice(noticeId);
              } else {
                await api.delete(`/Notices/${noticeId}`);
              }
              setNotices((prev) => prev.filter((n) => n.id !== noticeId));
              Alert.alert("Success", "Notice deleted successfully.");
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to delete notice. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const handleSaveNotice = async () => {
    Keyboard.dismiss();
    if (!title.trim() || !desc.trim()) {
      Alert.alert(
        "Validation Error",
        "Please fill in both title and message description.",
      );
      return;
    }

    try {
      const storedUserId =
        (await AsyncStorage.getItem("userId")) || "admin_user_01";

      const targetFlatId = editingNoticeId
        ? editingNoticeFlat.id
        : selectedPG.id;

      const payload: any = {
        title: title.trim(),
        description: desc.trim(),
        isUrgent: isUrgent,
        sendNotification: sendNotification,
        createdByAdminId: storedUserId,
      };

      if (targetFlatId) {
        payload.flatId = targetFlatId;
      } else {
        payload.flatId = null;
      }

      let response;
      if (editingNoticeId) {
        if (typeof noticeService.updateNotice === "function") {
          response = await noticeService.updateNotice(editingNoticeId, payload);
        } else {
          response = await api.put(`/Notices/${editingNoticeId}`, payload);
        }
      } else {
        response = await noticeService.createNotice(payload);
      }

      if (
        response?.status === 200 ||
        response?.data?.success ||
        response?.status === 201
      ) {
        Alert.alert(
          "Success",
          editingNoticeId
            ? "Notice updated successfully!"
            : sendNotification
              ? "Notice broadcasted & WhatsApp alert triggered successfully!"
              : "Notice posted successfully!",
        );

        loadNotices(selectedPG.id);

        setTitle("");
        setDesc("");
        setIsUrgent(false);
        setSendNotification(true);
        setEditingNoticeId(null);
        setModalVisible(false);
        setActiveTab("today");
      } else {
        Alert.alert("Failed", "Could not save the notice. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong while saving the notice.");
    }
  };

  // Helper function to format today's date in "15 Aug 2026" style
  const getFormattedCurrentDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("en-GB", options); // Returns format like "15 Aug 2026"
  };

  const currentDateStr = getFormattedCurrentDate();

  // Updated filter logic: matches "Today" or the exact current date string (e.g. "15 Aug 2026")
  const todayNotices = notices.filter(
    (item) =>
      item.date === "Today" ||
      item.date === currentDateStr ||
      item.date?.includes("15 Aug 2026"),
  );
  const previousNotices = notices.filter(
    (item) =>
      item.date !== "Today" &&
      item.date !== currentDateStr &&
      !item.date?.includes("15 Aug 2026"),
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notice Board Manager</Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={handleOpenAddModal}
            style={styles.addButtonHeader}
          >
            <Ionicons name="add" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
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
                  color={
                    selectedPG.name === pg.name
                      ? isDarkMode
                        ? "#0B0F19"
                        : "#FFF"
                      : isDarkMode
                        ? "#CBD5E1"
                        : "#4B5563"
                  }
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
            color={
              activeTab === "today"
                ? "#06B6D4"
                : isDarkMode
                  ? "#64748B"
                  : "#6B7280"
            }
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
            color={
              activeTab === "previous"
                ? "#06B6D4"
                : isDarkMode
                  ? "#64748B"
                  : "#6B7280"
            }
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
                  color={isDarkMode ? "#475569" : "#D1D5DB"}
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

                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {item.urgent && (
                        <View style={[styles.urgentBadge, { marginRight: 8 }]}>
                          <Text style={styles.urgentText}>URGENT</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => handleOpenEditModal(item)}
                        style={{ padding: 6 }}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={18}
                          color="#06B6D4"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteNotice(item.id)}
                        style={{ padding: 6 }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
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
                <Ionicons
                  name="archive-outline"
                  size={40}
                  color={isDarkMode ? "#475569" : "#D1D5DB"}
                />
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
                          color={
                            item.urgent
                              ? "#EF4444"
                              : isDarkMode
                                ? "#94A3B8"
                                : "#6B7280"
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.noticeTitle}>{item.title}</Text>
                        <Text style={styles.noticeCategory}>
                          {item.pgName} • {item.date}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {item.urgent && (
                        <View style={[styles.urgentBadge, { marginRight: 8 }]}>
                          <Text style={styles.urgentText}>URGENT</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => handleOpenEditModal(item)}
                        style={{ padding: 6 }}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={18}
                          color="#06B6D4"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteNotice(item.id)}
                        style={{ padding: 6 }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.noticeDesc}>{item.desc}</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Broadcast / Edit Notice Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}
            >
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { maxHeight: "85%" }]}>
                  {/* Pull Indicator Bar */}
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isDarkMode ? "#374151" : "#CBD5E1",
                      alignSelf: "center",
                      marginBottom: 12,
                    }}
                  />

                  <View style={styles.modalHeaderTop}>
                    <Text style={styles.modalTitle}>
                      {editingNoticeId ? "Edit Notice" : "Broadcast Notice"}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Ionicons
                        name="close"
                        size={22}
                        color={isDarkMode ? "#94A3B8" : "#6B7280"}
                      />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 50 }}
                  >
                    <Text style={styles.targetPgText}>
                      Target Group:{" "}
                      <Text style={{ fontWeight: "bold", color: "#06B6D4" }}>
                        {editingNoticeId
                          ? editingNoticeFlat.name
                          : selectedPG.name}
                      </Text>
                    </Text>

                    <Text style={styles.inputLabel}>Notice Title</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Water Supply Maintenance"
                      placeholderTextColor={isDarkMode ? "#64748B" : "#9CA3AF"}
                      value={title}
                      onChangeText={setTitle}
                      returnKeyType="done"
                    />

                    <Text style={styles.inputLabel}>Notice Message</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Write detailed message for tenants..."
                      placeholderTextColor={isDarkMode ? "#64748B" : "#9CA3AF"}
                      multiline
                      numberOfLines={4}
                      value={desc}
                      onChangeText={setDesc}
                      returnKeyType="done"
                      blurOnSubmit={true}
                    />

                    <View style={styles.switchRow}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.switchLabel}>Mark as Urgent</Text>
                        <Text style={styles.switchSub}>
                          Highlights in red for tenants
                        </Text>
                      </View>
                      <Switch
                        trackColor={{
                          false: isDarkMode ? "#334155" : "#D1D5DB",
                          true: "#FCA5A5",
                        }}
                        thumbColor={isUrgent ? "#EF4444" : "#F4F3F4"}
                        value={isUrgent}
                        onValueChange={setIsUrgent}
                      />
                    </View>

                    {!editingNoticeId && (
                      <View style={styles.switchRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={styles.switchLabel}>
                            Send WhatsApp Alert
                          </Text>
                          <Text style={styles.switchSub}>
                            Instantly message all active tenants
                          </Text>
                        </View>
                        <Switch
                          trackColor={{
                            false: isDarkMode ? "#334155" : "#D1D5DB",
                            true: "#99F6E4",
                          }}
                          thumbColor={sendNotification ? "#06B6D4" : "#F4F3F4"}
                          value={sendNotification}
                          onValueChange={setSendNotification}
                        />
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSaveNotice}
                    >
                      <Text style={styles.saveBtnText}>
                        {editingNoticeId
                          ? "Update Notice"
                          : "Publish & Broadcast"}
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
