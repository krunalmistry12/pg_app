import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { expenseService } from "../src/services/Utility/expenseEndpoints";
import { styles } from "../src/styles/Admin/UtilitiesStyles";

interface PGBranch {
  id: string | null;
  name: string;
}

export default function AdminUtilitiesScreen() {
  const router = useRouter();

  const [pgBranches, setPgBranches] = useState<PGBranch[]>([
    { id: null, name: "All PGs (Common)" },
  ]);
  const [selectedPG, setSelectedPG] = useState<PGBranch>({
    id: null,
    name: "All PGs (Common)",
  });
  const [loadingFlats, setLoadingFlats] = useState<boolean>(false);
  const [loadingExpenses, setLoadingExpenses] = useState<boolean>(false);

  // Dynamically generate current month and past 11 months for historical viewing
  const generateMonthsList = () => {
    const list = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const formatted = date.toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      });
      list.push(formatted);
      date.setMonth(date.getMonth() - 1);
    }
    return list;
  };

  const monthsList = generateMonthsList();
  const [selectedMonth, setSelectedMonth] = useState(monthsList[0]);

  const [expenses, setExpenses] = useState<any[]>([]);

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

  useEffect(() => {
    loadFlats();
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [selectedPG, selectedMonth]);

  const loadFlats = async () => {
    try {
      setLoadingFlats(true);
      const flatList = await expenseService.fetchFlats();

      if (Array.isArray(flatList) && flatList.length > 0) {
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
      }
    } catch (error) {
      console.log("Error loading flats layout:", error);
    } finally {
      setLoadingFlats(false);
    }
  };
const getCategoryIcon = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case "light bill":
        return "flash-outline";
      case "internet":
        return "wifi-outline";
      case "water":
        return "water-outline";
      case "maintenance":
        return "construct-outline";
      case "staff salary":
        return "people-outline";
      default:
        return "receipt-outline";
    }
  };
  const loadExpenses = async () => {
    try {
      setLoadingExpenses(true);
      const formatted = await expenseService.fetchExpenses(selectedMonth);
      setExpenses(formatted);
    } catch (error) {
      console.log("Error loading expenses screen data:", error);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const handleAddExpense = async () => {
    if (!title || !amount) {
      Alert.alert("Validation", "Please enter title and amount.");
      return;
    }

    try {
      const storedUserId =
        (await AsyncStorage.getItem("userId")) ||
        "3fa85f64-5717-4562-b3fc-2c963f66afa6";
      const targetFlatId =
        selectedPG.id ||
        pgBranches.find((b) => b.id !== null)?.id ||
        "3fa85f64-5717-4562-b3fc-2c963f66afa6";

      const payload = {
        flatId: targetFlatId,
        isCommonExpense: selectedPG.id === null,
        userId: storedUserId,
        title: title,
        category: category,
        amount: Number(amount),
        month: selectedMonth,
        date: new Date().toISOString(),
        paymentMode: "Online",
        paidBy: "Admin",
        status: "Success",
        receiptName: attachedFile || "",
        receiptUri: attachedUri || "",
        notes: "Created via Mobile App",
      };

      await expenseService.createExpense(payload);
      loadExpenses();

      setTitle("");
      setAmount("");
      setAttachedFile(null);
      setAttachedUri(null);
      setModalVisible(false);
      Alert.alert("Success", "Expense added successfully!");
    } catch (error) {
      console.log("Error creating expense:", error);
      Alert.alert("Error", "Failed to save expense to server.");
    }
  };

  const confirmAndDeleteExpense = (id: string, expenseTitle: string) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete "${expenseTitle}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await expenseService.deleteExpense(id);
              setExpenses((prev) => prev.filter((item) => item.id !== id));
              setDetailModalVisible(false);
              Alert.alert("Deleted", "Expense record removed successfully.");
            } catch (error: any) {
              console.log(
                "Error deleting expense details:",
                error?.response?.data || error.message,
              );
              Alert.alert("Error", "Could not delete expense from server.");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

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

  const handleViewAttachment = async (uri: string) => {
    if (!uri) {
      Alert.alert("Notice", "No file preview available for this item.");
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
      (selectedPG.id === null ||
        item.flatId === selectedPG.id ||
        item.isCommonExpense) &&
      item.month === selectedMonth,
  );

  const totalPGMonthExpense = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
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
          <Ionicons name="arrow-back" size={24} color="#FFF" />
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
                  selectedPG.id === pg.id && styles.pgChipActive,
                  pg.id === null && styles.commonChip,
                ]}
                onPress={() => setSelectedPG(pg)}
              >
                <Ionicons
                  name={pg.id === null ? "globe-outline" : "business-outline"}
                  size={14}
                  color={selectedPG.id === pg.id ? "#FFF" : "#4B5563"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.pgChipText,
                    selectedPG.id === pg.id && styles.pgChipTextActive,
                  ]}
                >
                  {pg.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
          style={[styles.banner, selectedPG.id === null && styles.commonBanner]}
        >
          <Text style={styles.bannerLabel}>{selectedPG.name}</Text>
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

        {loadingExpenses ? (
          <ActivityIndicator
            size="large"
            color="#06B6D4"
            style={{ marginTop: 20 }}
          />
        ) : filteredExpenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              No records found for {selectedPG.name} in {selectedMonth}
            </Text>
          </View>
        ) : (
          filteredExpenses.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                selectedPG.id !== null && styles.cardSeparate
              ]}
              onPress={() => {
                setSelectedExpense(item);
                setDetailModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <View style={styles.iconContainer}>
                  {/* Dynamically assign icon based on category */}
                  <Ionicons name={getCategoryIcon(item.category) as any} size={20} color="#06B6D4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseTitle}>{item.title}</Text>
                  <Text style={styles.expenseCategory}>
                    {item.category} • {item.date}
                  </Text>
                  {selectedPG.id === null && (
                    <Text style={styles.branchSubTag}>
                      {pgBranches.find((b) => b.id === item.flatId)?.name ||
                        item.flatId}
                    </Text>
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
                    {selectedPG.name}
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

      {/* Detail Modal */}
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
                        {pgBranches.find((b) => b.id === selectedExpense.flatId)
                          ?.name || "Common Expense"}
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
                      onPress={() =>
                        confirmAndDeleteExpense(
                          selectedExpense.id,
                          selectedExpense.title,
                        )
                      }
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
