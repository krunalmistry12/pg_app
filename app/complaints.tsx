import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function AdminComplaintsScreen() {
  const router = useRouter();

  const pgBranches = [
    "All PGs (Common)",
    "Sunrise PG (Branch 1)",
    "Elite Boys PG (Branch 2)",
    "Co-Living PG (Branch 3)",
  ];
  const [selectedPG, setSelectedPG] = useState(pgBranches[0]);
  const [activeTab, setActiveTab] = useState("active"); // 'active' or 'resolved'

  const [complaints, setComplaints] = useState([
    {
      id: "1",
      pgName: "Sunrise PG (Branch 1)",
      tenant: "Rahul Sharma",
      room: "Room 102",
      phone: "+919876543210",
      title: "Water leakage in bathroom",
      category: "Plumbing",
      priority: "High",
      status: "Pending",
      date: "02 Jun 2026",
      remark: "",
    },
    {
      id: "2",
      pgName: "Elite Boys PG (Branch 2)",
      tenant: "Aman Verma",
      room: "Room 204",
      phone: "+919123456789",
      title: "Wi-Fi speed issue on 2nd floor",
      category: "Internet",
      priority: "Medium",
      status: "In Progress",
      date: "01 Jun 2026",
      remark: "ISP technician scheduled for tomorrow.",
    },
    {
      id: "3",
      pgName: "Sunrise PG (Branch 1)",
      tenant: "Priya Singh",
      room: "Room 301",
      phone: "+919988776655",
      title: "AC not cooling properly",
      category: "Electronics",
      priority: "Low",
      status: "Resolved",
      date: "25 May 2026",
      remark: "Gas refilled by service engineer.",
    },
  ]);

  // Modal State for updating complaint
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminRemark, setAdminRemark] = useState("");

  const openActionModal = (item: any) => {
    setSelectedComplaint(item);
    setNewStatus(item.status);
    setAdminRemark(item.remark || "");
    setModalVisible(true);
  };

  const handleUpdateComplaint = () => {
    Keyboard.dismiss();
    if (!selectedComplaint) return;

    setComplaints(
      complaints.map((item) => {
        if (item.id === selectedComplaint.id) {
          return { ...item, status: newStatus, remark: adminRemark };
        }
        return item;
      }),
    );
    setModalVisible(false);
  };

  // Filtering based on Branch and Tab (Fixed: If "All PGs (Common)" is selected, show everything)
  const branchFiltered = complaints.filter(
    (item) => selectedPG === "All PGs (Common)" || item.pgName === selectedPG,
  );

  const activeComplaints = branchFiltered.filter(
    (item) => item.status !== "Resolved",
  );
  const resolvedComplaints = branchFiltered.filter(
    (item) => item.status === "Resolved",
  );

  const displayedComplaints =
    activeTab === "active" ? activeComplaints : resolvedComplaints;

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
        <Text style={styles.headerTitle}>Manage Complaints</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* PG Branch Selector Bar */}
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "active" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("active")}
        >
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={activeTab === "active" ? "#06B6D4" : "#6B7280"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "active" && styles.activeTabText,
            ]}
          >
            Active ({activeComplaints.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "resolved" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("resolved")}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={16}
            color={activeTab === "resolved" ? "#06B6D4" : "#6B7280"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "resolved" && styles.activeTabText,
            ]}
          >
            Resolved History ({resolvedComplaints.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.banner}>
          <Ionicons
            name="construct-outline"
            size={26}
            color="#38BDF8"
            style={{ marginBottom: 4 }}
          />
          <Text style={styles.bannerLabel}>{selectedPG}</Text>
          <Text style={styles.bannerSubLabel}>
            {activeTab === "active"
              ? "Pending & In-Progress Issues"
              : "Successfully Resolved Issues"}
          </Text>
        </View>

        {displayedComplaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color="#D1D5DB"
            />
            <Text style={styles.emptyText}>
              No complaints found in this category.
            </Text>
          </View>
        ) : (
          displayedComplaints.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tenantText}>
                    {item.tenant} •{" "}
                    <Text style={{ color: "#06B6D4", fontWeight: "bold" }}>
                      {item.room}
                    </Text>
                  </Text>
                  <Text style={styles.branchSubText}>{item.pgName}</Text>
                </View>

                {/* Priority Badge */}
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor:
                        item.priority === "High"
                          ? "#FEE2E2"
                          : item.priority === "Medium"
                            ? "#FEF3C7"
                            : "#ECFDF5",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      {
                        color:
                          item.priority === "High"
                            ? "#991B1B"
                            : item.priority === "Medium"
                              ? "#92400E"
                              : "#065F46",
                      },
                    ]}
                  >
                    {item.priority}
                  </Text>
                </View>
              </View>

              <Text style={styles.complaintTitle}>{item.title}</Text>

              <View style={styles.categoryRow}>
                <View style={styles.catTag}>
                  <Text style={styles.catTagText}>{item.category}</Text>
                </View>
                <Text style={styles.dateText}>Raised: {item.date}</Text>
              </View>

              {item.remark ? (
                <View style={styles.remarkBox}>
                  <Text style={styles.remarkLabel}>Admin Remark:</Text>
                  <Text style={styles.remarkText}>{item.remark}</Text>
                </View>
              ) : null}

              {/* Footer Actions */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === "Resolved"
                          ? "#DEF7EC"
                          : item.status === "In Progress"
                            ? "#E1EFFE"
                            : "#FEF3C7",
                    },
                  ]}
                  onPress={() => openActionModal(item)}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color:
                          item.status === "Resolved"
                            ? "#03543F"
                            : item.status === "In Progress"
                              ? "#1E40AF"
                              : "#92400E",
                      },
                    ]}
                  >
                    ● {item.status} (Tap to Edit)
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionIconsRow}>
                  <TouchableOpacity style={styles.actionIconBtn}>
                    <Ionicons name="call-outline" size={16} color="#059669" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, { marginLeft: 8 }]}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#16A34A" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Status & Remark Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeaderTop}>
                  <Text style={styles.modalTitle}>Update Complaint</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {selectedComplaint && (
                  <Text style={styles.modalSubText}>
                    Tenant:{" "}
                    <Text style={{ fontWeight: "bold", color: "#1F2937" }}>
                      {selectedComplaint.tenant} ({selectedComplaint.room})
                    </Text>
                  </Text>
                )}

                <Text style={styles.inputLabel}>Change Status</Text>
                <View style={styles.statusOptionsRow}>
                  {["Pending", "In Progress", "Resolved"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOptionChip,
                        newStatus === status && styles.statusOptionChipActive,
                      ]}
                      onPress={() => setNewStatus(status)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          newStatus === status && styles.statusOptionTextActive,
                        ]}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>
                  Admin Remark / Action Note
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter notes (e.g. Plumber visited, part ordered...)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  value={adminRemark}
                  onChangeText={setAdminRemark}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                />

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleUpdateComplaint}
                >
                  <Text style={styles.saveBtnText}>Save Changes</Text>
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
    backgroundColor: "#0369A1",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  tenantText: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  branchSubText: {
    fontSize: 11,
    color: "#06B6D4",
    fontWeight: "600",
    marginTop: 2,
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: "bold" },

  complaintTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  catTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catTagText: { fontSize: 11, color: "#4B5563", fontWeight: "500" },
  dateText: { fontSize: 11, color: "#9CA3AF" },

  remarkBox: {
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#06B6D4",
  },
  remarkLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 2,
  },
  remarkText: { fontSize: 12, color: "#1F2937" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
    marginTop: 4,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: "600" },
  actionIconsRow: { flexDirection: "row" },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyText: { color: "#9CA3AF", fontSize: 12, marginTop: 8 },

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
    marginBottom: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1A1A1A" },
  modalSubText: { fontSize: 13, color: "#6B7280", marginBottom: 14 },

  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 6,
  },
  statusOptionsRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  statusOptionChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusOptionChipActive: {
    backgroundColor: "#ECFEFF",
    borderColor: "#06B6D4",
  },
  statusOptionText: { fontSize: 11, fontWeight: "600", color: "#4B5563" },
  statusOptionTextActive: { color: "#0E7490", fontWeight: "bold" },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1A1A1A",
    marginBottom: 14,
    backgroundColor: "#F9FAFB",
  },
  textArea: { height: 80, textAlignVertical: "top" },

  saveBtn: {
    backgroundColor: "#06B6D4",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
});
