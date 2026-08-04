// src/utils/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

export interface DecodedToken {
  userId: string;
  name: string;
  email: string;
  role?: string; // e.g. "Admin" | "Tenant" | "Manager"
  exp: number;
}

// Token decode karke User Info nikalna
export const getUserFromToken = async (): Promise<DecodedToken | null> => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;

    const decoded = jwtDecode<DecodedToken>(token);

    // Expired check (Optional safety)
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      await AsyncStorage.multiRemove(["token", "isLoggedIn", "userRole"]);
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
};
