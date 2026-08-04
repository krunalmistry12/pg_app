import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import TenantDashboard from "./TenantDashboard";

export default function HomeScreen() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // AsyncStorage se saved role nikalna
    AsyncStorage.getItem("userRole").then((savedRole) => {
      setRole(savedRole);
    });
  }, []);

  // Conditional Rendering / Calling Component
  if (role === "User") {
    return <TenantDashboard />; // 👈 Yahan call hoga
  }
}
