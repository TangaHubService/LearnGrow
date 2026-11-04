import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { learningApi } from "../../services/api";

interface ResultData {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  answers?: Array<{
    questionText: string;
    correct: boolean;
    correctAnswer: string;
    yourAnswer: string;
  }>;
}

export function QuizResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: { attemptId: string; quizTitle: string } }>>();
  const { attemptId, quizTitle } = route.params;
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    learningApi.quizResults(attemptId)
      .then((res) => setResult(res.data.result ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const score = result ?? { score: 0, total: 0, percentage: 0, passed: false };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quiz Complete!</Text>
        <Text style={styles.subtitle}>{quizTitle}</Text>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreEmoji}>{score.passed ? "🎉" : "💪"}</Text>
        <Text style={styles.scoreValue}>
          {score.score}/{score.total}
        </Text>
        <Text style={styles.scorePercent}>{Math.round(score.percentage)}%</Text>
        <Text style={[styles.scoreLabel, score.passed ? styles.passed : styles.failed]}>
          {score.passed ? "Passed" : "Needs Improvement"}
        </Text>
      </View>

      {result?.answers && (
        <View style={styles.answersSection}>
          <Text style={styles.sectionTitle}>Review Answers</Text>
          {result.answers.map((ans, idx) => (
            <View key={idx} style={styles.answerCard}>
              <View style={styles.answerHeader}>
                <Text style={styles.answerNum}>Question {idx + 1}</Text>
                <Text style={[styles.answerStatus, ans.correct ? styles.correct : styles.incorrect]}>
                  {ans.correct ? "✓ Correct" : "✗ Incorrect"}
                </Text>
              </View>
              <Text style={styles.answerQuestion}>{ans.questionText}</Text>
              <Text style={styles.answerDetail}>Your answer: {ans.yourAnswer}</Text>
              {!ans.correct && (
                <Text style={styles.answerDetail}>Correct: {ans.correctAnswer}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryText}>Back to Lesson</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate("StudentDashboard")}
        >
          <Text style={styles.homeText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f8fb" },
  header: { padding: 24, paddingTop: 60, alignItems: "center" },
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  subtitle: { fontSize: 15, color: "#64748b", marginTop: 4 },
  scoreCard: {
    alignItems: "center", backgroundColor: "white", margin: 24, borderRadius: 20,
    padding: 32, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  scoreEmoji: { fontSize: 48, marginBottom: 8 },
  scoreValue: { fontSize: 42, fontWeight: "800", color: "#1F2937" },
  scorePercent: { fontSize: 18, color: "#64748b", marginTop: 4 },
  scoreLabel: { fontSize: 16, fontWeight: "700", marginTop: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, overflow: "hidden" },
  passed: { color: "#10b981", backgroundColor: "#d1fae5" },
  failed: { color: "#ef4444", backgroundColor: "#fee2e2" },
  answersSection: { padding: 24, paddingTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937", marginBottom: 12 },
  answerCard: {
    backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 10,
  },
  answerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  answerNum: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  answerStatus: { fontSize: 13, fontWeight: "600" },
  correct: { color: "#10b981" },
  incorrect: { color: "#ef4444" },
  answerQuestion: { fontSize: 15, color: "#1F2937", marginTop: 8, lineHeight: 22 },
  answerDetail: { fontSize: 13, color: "#64748b", marginTop: 4 },
  actions: { padding: 24, paddingTop: 0, gap: 10, paddingBottom: 48 },
  retryButton: {
    backgroundColor: "white", borderRadius: 12, padding: 16, alignItems: "center",
    borderWidth: 1.5, borderColor: "#4f46e5",
  },
  retryText: { color: "#4f46e5", fontSize: 16, fontWeight: "700" },
  homeButton: { backgroundColor: "#4f46e5", borderRadius: 12, padding: 16, alignItems: "center" },
  homeText: { color: "white", fontSize: 16, fontWeight: "700" },
});
