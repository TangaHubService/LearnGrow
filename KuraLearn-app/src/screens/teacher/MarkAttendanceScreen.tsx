import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { teacherApi } from "../../services/api";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface StudentRecord {
  id: string;
  name: string;
  status: AttendanceStatus;
}

const STATUS_OPTIONS: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

const statusColors: Record<AttendanceStatus, string> = {
  PRESENT: "#10b981",
  ABSENT: "#ef4444",
  LATE: "#f59e0b",
  EXCUSED: "#64748b",
};

export function MarkAttendanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: { classId: string; className: string } }>>();
  const { classId, className } = route.params;
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    teacherApi.students(classId)
      .then((res) => {
        const raw = res.data.students ?? res.data;
        const mapped: StudentRecord[] = raw.map((s: any) => ({
          id: s.id,
          name: s.name ?? s.user?.name ?? "Unknown",
          status: "PRESENT",
        }));
        setStudents(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classId]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        status: s.status,
      }));
      await teacherApi.markAttendance({
        classId,
        date: new Date().toISOString().split("T")[0],
        records,
      });
      Alert.alert("Success", "Attendance recorded!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to record attendance");
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mark Attendance</Text>
        <Text style={styles.subtitle}>
          {className} · {new Date().toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric",
          })}
        </Text>
      </View>

      <View style={styles.legend}>
        {STATUS_OPTIONS.map((status) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: statusColors[status] }]} />
            <Text style={styles.legendText}>{status}</Text>
          </View>
        ))}
      </View>

      <View style={styles.list}>
        {students.map((student) => (
          <View key={student.id} style={styles.studentRow}>
            <Text style={styles.studentName}>{student.name}</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusChip,
                    student.status === status && { backgroundColor: statusColors[status], borderColor: statusColors[status] },
                  ]}
                  onPress={() => setStatus(student.id, status)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      student.status === status ? styles.statusTextActive : { color: statusColors[status] },
                    ]}
                  >
                    {status === "PRESENT" ? "P" : status === "ABSENT" ? "A" : status === "LATE" ? "L" : "E"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? "Saving..." : "Save Attendance"}
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
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  legend: {
    flexDirection: "row", padding: 24, paddingTop: 8, gap: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#64748b" },
  list: { paddingHorizontal: 24, gap: 8, paddingBottom: 12 },
  studentRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "white", borderRadius: 12, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  studentName: { fontSize: 15, fontWeight: "600", color: "#1F2937", flex: 1 },
  statusRow: { flexDirection: "row", gap: 6 },
  statusChip: {
    width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "white",
  },
  statusText: { fontSize: 12, fontWeight: "800" },
  statusTextActive: { color: "white" },
  footer: { padding: 24, paddingBottom: 48 },
  submitButton: {
    backgroundColor: "#4f46e5", borderRadius: 14, padding: 16, alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  submitText: { color: "white", fontSize: 17, fontWeight: "700" },
});
