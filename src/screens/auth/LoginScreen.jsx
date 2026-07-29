import React from "react";
import {
  View,
  Text,
  TouchableOpacity
} from "react-native";

export default function LoginScreen() {
  return (
    <View
      style={{
        flex:1,
        justifyContent:"center",
        alignItems:"center"
      }}
    >
      <Text>Login Screen</Text>

      <TouchableOpacity>
        <Text>Login</Text>
      </TouchableOpacity>
    </View>
  );
}