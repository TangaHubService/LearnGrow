import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.emoji}>📚</Text>
        <Text style={styles.title}>KuraLearn</Text>
        <Text style={styles.tagline}>
          Empowering Rwandan students with interactive, AI-powered learning
        </Text>
      </View>

      <View style={styles.featuresSection}>
        <FeatureItem icon="🧠" text="AI Tutor that speaks Kinyarwanda & English" />
        <FeatureItem icon="📖" text="Interactive lessons & quizzes" />
        <FeatureItem icon="📊" text="Track your progress & rewards" />
        <FeatureItem icon="👨‍🏫" text="Built for students, teachers & parents" />
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.replace("Login")}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f8fb",
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 48,
  },
  topSection: { alignItems: "center" },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 40, fontWeight: "800", color: "#4f46e5" },
  tagline: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  featuresSection: { gap: 16 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIcon: { fontSize: 24, marginRight: 14 },
  featureText: { fontSize: 15, color: "#1F2937", flex: 1, lineHeight: 22 },
  bottomSection: { gap: 12 },
  primaryButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
  },
  primaryButtonText: { color: "white", fontSize: 18, fontWeight: "700" },
  secondaryButton: {
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  secondaryButtonText: { color: "#4f46e5", fontSize: 16, fontWeight: "600" },
});
