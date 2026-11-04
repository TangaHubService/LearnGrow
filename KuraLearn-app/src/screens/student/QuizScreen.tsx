import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { learningApi } from "../../services/api";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctIndex?: number;
}

interface QuizData {
  id: string;
  title: string;
  questions: Question[];
  timeLimit?: number;
}

export function QuizScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: { quizId: string; lessonTitle?: string } }>>();
  const { quizId, lessonTitle } = route.params;
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    learningApi.quiz(quizId)
      .then((res) => setQuiz(res.data.quiz ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [quizId]);

  function selectOption(questionId: string, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  async function handleSubmit() {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      Alert.alert(
        "Incomplete",
        `You have ${unanswered.length} unanswered question${unanswered.length > 1 ? "s" : ""}. Submit anyway?`,
        [
          { text: "Review", style: "cancel" },
          { text: "Submit", onPress: submitQuiz },
        ]
      );
    } else {
      submitQuiz();
    }
  }

  async function submitQuiz() {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const formatted = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedIndex: answers[q.id] ?? -1,
      }));
      const { data } = await learningApi.submitQuiz(quizId, formatted);
      navigation.replace("QuizResult", {
        attemptId: data.attemptId ?? data.id,
        quizTitle: quiz.title,
      });
    } catch {
      Alert.alert("Error", "Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Quiz not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{quiz.title}</Text>
        {lessonTitle && <Text style={styles.subtitle}>{lessonTitle}</Text>}
        <Text style={styles.meta}>
          {quiz.questions.length} questions
          {quiz.timeLimit ? ` · ${quiz.timeLimit} min` : ""}
        </Text>
      </View>

      {quiz.questions.map((question, idx) => (
        <View key={question.id} style={styles.questionCard}>
          <Text style={styles.questionNumber}>Question {idx + 1}</Text>
          <Text style={styles.questionText}>{question.questionText}</Text>
          <View style={styles.options}>
            {question.options.map((option, optIdx) => (
              <TouchableOpacity
                key={optIdx}
                style={[
                  styles.option,
                  answers[question.id] === optIdx && styles.optionSelected,
                ]}
                onPress={() => selectOption(question.id, optIdx)}
              >
                <Text
                  style={[
                    styles.optionLetter,
                    answers[question.id] === optIdx && styles.optionLetterSelected,
                  ]}
                >
                  {String.fromCharCode(65 + optIdx)}
                </Text>
                <Text
                  style={[
                    styles.optionText,
                    answers[question.id] === optIdx && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f8fb" },
  header: { padding: 24, paddingTop: 60 },
  backArrow: { fontSize: 16, color: "#4f46e5", fontWeight: "600", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: "#1F2937" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 2 },
  meta: { fontSize: 13, color: "#94a3b8", marginTop: 6 },
  questionCard: {
    backgroundColor: "white", margin: 24, marginBottom: 0, marginTop: 16,
    borderRadius: 14, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  questionNumber: { fontSize: 12, fontWeight: "700", color: "#4f46e5", textTransform: "uppercase" },
  questionText: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginTop: 6, lineHeight: 24 },
  options: { gap: 8, marginTop: 14 },
  option: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0",
  },
  optionSelected: { borderColor: "#4f46e5", backgroundColor: "#eef2ff" },
  optionLetter: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: "#f1f5f9",
    textAlign: "center", lineHeight: 26, fontSize: 13, fontWeight: "700",
    color: "#64748b", marginRight: 12,
  },
  optionLetterSelected: { backgroundColor: "#4f46e5", color: "white" },
  optionText: { fontSize: 15, color: "#1F2937", flex: 1 },
  optionTextSelected: { color: "#1F2937" },
  footer: { padding: 24, paddingBottom: 48 },
  submitButton: {
    backgroundColor: "#4f46e5", borderRadius: 14, padding: 16, alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  submitText: { color: "white", fontSize: 17, fontWeight: "700" },
  errorText: { fontSize: 16, color: "#ef4444" },
});
