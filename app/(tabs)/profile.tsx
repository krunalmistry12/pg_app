import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const logout = async () => {

  await AsyncStorage.removeItem(
    "isLoggedIn"
  );

  router.replace("/login");
};
export default function Profile() {
  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>K</Text>
        </View>

        <Text style={styles.name}>
          Kunal Mistry
        </Text>

        <Text style={styles.role}>
          PG Owner
        </Text>

        <Text style={styles.pg}>
          Kunal PG • Ahmedabad
        </Text>
      </View>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>
          🏠 Manage PG
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>
          👥 Manage Tenants
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>
          ⚙️ Settings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>
          📞 Support
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={logout}
        style={[styles.menuItem, styles.logout]}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 20,
  },

  profileCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,marginTop :30,
    alignItems: "center",
    marginBottom: 25,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  avatarText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
  },

  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },

  role: {
    color: "#94A3B8",
    marginTop: 5,
  },

  pg: {
    color: "#94A3B8",
    marginTop: 10,
  },

  menuItem: {
    backgroundColor: "#1E293B",
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
  },

  menuText: {
    color: "#fff",
    fontSize: 16,
  },

  logout: {
    marginTop: 20,
    backgroundColor: "#7F1D1D",
  },

  logoutText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});