import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { aiApi } from "../../services/api";

type CopilotFeature = "lesson-plan" | "quiz" | "risk-analysis" | "report";

const features: { key: CopilotFeature; icon: string; label: string; desc: string }[] = [
  { key: "lesson-plan", icon: "📝", label: "Lesson Plan", desc: "Generate a lesson plan with AI" },
  { key: "quiz", icon: "❓", label: "Quiz Generator", desc: "Create quizzes on any topic" },
  { key: "risk-analysis", icon: "⚠️", label: "Risk Analysis", desc: "Identify at-risk students" },
  { key: "report", icon: "📊", label: "Report Summary", desc: "Generate class performance reports" },
];

export function AICopilotScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [selectedFeature, setSelectedFeature] = useState<CopilotFeature | null>(null);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [duration, setDuration] = useState("40");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) {
      Alert.alert("Input Required", "Please enter a topic");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      let res;
      switch (selectedFeature) {
        case "lesson-plan":
          res = await aiApi.lessonPlan(topic, level || "Primary", parseInt(duration) || 40);
          break;
        case "quiz":
          res = await aiApi.quizGenerate("", topic, 5);
          break;
        case "risk-analysis":
          res = await aiApi.studentRisk(topic);
          break;
        case "report":
          res = await aiApi.reportSummary(topic, "term1");
          break;
        default:
          return;
      }
      setResult(res.data.output ?? res.data.reply ?? JSON.stringify(res.data, null, 2));
    } catch {
      Alert.alert("Error", "AI generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🤖 AI Copilot</Text>
        <Text style={styles.subtitle}>Your teaching assistant powered by AI</Text>
      </View>

      {!selectedFeature ? (
        <View style={styles.featureGrid}>
          {features.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={styles.featureCard}
              onPress={() => setSelectedFeature(f.key)}
            >
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.form}>
          <TouchableOpacity onPress={() => { setSelectedFeature(null); setResult(null); }}>
            <Text style={styles.backLink}>‹ Change feature</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>
            {features.find((f) => f.key === selectedFeature)?.label}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Topic or class ID"
            placeholderTextColor="#94a3b8"
            value={topic}
            onChangeText={setTopic}
          />

          {selectedFeature === "lesson-plan" && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Level (e.g. Primary, Grade 4)"
                placeholderTextColor="#94a3b8"
                value={level}
                onChangeText={setLevel}
              />
              <TextInput
                style={styles.input}
                placeholder="Duration in minutes"
                placeholderTextColor="#94a3b8"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.generateButton, loading && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.generateText}>Generate with AI</Text>
            )}
          </TouchableOpacity>

          {result && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>AI Output</Text>
              <Text style={styles.resultText}>{result}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  header: { padding: 24, paddingTop: 60 },
  backArrow: { fontSize: 16, color: "#4f46e5", fontWeight: "600", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  featureGrid: {
    flexDirection: "row", flexWrap: "wrap", padding: 24, paddingTop: 8, gap: 12,
  },
  featureCard: {
    width: "47%", backgroundColor: "white", borderRadius: 16, padding: 24,
    alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  featureIcon: { fontSize: 36, marginBottom: 8 },
  featureLabel: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  featureDesc: { fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 4, lineHeight: 16 },
  form: { padding: 24, paddingTop: 0, gap: 12 },
  backLink: { fontSize: 14, color: "#4f46e5", fontWeight: "600", marginBottom: 4 },
  formTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  input: {
    backgroundColor: "white", borderRadius: 12, padding: 14, fontSize: 15,
    borderWidth: 1, borderColor: "#e2e8f0", color: "#1F2937",
  },
  generateButton: {
    backgroundColor: "#4f46e5", borderRadius: 12, padding: 16, alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  generateText: { color: "white", fontSize: 16, fontWeight: "700" },
  resultBox: {
    backgroundColor: "white", borderRadius: 12, padding: 16,
    borderLeftWidth: 3, borderLeftColor: "#4f46e5",
  },
  resultLabel: { fontSize: 13, fontWeight: "700", color: "#4f46e5", marginBottom: 8 },
  resultText: { fontSize: 14, color: "#1F2937", lineHeight: 22 },
});
