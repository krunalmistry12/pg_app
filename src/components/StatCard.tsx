import { View, Text } from "react-native";

export default function StatCard({
  title,
  value,
}: any) {
  return (
    <View
      style={{
        backgroundColor: "#1E293B",
        width: "48%",
        padding: 18,
        borderRadius: 20,
        marginBottom: 15,
      }}
    >
      <Text
        style={{
          color: "#94A3B8",
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          color: "#fff",
          fontSize: 28,
          fontWeight: "bold",
          marginTop: 8,
        }}
      >
        {value}
      </Text>
    </View>
  );
}