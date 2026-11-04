import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { teacherApi } from "../../services/api";

interface LessonItem {
  id: string;
  title: string;
  courseId?: string;
  order?: number;
  status?: string;
  estimatedMinutes?: number;
}

export function LessonsManagementScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.lessons()
      .then((res) => setLessons(res.data.lessons ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handlePublish(id: string) {
    try {
      await teacherApi.publishLesson(id);
      setLessons((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "PUBLISHED" } : l))
      );
    } catch {}
  }

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
        <Text style={styles.title}>Lesson Plans</Text>
        <Text style={styles.subtitle}>{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</Text>
      </View>

      {lessons.length === 0 && (
        <Text style={styles.emptyText}>No lessons created yet. Use AI Copilot to create one!</Text>
      )}

      <View style={styles.list}>
        {lessons.map((lesson) => (
          <View key={lesson.id} style={styles.card}>
            <View style={styles.cardHeader}>
              {lesson.order && <Text style={styles.orderBadge}>#{lesson.order}</Text>}
              <View style={[styles.statusBadge, {
                backgroundColor: lesson.status === "PUBLISHED" ? "#d1fae5" : "#fef3c7",
              }]}>
                <Text style={[styles.statusText, {
                  color: lesson.status === "PUBLISHED" ? "#10b981" : "#f59e0b",
                }]}>
                  {lesson.status ?? "DRAFT"}
                </Text>
              </View>
            </View>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            {lesson.estimatedMinutes && (
              <Text style={styles.lessonMeta}>{lesson.estimatedMinutes} min</Text>
            )}
            {lesson.status !== "PUBLISHED" && (
              <TouchableOpacity
                style={styles.publishButton}
                onPress={() => handlePublish(lesson.id)}
              >
                <Text style={styles.publishText}>Publish</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.aiButton}
        onPress={() => navigation.navigate("AICopilot")}
      >
        <Text style={styles.aiButtonText}>🤖 Create Lesson with AI</Text>
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  orderBadge: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  lessonTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  lessonMeta: { fontSize: 13, color: "#64748b", marginTop: 4 },
  publishButton: {
    marginTop: 10, backgroundColor: "#10b981", borderRadius: 8,
    paddingVertical: 8, alignItems: "center",
  },
  publishText: { color: "white", fontSize: 13, fontWeight: "700" },
  aiButton: {
    marginHorizontal: 24, marginBottom: 48, backgroundColor: "#eef2ff",
    borderRadius: 14, padding: 16, alignItems: "center",
    borderWidth: 1.5, borderColor: "#4f46e5",
  },
  aiButtonText: { color: "#4f46e5", fontSize: 16, fontWeight: "700" },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
