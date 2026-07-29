import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
const rooms = [
  {
    id: 1,
    roomNo: "101",
    availableBeds: [
      { id: 1, bedNo: "A4", rent: 6500 },
    ],
  },
  {
    id: 2,
    roomNo: "201",
    availableBeds: [
      { id: 2, bedNo: "A2", rent: 7000 },
      { id: 3, bedNo: "A3", rent: 7000 },
    ],
  },
];

export default function AddTenantScreen() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [selectedRoom, setSelectedRoom] =
    useState<any>(null);

  const [selectedBed, setSelectedBed] =
    useState<any>(null);

  const handleCreateTenant = async () => {
  if (!name.trim()) {
    Alert.alert("Validation", "Enter Name");
    return;
  }

  if (!phone.trim()) {
    Alert.alert("Validation", "Enter Phone");
    return;
  }

  if (!selectedRoom) {
    Alert.alert("Validation", "Select Room");
    return;
  }

  if (!selectedBed) {
    Alert.alert("Validation", "Select Bed");
    return;
  }

  const newTenant = {
    id: Date.now().toString(),
    name,
    phone,
    room: selectedRoom.roomNo,
    bed: selectedBed.bedNo,
    status: "Active",
  };

  const existing =
    await AsyncStorage.getItem(
      "tenants"
    );

  const tenants = existing
    ? JSON.parse(existing)
    : [];

  tenants.push(newTenant);

  await AsyncStorage.setItem(
    "tenants",
    JSON.stringify(tenants)
  );

  Alert.alert(
    "Success",
    "Tenant Created Successfully"
  );

  router.back();
};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Add Tenant
      </Text>

      <Text style={styles.label}>
        Full Name
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Rahul Sharma"
        placeholderTextColor="#94A3B8"
      />

      <Text style={styles.label}>
        Phone Number
      </Text>

      <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
        placeholder="9876543210"
        placeholderTextColor="#94A3B8"
      />

      <Text style={styles.label}>
        Room
      </Text>

      <View style={styles.dropdown}>
        <Picker
          selectedValue={selectedRoom}
          onValueChange={(value) => {
            setSelectedRoom(value);
            setSelectedBed(null);
          }}
        >
          <Picker.Item
            label="Select Room"
            value={null}
          />

          {rooms.map((room) => (
            <Picker.Item
              key={room.id}
              label={`Room ${room.roomNo} (${room.availableBeds.length} Beds Available)`}
              value={room}
            />
          ))}
        </Picker>
      </View>

      {selectedRoom && (
        <>
          <Text style={styles.label}>
            Bed
          </Text>

          <View style={styles.dropdown}>
            <Picker
              selectedValue={selectedBed}
              onValueChange={(value) =>
                setSelectedBed(value)
              }
            >
              <Picker.Item
                label="Select Bed"
                value={null}
              />

              {selectedRoom.availableBeds.map(
                (bed: any) => (
                  <Picker.Item
                    key={bed.id}
                    label={bed.bedNo}
                    value={bed}
                  />
                )
              )}
            </Picker>
          </View>
        </>
      )}

      {selectedBed && (
        <View style={styles.rentCard}>
          <Text style={styles.rentTitle}>
            Rent Amount
          </Text>

          <Text style={styles.rentAmount}>
            ₹{selectedBed.rent}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateTenant}
      >
        <Text style={styles.buttonText}>
          Create Tenant
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 20,
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 25,
  },

  label: {
    color: "#CBD5E1",
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    backgroundColor: "#1E293B",
    color: "#fff",
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 55,
  },

  dropdown: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    overflow: "hidden",
  },

  rentCard: {
    backgroundColor: "#2563EB",
    borderRadius: 20,
    padding: 20,
    marginTop: 25,
  },

  rentTitle: {
    color: "#DBEAFE",
  },

  rentAmount: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 10,
  },

  button: {
    backgroundColor: "#2563EB",
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },

  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
});