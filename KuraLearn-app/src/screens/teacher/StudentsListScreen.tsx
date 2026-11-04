import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { teacherApi } from "../../services/api";

interface Student {
  id: string;
  name?: string;
  studentCode?: string;
  email?: string;
  user?: { name: string; email: string };
}

export function StudentsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: { classId: string; className: string } }>>();
  const { classId, className } = route.params;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.students(classId)
      .then((res) => setStudents(res.data.students ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classId]);

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
        <Text style={styles.title}>{className}</Text>
        <Text style={styles.subtitle}>{students.length} student{students.length !== 1 ? "s" : ""}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.attendanceButton}
          onPress={() => navigation.navigate("MarkAttendance", { classId, className })}
        >
          <Text style={styles.attendanceText}>📋 Mark Attendance</Text>
        </TouchableOpacity>
      </View>

      {students.length === 0 && (
        <Text style={styles.emptyText}>No students in this class</Text>
      )}

      <View style={styles.list}>
        {students.map((student) => (
          <View key={student.id} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(student.name ?? student.user?.name ?? "?").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.studentName}>{student.name ?? student.user?.name}</Text>
              {(student.studentCode || student.email || student.user?.email) && (
                <Text style={styles.studentDetail}>
                  {student.studentCode ?? student.email ?? student.user?.email}
                </Text>
              )}
            </View>
          </View>
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
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  actions: { padding: 24, paddingTop: 8 },
  attendanceButton: {
    backgroundColor: "#eef2ff", borderRadius: 12, padding: 14, alignItems: "center",
    borderWidth: 1.5, borderColor: "#4f46e5",
  },
  attendanceText: { fontSize: 15, fontWeight: "700", color: "#4f46e5" },
  list: { paddingHorizontal: 24, gap: 8, paddingBottom: 24 },
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "white", borderRadius: 12, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#eef2ff",
    justifyContent: "center", alignItems: "center", marginRight: 14,
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: "#4f46e5" },
  cardContent: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  studentDetail: { fontSize: 12, color: "#64748b", marginTop: 2 },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
