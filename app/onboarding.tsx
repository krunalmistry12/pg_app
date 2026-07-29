import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const slides = [
  {
    icon: "business",
    title: "Manage Your PG Effortlessly",
    description: "Track rooms, tenants and occupancy from a single dashboard.",
  },
  {
    icon: "cash",
    title: "Track Rent & Payments",
    description: "Monitor rent collection, pending dues and monthly income.",
  },
  {
    icon: "people",
    title: "Smart Tenant Management",
    description:
      "Add tenants, assign rooms and manage complete records easily.",
  },
];

export default function Onboarding() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const nextPage = () => {
    if (page < slides.length - 1) {
      const next = page + 1;

      scrollViewRef.current?.scrollTo({
        x: next * width,
        animated: true,
      });

      setPage(next);
    } else {
      router.replace("/login");
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentPage = Math.round(e.nativeEvent.contentOffset.x / width);

    if (currentPage !== page) {
      setPage(currentPage);
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

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={{ flex: 1 }}
      >
        {slides.map((item, index) => (
          <View key={index} style={styles.page}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={90} color="#fff" />
            </View>

            <Text style={styles.title}>{item.title}</Text>

            <Text style={styles.description}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, page === index && styles.activeDot]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={nextPage}>
          <Text style={styles.buttonText}>
            {page === slides.length - 1 ? "Get Started" : "Continue"}
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
    zIndex: 100,
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
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },

  description: {
    color: "#94A3B8",
    fontSize: 16,
    lineHeight: 25,
    textAlign: "center",
    marginTop: 20,
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
    width: "85%",
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
