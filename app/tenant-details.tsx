import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ScrollView } from "react-native";
import { router, useLocalSearchParams }
from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage
from "@react-native-async-storage/async-storage";

export default function TenantDetails() {
const {
  id,
  name = "Rahul Sharma",
  phone = "9876543210",
  room = "101",
  bed = "A1",
  status = "Active",
} = useLocalSearchParams();

const initials = String(name)
  .split(" ")
  .map((x) => x[0])
  .join("")
  .substring(0, 2)
  .toUpperCase();

  const handleDelete = async () => {

    Alert.alert(
      "Delete Tenant",
      "Are you sure you want to delete this tenant?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {

            const data =
              await AsyncStorage.getItem(
                "tenants"
              );

            const tenants = data
              ? JSON.parse(data)
              : [];

            const updated =
              tenants.filter(
                (t: any) =>
                  t.id !== id
              );

            await AsyncStorage.setItem(
              "tenants",
              JSON.stringify(updated)
            );

            Alert.alert(
              "Success",
              "Tenant Deleted"
            );

            router.back();
          },
        },
      ]
    );
  };

  return (
   <View style={styles.container}>

  {/* Header */}

  <View style={styles.header}>
    <TouchableOpacity
      style={styles.iconBtn}
      onPress={() => router.back()}
    >
      <Ionicons
        name="chevron-back"
        size={24}
        color="#fff"
      />
    </TouchableOpacity>

    <Text style={styles.headerTitle}>
      Tenant Profile
    </Text>

    <TouchableOpacity
      style={styles.iconBtn}
    >
      <Ionicons
        name="ellipsis-vertical"
        size={20}
        color="#fff"
      />
    </TouchableOpacity>
  </View>

  {/* Profile */}

  <View style={styles.profileCard}>

    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {initials}
      </Text>
    </View>

    <Text style={styles.name}>
      {name}
    </Text>

    <Text style={styles.subtitle}>
      Room {room} • Bed {bed}
    </Text>

    <View style={styles.statusBadge}>
      <Text style={styles.statusText}>
        {status}
      </Text>
    </View>

  </View>

  {/* Room Card */}

  <View style={styles.card}>
    <Text style={styles.cardTitle}>
      Room Information
    </Text>

    <View style={styles.row}>
      <Ionicons
        name="home-outline"
        size={20}
        color="#60A5FA"
      />
      <Text style={styles.rowText}>
        Room {room}
      </Text>
    </View>

    <View style={styles.row}>
      <Ionicons
        name="bed-outline"
        size={20}
        color="#60A5FA"
      />
      <Text style={styles.rowText}>
        Bed {bed}
      </Text>
    </View>

    <View style={styles.row}>
      <Ionicons
        name="cash-outline"
        size={20}
        color="#22C55E"
      />
      <Text style={styles.rowText}>
        ₹6500 / Month
      </Text>
    </View>
  </View>

  {/* Contact */}

  <View style={styles.card}>
    <Text style={styles.cardTitle}>
      Contact Information
    </Text>

    <View style={styles.row}>
      <Ionicons
        name="call-outline"
        size={20}
        color="#22C55E"
      />
      <Text style={styles.rowText}>
        {phone}
      </Text>
    </View>

    <View style={styles.row}>
      <Ionicons
        name="mail-outline"
        size={20}
        color="#F59E0B"
      />
      <Text style={styles.rowText}>
        tenant@email.com
      </Text>
    </View>
  </View>

  {/* Actions */}

  <TouchableOpacity
    style={styles.editButton}
  >
    <Ionicons
      name="create-outline"
      size={20}
      color="#fff"
    />

    <Text style={styles.btnText}>
      Edit Tenant
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.deleteButton}
    onPress={handleDelete}
  >
    <Ionicons
      name="trash-outline"
      size={20}
      color="#fff"
    />

    <Text style={styles.btnText}>
      Delete Tenant
    </Text>
  </TouchableOpacity>

</View>
  );
}

const styles = StyleSheet.create({

container: {
  flex: 1,
  backgroundColor: "#0F172A",
  paddingHorizontal: 20,
},

header: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 55,
  marginBottom: 20,
},

iconBtn: {
  width: 42,
  height: 42,
  borderRadius: 12,
  backgroundColor: "#1E293B",
  justifyContent: "center",
  alignItems: "center",
},

headerTitle: {
  color: "#fff",
  fontSize: 22,
  fontWeight: "700",
},

profileCard: {
  backgroundColor: "#1E293B",
  borderRadius: 24,
  padding: 24,
  alignItems: "center",
},

avatar: {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: "#2563EB",
  justifyContent: "center",
  alignItems: "center",
},

avatarText: {
  color: "#fff",
  fontSize: 28,
  fontWeight: "bold",
},

name: {
  color: "#fff",
  fontSize: 24,
  fontWeight: "700",
  marginTop: 15,
},

subtitle: {
  color: "#94A3B8",
  marginTop: 4,
},

statusBadge: {
  backgroundColor: "#166534",
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 20,
  marginTop: 12,
},

statusText: {
  color: "#fff",
  fontWeight: "600",
},

card: {
  backgroundColor: "#1E293B",
  borderRadius: 18,
  padding: 18,
  marginTop: 14,
},

cardTitle: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 15,
},

row: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 14,
},

rowText: {
  color: "#fff",
  fontSize: 16,
  marginLeft: 12,
},

editButton: {
  backgroundColor: "#2563EB",
  height: 55,
  borderRadius: 14,
  marginTop: 20,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
},

deleteButton: {
  backgroundColor: "#DC2626",
  height: 55,
  borderRadius: 14,
  marginTop: 12,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
},

btnText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 16,
  marginLeft: 8,
},

});