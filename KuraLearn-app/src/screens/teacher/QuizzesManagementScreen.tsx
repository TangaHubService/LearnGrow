import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { teacherApi } from "../../services/api";

interface QuizItem {
  id: string;
  title: string;
  subjectId?: string;
  questionCount?: number;
  status?: string;
  assignedClasses?: number;
}

export function QuizzesManagementScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.quizzes()
      .then((res) => setQuizzes(res.data.quizzes ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quizzes</Text>
        <Text style={styles.subtitle}>{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}</Text>
      </View>

      {quizzes.length === 0 && (
        <Text style={styles.emptyText}>No quizzes created yet. Use AI to generate one!</Text>
      )}

      <View style={styles.list}>
        {quizzes.map((quiz) => (
          <View key={quiz.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: quiz.status === "PUBLISHED" ? "#d1fae5" : "#fef3c7" },
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: quiz.status === "PUBLISHED" ? "#10b981" : "#f59e0b" },
                ]}>
                  {quiz.status ?? "DRAFT"}
                </Text>
              </View>
            </View>
            <View style={styles.cardMeta}>
              {quiz.questionCount !== undefined && (
                <Text style={styles.metaItem}>{quiz.questionCount} questions</Text>
              )}
              {quiz.assignedClasses !== undefined && (
                <Text style={styles.metaItem}>{quiz.assignedClasses} classes</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.aiButton}
        onPress={() => navigation.navigate("AICopilot")}
      >
        <Text style={styles.aiButtonText}>🤖 Generate Quiz with AI</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f8fb" },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  list: { paddingHorizontal: 24, gap: 10, paddingBottom: 12 },
  card: {
    backgroundColor: "white", borderRadius: 14, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  quizTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardMeta: { flexDirection: "row", gap: 16, marginTop: 8 },
  metaItem: { fontSize: 12, color: "#64748b" },
  aiButton: {
    marginHorizontal: 24, marginBottom: 48, backgroundColor: "#eef2ff",
    borderRadius: 14, padding: 16, alignItems: "center",
    borderWidth: 1.5, borderColor: "#4f46e5",
  },
  aiButtonText: { color: "#4f46e5", fontSize: 16, fontWeight: "700" },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
