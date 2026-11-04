import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { studentApi } from "../../services/api";

interface Course {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessonCount?: number;
  progress?: number;
}

export function CoursesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: { subjectId: string; subjectName: string } }>>();
  const { subjectId, subjectName } = route.params;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.courses(subjectId)
      .then((res) => setCourses(res.data.courses ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjectId]);

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{subjectName}</Text>
        <Text style={styles.subtitle}>Courses & Units</Text>
      </View>

      {courses.length === 0 && (
        <Text style={styles.emptyText}>No courses available yet</Text>
      )}

      <View style={styles.list}>
        {courses.sort((a, b) => a.order - b.order).map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate("Lesson", { courseId: course.id, courseTitle: course.title })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.courseOrder}>Unit {course.order}</Text>
              {course.progress !== undefined && (
                <Text style={styles.progressBadge}>{course.progress}%</Text>
              )}
            </View>
            <Text style={styles.courseTitle}>{course.title}</Text>
            {course.description && (
              <Text style={styles.courseDesc} numberOfLines={2}>
                {course.description}
              </Text>
            )}
            {course.lessonCount !== undefined && (
              <Text style={styles.lessonCount}>{course.lessonCount} lessons</Text>
            )}
          </TouchableOpacity>
        ))}
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
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 8 },
  list: { paddingHorizontal: 24, gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: "white", borderRadius: 14, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
  },
  courseOrder: { fontSize: 13, fontWeight: "700", color: "#4f46e5", textTransform: "uppercase" },
  progressBadge: { fontSize: 12, fontWeight: "700", color: "#10b981" },
  courseTitle: { fontSize: 17, fontWeight: "700", color: "#1F2937", marginBottom: 4 },
  courseDesc: { fontSize: 14, color: "#64748b", lineHeight: 20, marginBottom: 6 },
  lessonCount: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
