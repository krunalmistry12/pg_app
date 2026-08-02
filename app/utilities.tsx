import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing"; // Added for viewing/sharing files
import React, { useState } from "react";
import {
  Alert,
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

export default function AdminUtilitiesScreen() {
  const router = useRouter();

  const pgBranches = [
    "All PGs (Common)",
    "Sunrise PG (Branch 1)",
    "Elite Boys PG (Branch 2)",
    "Co-Living PG (Branch 3)",
  ];
  const [selectedPG, setSelectedPG] = useState(pgBranches[0]);

  const [selectedMonth, setSelectedMonth] = useState("Jun 2026");
  const monthsList = ["Jun 2026", "May 2026", "Apr 2026", "Mar 2026"];

  const [expenses, setExpenses] = useState([
    {
      id: "1",
      pgName: "All PGs (Common)",
      title: "Software Subscription / Management Tool",
      category: "Maintenance",
      amount: "2000",
      month: "Jun 2026",
      date: "01 Jun",
      receiptName: "invoice_sw_jun.pdf",
      receiptUri: "", // Local URI save karne ke liye
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Light Bill");
  const [amount, setAmount] = useState("");
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [attachedUri, setAttachedUri] = useState<string | null>(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  const categories = [
    "Light Bill",
    "Internet",
    "Water",
    "Maintenance",
    "Staff Salary",
  ];

  const handleAddExpense = () => {
    if (!title || !amount) return;
    const newExp = {
      id: Date.now().toString(),
      pgName:
        selectedPG === "All PGs (Common)"
          ? "Sunrise PG (Branch 1)"
          : selectedPG,
      title,
      category,
      amount,
      month: selectedMonth,
      date: "Today",
      receiptName: attachedFile || "",
      receiptUri: attachedUri || "",
    };
    setExpenses([newExp, ...expenses]);
    setTitle("");
    setAmount("");
    setAttachedFile(null);
    setAttachedUri(null);
    setModalVisible(false);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((item) => item.id !== id));
    setDetailModalVisible(false);
  };

  // Attachment Picker
  const showAttachmentOptions = () => {
    Alert.alert(
      "Attach Bill / Receipt",
      "Choose file type to attach",
      [
        {
          text: "Take Photo (Camera)",
          onPress: async () => {
            const permissionResult =
              await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
              alert("Camera permission is required!");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setAttachedFile(
                result.assets[0].fileName || "camera_receipt.jpg",
              );
              setAttachedUri(result.assets[0].uri);
            }
          },
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              const fileName =
                result.assets[0].uri.split("/").pop() || "gallery_image.jpg";
              setAttachedFile(fileName);
              setAttachedUri(result.assets[0].uri);
            }
          },
        },
        {
          text: "Upload PDF / Document",
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "image/*"],
                copyToCacheDirectory: true,
              });
              if (
                !result.canceled &&
                result.assets &&
                result.assets.length > 0
              ) {
                setAttachedFile(result.assets[0].name);
                setAttachedUri(result.assets[0].uri);
              }
            } catch (err) {
              console.log("Document picking error:", err);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  // FUNCTION TO VIEW ATTACHED FILE
  const handleViewAttachment = async (uri: string) => {
    if (!uri) {
      Alert.alert("Notice", "No file preview available for this sample item.");
      return;
    }
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(
          "Error",
          "Sharing/Viewing is not available on this device.",
        );
      }
    } catch (error) {
      Alert.alert("Error", "Could not open the attachment.");
    }
  };

  const filteredExpenses = expenses.filter(
    (item) =>
      (selectedPG === "All PGs (Common)" || item.pgName === selectedPG) &&
      item.month === selectedMonth,
  );

  const totalPGMonthExpense = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
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
        <Text style={styles.headerTitle}>PG Expenses Management</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addButtonHeader}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* PG Branches Selector */}
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

      {/* Month Selector */}
      <View style={styles.monthBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollRow}
        >
          {monthsList.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.monthChip,
                selectedMonth === m && styles.monthChipActive,
              ]}
              onPress={() => setSelectedMonth(m)}
            >
              <Text
                style={[
                  styles.monthChipText,
                  selectedMonth === m && styles.monthChipTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.banner,
            selectedPG === "All PGs (Common)" && styles.commonBanner,
          ]}
        >
          <Text style={styles.bannerLabel}>{selectedPG}</Text>
          <Text style={styles.bannerSubLabel}>
            Total Expenses for {selectedMonth}
          </Text>
          <Text style={styles.bannerAmount}>
            ₹{totalPGMonthExpense.toLocaleString()}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Transactions List ({filteredExpenses.length})
        </Text>

        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              No records found for {selectedPG} in {selectedMonth}
            </Text>
          </View>
        ) : (
          filteredExpenses.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => {
                setSelectedExpense(item);
                setDetailModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="flash-outline" size={20} color="#06B6D4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseTitle}>{item.title}</Text>
                  <Text style={styles.expenseCategory}>
                    {item.category} • {item.date}
                  </Text>
                  {selectedPG === "All PGs (Common)" && (
                    <Text style={styles.branchSubTag}>{item.pgName}</Text>
                  )}
                </View>
              </View>

              <View style={styles.cardRight}>
                <Text style={styles.expenseAmount}>-₹{item.amount}</Text>
                {item.receiptName ? (
                  <View style={styles.receiptBadge}>
                    <Ionicons
                      name="document-attach"
                      size={12}
                      color="#059669"
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.receiptBadgeText}>Attached</Text>
                  </View>
                ) : (
                  <Text style={styles.noReceiptText}>No receipt</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeaderTop}>
                  <Text style={styles.modalTitle}>Add Expense</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.targetPgText}>
                  Adding for:{" "}
                  <Text style={{ fontWeight: "bold", color: "#06B6D4" }}>
                    {selectedPG}
                  </Text>{" "}
                  ({selectedMonth})
                </Text>

                <Text style={styles.inputLabel}>Expense Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Electricity bill / Repairs"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.inputLabel}>Select Category</Text>
                <View style={styles.categoryRow}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChip,
                        category === cat && styles.catChipActive,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          category === cat && styles.catChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 1500"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />

                <Text style={styles.inputLabel}>
                  Attach Bill / Receipt (Image or PDF)
                </Text>
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={showAttachmentOptions}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color="#06B6D4"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.uploadText} numberOfLines={1}>
                    {attachedFile ? attachedFile : "Tap to upload Image or PDF"}
                  </Text>
                  {attachedFile ? (
                    <TouchableOpacity
                      onPress={() => {
                        setAttachedFile(null);
                        setAttachedUri(null);
                      }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color="#EF4444"
                        style={{ marginLeft: 6 }}
                      />
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleAddExpense}
                >
                  <Text style={styles.saveBtnText}>Save Expense</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Detail Modal with View Attachment Option */}
      <Modal
        visible={detailModalVisible}
        animationType="fade"
        transparent={true}
      >
        <TouchableWithoutFeedback onPress={() => setDetailModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              {selectedExpense && (
                <View style={styles.modalContent}>
                  <View style={styles.modalHeaderTop}>
                    <Text style={styles.modalTitle}>Expense Details</Text>
                    <TouchableOpacity
                      onPress={() => setDetailModalVisible(false)}
                    >
                      <Ionicons name="close" size={22} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailContainer}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Title:</Text>
                      <Text style={styles.detailValue}>
                        {selectedExpense.title}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Category:</Text>
                      <Text style={styles.detailValue}>
                        {selectedExpense.category}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Branch:</Text>
                      <Text style={styles.detailValue}>
                        {selectedExpense.pgName}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: "#EF4444", fontWeight: "bold" },
                        ]}
                      >
                        ₹{selectedExpense.amount}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Attachment:</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color: selectedExpense.receiptName
                              ? "#059669"
                              : "#9CA3AF",
                          },
                        ]}
                      >
                        {selectedExpense.receiptName
                          ? selectedExpense.receiptName
                          : "None"}
                      </Text>
                    </View>
                  </View>

                  {/* VIEW ATTACHMENT BUTTON (If attached) */}
                  {selectedExpense.receiptName ? (
                    <TouchableOpacity
                      style={styles.viewAttachmentBtn}
                      onPress={() =>
                        handleViewAttachment(selectedExpense.receiptUri)
                      }
                    >
                      <Ionicons
                        name="eye-outline"
                        size={16}
                        color="#06B6D4"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.viewAttachmentText}>
                        View Attached Receipt / PDF
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.actionButtonRow}>
                    <TouchableOpacity
                      style={styles.closeDetailBtn}
                      onPress={() => setDetailModalVisible(false)}
                    >
                      <Text style={styles.closeDetailText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteActionBtn}
                      onPress={() => handleDeleteExpense(selectedExpense.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#FFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.deleteActionText}>Delete Record</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
  monthBarContainer: {
    backgroundColor: "#FFF",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    marginRight: 6,
  },
  monthChipActive: { backgroundColor: "#06B6D4" },
  monthChipText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },
  monthChipTextActive: { color: "#FFF" },
  scrollContent: { padding: 16 },
  banner: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
  },
  commonBanner: { backgroundColor: "#0369A1" },
  bannerLabel: {
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  bannerSubLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },
  bannerAmount: {
    color: "#FFF",
    fontSize: 30,
    fontWeight: "bold",
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
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
  expenseTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  expenseCategory: { fontSize: 11, color: "#6B7280" },
  branchSubTag: {
    fontSize: 10,
    color: "#06B6D4",
    fontWeight: "600",
    marginTop: 2,
  },
  cardRight: { alignItems: "flex-end" },
  expenseAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#EF4444",
    marginBottom: 4,
  },
  receiptBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DEF7EC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  receiptBadgeText: { fontSize: 9, fontWeight: "bold", color: "#03543F" },
  noReceiptText: { fontSize: 10, color: "#9CA3AF" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
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
    marginBottom: 14,
    backgroundColor: "#F9FAFB",
  },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    marginRight: 6,
    marginBottom: 6,
  },
  catChipActive: { backgroundColor: "#06B6D4" },
  catChipText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },
  catChipTextActive: { color: "#FFF" },
  uploadBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
  },
  uploadText: { fontSize: 13, color: "#4B5563", flex: 1 },
  saveBtn: {
    backgroundColor: "#06B6D4",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  detailContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  detailLabel: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  detailValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1F2937",
    maxWidth: "60%",
    textAlign: "right",
  },
  viewAttachmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFEFF",
    borderWidth: 1,
    borderColor: "#06B6D4",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  viewAttachmentText: { color: "#06B6D4", fontWeight: "bold", fontSize: 13 },
  actionButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  closeDetailBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginRight: 8,
  },
  closeDetailText: { color: "#4B5563", fontWeight: "bold", fontSize: 14 },
  deleteActionBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#EF4444",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  deleteActionText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
});
