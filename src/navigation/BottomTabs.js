import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import DashboardScreen from "../screens/DashboardScreen";
import TenantScreen from "../screens/TenantScreen";
import RoomScreen from "../screens/RoomScreen";
import RentScreen from "../screens/RentScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Tenants" component={TenantScreen} />
      <Tab.Screen name="Rooms" component={RoomScreen} />
      <Tab.Screen name="Rent" component={RentScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}