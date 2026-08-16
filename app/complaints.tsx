import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  fetchAdminComplaintsApi,
  fetchFlatsAndBranches,
  updateComplaintStatusApi,
} from "../src/services/complaint/complaintService";
import { styles } from "../src/styles/Admin/AdminComplaintsStyles";

interface PGBranch {
  id: string | null;
  name: string;
}

export default function AdminComplaintsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadingFlats, setLoadingFlats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);

  const [pgBranches, setPgBranches] = useState<PGBranch[]>([
    { id: null, name: "All PGs (Common)" },
  ]);
  const [selectedPG, setSelectedPG] = useState<PGBranch>({
    id: null,
    name: "All PGs (Common)",
  });
  const [activeTab, setActiveTab] = useState("active");

  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminRemark, setAdminRemark] = useState("");

  useEffect(() => {
    loadFlatsData();
    loadComplaintsData();
  }, []);

  const loadFlatsData = async () => {
    try {
      setLoadingFlats(true);
      const storedUserId = await AsyncStorage.getItem("userId");
      let flatList = await fetchFlatsAndBranches(storedUserId);

      if (!flatList || flatList.length === 0) {
        const cachedFlats = await AsyncStorage.getItem("flats_2bhk");
        if (cachedFlats) {
          flatList = JSON.parse(cachedFlats);
        }
      }

      if (Array.isArray(flatList) && flatList.length > 0) {
        await AsyncStorage.setItem("flats_2bhk", JSON.stringify(flatList));

        const uniqueApts = Array.from(
          new Set(
            flatList.map(
              (flat: any) =>
                flat.pgName ||
                flat.PgName ||
                flat.apartmentName ||
                flat.ApartmentName ||
                "Apartment",
            ),
          ),
        );

        const dynamicBranches: PGBranch[] = uniqueApts.map(
          (aptName: any, fIdx: number) => ({
            id: `branch-${fIdx}`,
            name: aptName,
          }),
        );

        setPgBranches([
          { id: null, name: "All PGs (Common)" },
          ...dynamicBranches,
        ]);
      }
    } catch (error) {
      console.log("Error loading flats:", error);
    } finally {
      setLoadingFlats(false);
    }
  };

  const loadComplaintsData = async () => {
    try {
      setLoading(true);
      const formatted = await fetchAdminComplaintsApi();
      setComplaints(formatted);
    } catch (error: any) {
      console.log(
        "--> [AdminFetch] Error:",
        error?.response?.data || error.message,
      );
      Alert.alert("Error", "Failed to load admin complaints from server.");
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (item: any) => {
    setSelectedComplaint(item);
    setNewStatus(item.status);
    setAdminRemark(item.remark || "");
    setModalVisible(true);
  };

  const handleUpdateComplaint = async () => {
    Keyboard.dismiss();
    if (!selectedComplaint) return;

    try {
      setSubmitting(true);
      await updateComplaintStatusApi(
        selectedComplaint.id,
        newStatus,
        adminRemark,
      );

      setComplaints(
        complaints.map((item) => {
          if (item.id === selectedComplaint.id) {
            return { ...item, status: newStatus, remark: adminRemark };
          }
          return item;
        }),
      );

      setModalVisible(false);
      Alert.alert("Success", "Complaint updated successfully.");
    } catch (error: any) {
      console.log(
        "--> [UpdateComplaint] Error:",
        error?.response?.data || error.message,
      );
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update status.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const branchFiltered = complaints.filter(
    (item) =>
      selectedPG.name === "All PGs (Common)" || item.pgName === selectedPG.name,
  );

  const activeComplaints = branchFiltered.filter(
    (item) =>
      item.status?.toLowerCase() !== "resolved" &&
      item.status?.toLowerCase() !== "closed",
  );
  const resolvedComplaints = branchFiltered.filter(
    (item) =>
      item.status?.toLowerCase() === "resolved" ||
      item.status?.toLowerCase() === "closed",
  );

  const displayedComplaints =
    activeTab === "active" ? activeComplaints : resolvedComplaints;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Complaints</Text>
        <TouchableOpacity
          onPress={() => {
            loadFlatsData();
            loadComplaintsData();
          }}
          style={{ padding: 4 }}
        >
          <Ionicons name="refresh-outline" size={20} color="#06B6D4" />
        </TouchableOpacity>
      </View>

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
            {pgBranches.map((pg) => {
              const isSelected = selectedPG.name === pg.name;
              const isCommon = pg.name === "All PGs (Common)";

              return (
                <TouchableOpacity
                  key={pg.id || pg.name}
                  style={[
                    styles.pgChip,
                    isSelected && styles.pgChipActive,
                    isCommon && !isSelected && styles.commonChip,
                  ]}
                  onPress={() => setSelectedPG(pg)}
                >
                  <Ionicons
                    name={isCommon ? "globe-outline" : "business-outline"}
                    size={14}
                    color={isSelected ? "#FFF" : "#4B5563"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.pgChipText,
                      isSelected && styles.pgChipTextActive,
                    ]}
                  >
                    {pg.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

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
            Resolved Archive ({resolvedComplaints.length})
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
          <Text style={styles.bannerLabel}>{selectedPG.name}</Text>
          <Text style={styles.bannerSubLabel}>
            {activeTab === "active"
              ? "Pending & In-Progress Issues"
              : "Successfully Resolved Issues Archive"}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#06B6D4"
            style={{ marginTop: 40 }}
          />
        ) : displayedComplaints.length === 0 ? (
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
                      Room {item.room}
                    </Text>
                  </Text>
                  <Text style={styles.branchSubText}>{item.pgName}</Text>
                </View>

                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor:
                        item.priority === "High" || item.priority === "Urgent"
                          ? "#FEE2E2"
                          : item.priority === "Medium"
                            ? "#FEF3C7"
                            : "#DCFCE7",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      {
                        color:
                          item.priority === "High" || item.priority === "Urgent"
                            ? "#991B1B"
                            : item.priority === "Medium"
                              ? "#854D0E"
                              : "#166534",
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

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === "Resolved"
                          ? "#DCFCE7"
                          : item.status === "In Progress"
                            ? "#DBEAFE"
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
                            ? "#166534"
                            : item.status === "In Progress"
                              ? "#1E40AF"
                              : "#854D0E",
                      },
                    ]}
                  >
                    ● {item.status} (Tap to Edit)
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionIconsRow}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => Linking.openURL(`tel:${item.phone}`)}
                  >
                    <Ionicons name="call-outline" size={16} color="#059669" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, { marginLeft: 8 }]}
                    onPress={() =>
                      Linking.openURL(`whatsapp://send?phone=${item.phone}`)
                    }
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#16A34A" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

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
                      {selectedComplaint.tenant} (Room {selectedComplaint.room})
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
                  placeholder="Enter notes..."
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
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
