import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { studentApi } from "../../services/api";

interface AttendanceRecord {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  subject?: string;
}

interface AttendanceData {
  records?: AttendanceRecord[];
  rate?: number;
  total?: number;
  present?: number;
}

const statusColors: Record<string, string> = {
  PRESENT: "#10b981",
  ABSENT: "#ef4444",
  LATE: "#f59e0b",
  EXCUSED: "#64748b",
};

export function AttendanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [data, setData] = useState<AttendanceData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.attendance()
      .then((res) => setData(res.data.attendance ?? res.data))
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Attendance</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.rate ?? 0}%</Text>
          <Text style={styles.statLabel}>Attendance Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.present ?? 0}</Text>
          <Text style={styles.statLabel}>Days Present</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.total ?? 0}</Text>
          <Text style={styles.statLabel}>Total Days</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Records</Text>
      {(!data.records || data.records.length === 0) && (
        <Text style={styles.emptyText}>No attendance records</Text>
      )}
      {data.records?.map((record) => (
        <View key={record.id} style={styles.recordRow}>
          <View style={styles.recordLeft}>
            <Text style={styles.recordDate}>
              {new Date(record.date).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric",
              })}
            </Text>
            {record.subject && (
              <Text style={styles.recordSubject}>{record.subject}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[record.status] + "20" }]}>
            <Text style={[styles.statusText, { color: statusColors[record.status] }]}>
              {record.status}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f8fb" },
  header: { padding: 24, paddingTop: 60 },
  backArrow: { fontSize: 16, color: "#4f46e5", fontWeight: "600", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  statsRow: { flexDirection: "row", padding: 24, paddingTop: 8, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: "white", borderRadius: 14, padding: 14, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#4f46e5" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 4, textAlign: "center" },
  sectionTitle: {
    fontSize: 18, fontWeight: "700", color: "#1F2937",
    paddingHorizontal: 24, marginBottom: 10,
  },
  recordRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "white", marginHorizontal: 24, marginBottom: 8,
    borderRadius: 12, padding: 16,
  },
  recordLeft: { flex: 1 },
  recordDate: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  recordSubject: { fontSize: 12, color: "#64748b", marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700" },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 24, fontSize: 15 },
});
