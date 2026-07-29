import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../src/services/api";
import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const passwordRef = useRef<TextInput>(null);
const handleLogin = async () => {
  try {
    // setError("");

    // if (!username.trim()) {
    //   setError("Please enter username");
    //   return;
    // }

    // if (username.length < 3) {
    //   setError("Username must be at least 3 characters");
    //   return;
    // }

    // if (!password.trim()) {
    //   setError("Please enter password");
    //   return;
    // }

    // if (password.length < 3) {
    //   setError("Password must be at least 3 characters");
    //   return;
    // }

    // const response = await api.post(
    //   "/User/login",
    //   {
    //     name: username,
    //     password: password,
    //   }
    // );

    // const token = response.data.token;

    // await AsyncStorage.setItem(
    //   "token",
    //   token
    // );

    // await AsyncStorage.setItem(
    //   "isLoggedIn",
    //   "true"
    // );

    router.replace("/(tabs)");

  } catch (err: any) {
  console.log("FULL ERROR =>", err);
  console.log("MESSAGE =>", err?.message);
  console.log("RESPONSE =>", err?.response);

  setError(err?.message || "Login Failed");
}
};

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <Text style={styles.logo}>🏠</Text>

        <Text style={styles.title}>
          PG Manager
        </Text>

        <Text style={styles.subtitle}>
          Manage your PG smarter and faster
        </Text>
      </View>

      {/* Login Card */}

      <View style={styles.card}>
        <Text style={styles.welcome}>
          Welcome Back 👋
        </Text>

        <Text style={styles.cardSub}>
          Sign in to continue
        </Text>

        {/* Username */}

        <Text style={styles.label}>
          Username
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#64748B"
          />

          <TextInput
            placeholder="e.g. kunal_admin"
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            returnKeyType="next"
            onSubmitEditing={() =>
              passwordRef.current?.focus()
            }
          />
        </View>

        {/* Password */}

        <Text style={styles.label}>
          Password
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#64748B"
          />

          <TextInput
              ref={passwordRef}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

          <TouchableOpacity
            onPress={() =>
              setShowPassword(!showPassword)
            }
          >
            <Ionicons
              name={
                !showPassword
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              size={20}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>

        {/* Error Box */}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Login Button */}

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.loginText}>
            Login
          </Text>
        </TouchableOpacity>

        {/* Demo Login */}

        <View style={styles.demoBox}>
          <Text style={styles.demoText}>
            Demo Login: kunal / 123456
          </Text>
        </View>

        <Text style={styles.footer}>
          PG Management System v1.0
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  header: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    fontSize: 60,
  },

  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
    marginTop: 10,
  },

  subtitle: {
    color: "#94A3B8",
    marginTop: 8,
  },

  card: {
    flex: 0.6,
    backgroundColor: "#fff",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
  },

  welcome: {
    fontSize: 28,
    fontWeight: "bold",
  },

  cardSub: {
    color: "#64748B",
    marginBottom: 25,
    marginTop: 5,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 10,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 58,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    color: "#000",
  },

  errorBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },

  errorText: {
    color: "#DC2626",
    fontWeight: "600",
  },

  loginButton: {
    backgroundColor: "#2563EB",
    height: 58,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  loginText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  demoBox: {
    marginTop: 15,
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
  },

  demoText: {
    color: "#2563EB",
    textAlign: "center",
    fontWeight: "600",
  },

  footer: {
    textAlign: "center",
    marginTop: 20,
    color: "#94A3B8",
  },
});