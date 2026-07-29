import React from "react";

import AuthNavigator from "./AuthNavigator";
import BottomTabs from "./BottomTabs";

const isLoggedIn = false;

export default function AppNavigator() {
  return isLoggedIn
    ? <BottomTabs />
    : <AuthNavigator />;
}