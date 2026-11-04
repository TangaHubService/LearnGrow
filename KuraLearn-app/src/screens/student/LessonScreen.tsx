import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { studentApi } from "../../services/api";

interface LessonContent {
  id: string;
  title: string;
  body: string;
  contentType: string;
  estimatedMinutes: number;
  order: number;
  courseId: string;
  hasQuiz?: boolean;
  quizId?: string;
}

export function LessonScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: { courseId: string; courseTitle: string } }>>();
  const { courseId, courseTitle } = route.params;
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    studentApi.lesson(courseId)
      .then((res) => setLesson(res.data.lesson ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  async function handleComplete() {
    setCompleting(true);
    try {
      await studentApi.completeLesson(lesson!.id);
      Alert.alert("Great job!", "Lesson completed!");
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Failed to mark lesson as complete");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Lesson not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumb}>{courseTitle}</Text>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.meta}>
          Lesson {lesson.order} · {lesson.estimatedMinutes} min
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.bodyText}>{lesson.body}</Text>
      </View>

      <View style={styles.actions}>
        {lesson.hasQuiz && lesson.quizId && (
          <TouchableOpacity
            style={styles.quizButton}
            onPress={() => navigation.navigate("Quiz", { quizId: lesson.quizId, lessonTitle: lesson.title })}
          >
            <Text style={styles.quizButtonText}>Take Quiz</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.completeButton, completing && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={completing}
        >
          <Text style={styles.completeButtonText}>
            {completing ? "Completing..." : "Mark as Complete"}
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
  breadcrumb: { fontSize: 13, color: "#94a3b8", marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "800", color: "#1F2937" },
  meta: { fontSize: 13, color: "#64748b", marginTop: 6 },
  body: { backgroundColor: "white", margin: 24, borderRadius: 14, padding: 20 },
  bodyText: { fontSize: 16, color: "#1F2937", lineHeight: 26 },
  actions: { padding: 24, paddingTop: 0, gap: 12, paddingBottom: 40 },
  quizButton: {
    backgroundColor: "#eef2ff", borderRadius: 12, padding: 16, alignItems: "center",
    borderWidth: 1.5, borderColor: "#4f46e5",
  },
  quizButtonText: { color: "#4f46e5", fontSize: 16, fontWeight: "700" },
  completeButton: {
    backgroundColor: "#10b981", borderRadius: 12, padding: 16, alignItems: "center",
  },
  completeButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },
  errorText: { fontSize: 16, color: "#ef4444" },
});
