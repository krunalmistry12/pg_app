import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function AdminNoticesScreen() {
  const router = useRouter();

  const pgBranches = [
    "All PGs (Common)",
    "Sunrise PG (Branch 1)",
    "Elite Boys PG (Branch 2)",
    "Co-Living PG (Branch 3)",
  ];
  const [selectedPG, setSelectedPG] = useState(pgBranches[0]);

  // Tab state: 'today' or 'previous'
  const [activeTab, setActiveTab] = useState("today");

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);

  const [notices, setNotices] = useState([
    {
      id: "1",
      pgName: "All PGs (Common)",
      title: "Monthly Rent Deadline Reminder",
      desc: "Please clear your rent before 7th of this month to avoid late fees.",
      date: "05 Jun 2026",
      urgent: true,
    },
    {
      id: "2",
      pgName: "Sunrise PG (Branch 1)",
      title: "Water Supply Maintenance",
      desc: "Water supply will be shut down tomorrow from 10 AM to 1 PM for tank cleaning.",
      date: "02 Jun 2026",
      urgent: false,
    },
  ]);

  const handlePostNotice = () => {
    Keyboard.dismiss();
    if (!title || !desc) return;
    const newNotice = {
      id: Date.now().toString(),
      pgName: selectedPG,
      title,
      desc,
      date: "Today",
      urgent: isUrgent,
    };
    setNotices([newNotice, ...notices]);

    if (sendNotification) {
      // WhatsApp / SMS API integration logic here
    }

    setTitle("");
    setDesc("");
    setIsUrgent(false);
    setSendNotification(true);
    setModalVisible(false);
    setActiveTab("today"); // Switch to today tab automatically when new notice is posted
  };

  // Filter based on selected PG
  const branchFilteredNotices = notices.filter(
    (item) => item.pgName === selectedPG || item.pgName === "All PGs (Common)",
  );

  // Separate Today's notices and Previous notices
  const todayNotices = branchFilteredNotices.filter(
    (item) => item.date === "Today",
  );
  const previousNotices = branchFilteredNotices.filter(
    (item) => item.date !== "Today",
  );

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollRow}
        >
          {pgBranches.map((pg) => (
            <TouchableOpacity
              key={pg}
              style={[
                styles.pgChip,
                selectedPG === pg && styles.pgChipActive,
                pg === "All PGs (Common)" && styles.commonChip,
              ]}
              onPress={() => setSelectedPG(pg)}
            >
              <Ionicons
                name={
                  pg === "All PGs (Common)"
                    ? "globe-outline"
                    : "business-outline"
                }
                size={14}
                color={selectedPG === pg ? "#FFF" : "#4B5563"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.pgChipText,
                  selectedPG === pg && styles.pgChipTextActive,
                ]}
              >
                {pg}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
          style={[
            styles.banner,
            selectedPG === "All PGs (Common)" && styles.commonBanner,
          ]}
        >
          <Ionicons
            name="megaphone-outline"
            size={28}
            color="#38BDF8"
            style={{ marginBottom: 4 }}
          />
          <Text style={styles.bannerLabel}>{selectedPG}</Text>
          <Text style={styles.bannerSubLabel}>
            {activeTab === "today"
              ? "Today's Active Broadcasts"
              : "Archived Notice History"}
          </Text>
        </View>

        {/* Display content based on active tab */}
        {activeTab === "today" ? (
          <>
            {todayNotices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="notifications-off-outline"
                  size={40}
                  color="#D1D5DB"
                />
                <Text style={styles.emptyText}>
                  No new notices posted for today in {selectedPG}
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
                  No previous history available for {selectedPG}
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
                    {selectedPG}
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

                {/* Urgent Switch Toggle */}
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

                {/* Send WhatsApp / SMS Switch Toggle */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 17, fontWeight: "bold", color: "#1A1A1A" },
  backButton: { padding: 4 },
  addButtonHeader: {
    backgroundColor: "#06B6D4",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  pgBarContainer: {
    backgroundColor: "#FFF",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  scrollRow: { paddingHorizontal: 16 },

  pgChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  pgChipActive: { backgroundColor: "#0F172A" },
  commonChip: { borderWidth: 1, borderColor: "#06B6D4", borderStyle: "dashed" },
  pgChipText: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  pgChipTextActive: { color: "#FFF" },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: "#ECFEFF",
    borderWidth: 1,
    borderColor: "#06B6D4",
  },
  tabText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  activeTabText: { color: "#0E7490", fontWeight: "bold" },

  scrollContent: { padding: 16 },
  banner: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  commonBanner: { backgroundColor: "#0369A1" },
  bannerLabel: {
    color: "#38BDF8",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
    textAlign: "center",
  },
  bannerSubLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  archiveCard: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  urgentCard: { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
  cardHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFEFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  archiveIconContainer: {
    backgroundColor: "#F3F4F6",
  },
  urgentIconContainer: { backgroundColor: "#FEE2E2" },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  noticeCategory: { fontSize: 11, color: "#6B7280" },

  urgentBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgentText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  noticeDesc: { fontSize: 13, color: "#4B5563", lineHeight: 18, marginTop: 4 },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1A1A1A" },
  targetPgText: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 14,
    backgroundColor: "#F0FDF4",
    padding: 8,
    borderRadius: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1A1A1A",
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  textArea: { height: 90, textAlignVertical: "top" },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  switchLabel: { fontSize: 13, fontWeight: "bold", color: "#1F2937" },
  switchSub: { fontSize: 11, color: "#6B7280" },

  saveBtn: {
    backgroundColor: "#06B6D4",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 6,
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
});
