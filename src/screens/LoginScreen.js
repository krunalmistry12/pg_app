import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    console.log(email, password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topSection}>
        <Text style={styles.logo}>🏠</Text>

        <Text style={styles.title}>PG Management</Text>

        <Text style={styles.subtitle}>
          Manage Rooms, Beds & Tenants Easily
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.loginText}>Login</Text>

        <TextInput
          placeholder="Enter Email"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Enter Password"
          placeholderTextColor="#999"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Secure PG & Tenant Management System
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
  },

  topSection: {
    alignItems: "center",
    marginBottom: 40,
  },

  logo: {
    fontSize: 60,
    marginBottom: 10,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },

  subtitle: {
    color: "#CBD5E1",
    marginTop: 10,
    fontSize: 15,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
  },

  loginText: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#111827",
  },

  input: {
    backgroundColor: "#F1F5F9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },

  buttonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  footerText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 20,
    fontSize: 13,
  },
});