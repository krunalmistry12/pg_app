import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { complaintService } from "../src/services/complaint/complaintService";
import { tenantService } from "../src/services/tenantApi";

interface ComplaintItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status?: string;
  date?: string;
  attachmentName?: string;
}

const CATEGORIES = [
  "Electrical",
  "Plumbing",
  "WiFi / Internet",
  "Carpentry",
  "Cleaning",
  "Other",
];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export default function TenantComplaintsScreen() {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "resolved">("active"); // 👈 Tab switcher state
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Electrical");
  const [priority, setPriority] = useState("Medium");
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [attachedUri, setAttachedUri] = useState<string | null>(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getMyComplaints();
      const rawData = Array.isArray(response)
        ? response
        : response?.data || response?.data?.data || [];

      const formatted: ComplaintItem[] = rawData.map((item: any) => ({
        id: item.id || item.Id || Math.random().toString(),
        title: item.title || item.Title || "Untitled Issue",
        description: item.description || item.Description || "",
        category: item.category || item.Category || "General",
        priority: item.priority || item.Priority || "Medium",
        status: item.status || item.Status || "Pending",
        date: item.createdAt || item.Date || "Recent",
        attachmentName: item.attachmentName || item.AttachmentName || null,
      }));

      setComplaints(formatted);
    } catch (error: any) {
      console.log("--> [LoadComplaints] ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickAttachment = () => {
    Alert.alert("Attach File", "Choose upload source", [
      {
        text: "Camera",
        onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!res.canceled && res.assets?.[0]) {
            setAttachedFile(res.assets[0].fileName || "photo.jpg");
            setAttachedUri(res.assets[0].uri);
          }
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
          });
          if (!res.canceled && res.assets?.[0]) {
            setAttachedFile(res.assets[0].uri.split("/").pop() || "image.jpg");
            setAttachedUri(res.assets[0].uri);
          }
        },
      },
      {
        text: "Document / PDF",
        onPress: async () => {
          const res = await DocumentPicker.getDocumentAsync({});
          if (!res.canceled && res.assets?.[0]) {
            setAttachedFile(res.assets[0].name);
            setAttachedUri(res.assets[0].uri);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSubmitComplaint = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill in title and description.");
      return;
    }

    try {
      setSubmitting(true);
      const resolvedTenantId = await tenantService.getTenantId();
      const cachedProfileString = await AsyncStorage.getItem(
        "cached_tenant_profile",
      );
      let flatId = "51e75c4d-7bb9-4e2c-8933-81729d01e195";

      if (cachedProfileString) {
        const parsed = JSON.parse(cachedProfileString);
        flatId = parsed.flatId || parsed.FlatId || parsed.flat_id || flatId;
      }

      const payload = {
        flatId: String(flatId),
        tenantId: Number(resolvedTenantId),
        title,
        description,
        category,
        priority,
        attachmentName: attachedFile || "",
        attachmentUri: attachedUri || "",
      };

      await complaintService.createComplaint(payload);
      Alert.alert("Success", "Complaint submitted successfully.");

      setTitle("");
      setDescription("");
      setCategory("Electrical");
      setPriority("Medium");
      setAttachedFile(null);
      setAttachedUri(null);
      setModalVisible(false);

      loadComplaints();
    } catch (error: any) {
      Alert.alert(
        "Server Error",
        error?.response?.data?.message || "Could not submit complaint.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
      case "closed":
        return { bg: "rgba(52, 211, 153, 0.12)", color: "#34D399" };
      case "in progress":
        return { bg: "rgba(56, 189, 248, 0.12)", color: "#38BDF8" };
      default:
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#F59E0B" };
    }
  };

  // Filter complaints based on active tab view
  const filteredComplaints = complaints.filter((item) => {
    const isResolved =
      item.status?.toLowerCase() === "resolved" ||
      item.status?.toLowerCase() === "closed";
    if (activeTab === "resolved") {
      return isResolved;
    }
    return !isResolved; // active tab contains pending / in-progress
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Complaints</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.newBtnText}>Raise Issue</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Switcher: Active vs Archive/Resolved */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.activeTab]}
          onPress={() => setActiveTab("active")}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={activeTab === "active" ? "#38BDF8" : "#94A3B8"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "active" && styles.activeTabText,
            ]}
          >
            Active Issues
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "resolved" && styles.activeTab]}
          onPress={() => setActiveTab("resolved")}
        >
          <Ionicons
            name="archive-outline"
            size={16}
            color={activeTab === "resolved" ? "#34D399" : "#94A3B8"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "resolved" && styles.resolvedTabText,
            ]}
          >
            Resolved Archive
          </Text>
        </TouchableOpacity>
      </View>

      {/* List content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#38BDF8"
            style={{ marginTop: 40 }}
          />
        ) : filteredComplaints.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name={
                activeTab === "active" ? "construct-outline" : "archive-outline"
              }
              size={44}
              color="#64748B"
            />
            <Text style={styles.emptyText}>
              {activeTab === "active"
                ? "No active complaints."
                : "No resolved complaints in archive."}
            </Text>
          </View>
        ) : (
          filteredComplaints.map((item) => {
            const badge = getStatusBadgeStyle(item.status || "Pending");
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardCategory}>
                      {item.category} • Priority: {item.priority}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>
                      {item.status || "Pending"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDesc}>{item.description}</Text>

                {item.attachmentName ? (
                  <View style={styles.attachmentRow}>
                    <Ionicons
                      name="document-attach-outline"
                      size={14}
                      color="#38BDF8"
                    />
                    <Text style={styles.attachmentText} numberOfLines={1}>
                      {item.attachmentName}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Complaint Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Raise New Issue</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.label}>Issue Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Fan not working"
                    placeholderTextColor="#64748B"
                    value={title}
                    onChangeText={setTitle}
                  />

                  <Text style={styles.label}>Category</Text>
                  <View style={styles.chipRow}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.chip,
                          category === cat && styles.chipActive,
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            category === cat && styles.chipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Priority</Text>
                  <View style={styles.chipRow}>
                    {PRIORITIES.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.chip,
                          priority === p && styles.chipActive,
                        ]}
                        onPress={() => setPriority(p)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            priority === p && styles.chipTextActive,
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { height: 80, textAlignVertical: "top" },
                    ]}
                    placeholder="Describe your problem in detail..."
                    placeholderTextColor="#64748B"
                    multiline
                    value={description}
                    onChangeText={setDescription}
                  />

                  <Text style={styles.label}>Attachment (Optional)</Text>
                  <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={handlePickAttachment}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={18}
                      color="#38BDF8"
                    />
                    <Text style={styles.uploadText} numberOfLines={1}>
                      {attachedFile
                        ? attachedFile
                        : "Tap to attach image or document"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSubmitComplaint}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>Submit Complaint</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#F8FAFC" },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#38BDF8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  newBtnText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 6,
  },
  activeTab: {
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    borderColor: "rgba(56, 189, 248, 0.2)",
  },
  tabText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  activeTabText: { color: "#38BDF8" },
  resolvedTabText: { color: "#34D399" },
  scrollContent: { padding: 20 },
  emptyBox: { alignItems: "center", justifyContent: "center", marginTop: 80 },
  emptyText: { color: "#94A3B8", fontSize: 14, marginTop: 10 },
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#F8FAFC" },
  cardCategory: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardDesc: { fontSize: 13, color: "#CBD5E1", lineHeight: 18 },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  attachmentText: { fontSize: 12, color: "#38BDF8" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#F8FAFC" },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F8FAFC",
    fontSize: 13,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipActive: { backgroundColor: "#38BDF8", borderColor: "#38BDF8" },
  chipText: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  chipTextActive: { color: "#FFF" },
  uploadBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  uploadText: { fontSize: 12, color: "#38BDF8" },
  submitBtn: {
    backgroundColor: "#38BDF8",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});
