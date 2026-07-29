import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import PagerView from "react-native-pager-view";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

const slides = [
  {
    icon: "business",
    title: "Manage Your PG Effortlessly",
    description:
      "Track rooms, tenants and occupancy from a single dashboard.",
  },
  {
    icon: "cash",
    title: "Track Rent & Payments",
    description:
      "Monitor rent collection, pending dues and monthly income.",
  },
  {
    icon: "people",
    title: "Smart Tenant Management",
    description:
      "Add tenants, assign rooms and manage complete records easily.",
  },
];

export default function Onboarding() {
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);

  const nextPage = () => {
    if (page < slides.length - 1) {
      pagerRef.current?.setPage(page + 1);
    } else {
      router.replace("/login");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) =>
          setPage(e.nativeEvent.position)
        }
      >
        {slides.map((item, index) => (
          <View
            key={index}
            style={styles.page}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={item.icon as any}
                size={90}
                color="#fff"
              />
            </View>

            <Text style={styles.title}>
              {item.title}
            </Text>

            <Text style={styles.description}>
              {item.description}
            </Text>
          </View>
        ))}
      </PagerView>

      <View style={styles.bottomSection}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                page === i && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={nextPage}
        >
          <Text style={styles.buttonText}>
            {page === 2
              ? "Get Started"
              : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  skipBtn: {
    position: "absolute",
    right: 25,
    top: 60,
    zIndex: 10,
  },

  skipText: {
    color: "#60A5FA",
    fontSize: 16,
    fontWeight: "600",
  },

  page: {
    width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },

  description: {
    color: "#94A3B8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 25,
  },

  bottomSection: {
    paddingBottom: 60,
    alignItems: "center",
  },

  dots: {
    flexDirection: "row",
    marginBottom: 30,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#334155",
    marginHorizontal: 5,
  },

  activeDot: {
    width: 28,
    backgroundColor: "#2563EB",
  },

  button: {
    backgroundColor: "#2563EB",
    width: "85%",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});