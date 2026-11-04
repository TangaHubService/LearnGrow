import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { teacherApi } from "../../services/api";

interface ReportSummary {
  totalStudents?: number;
  averageAttendance?: number;
  averageScore?: number;
  atRiskCount?: number;
  subjectPerformance?: Array<{
    subject: string;
    averageScore: number;
    studentCount: number;
  }>;
}

export function ReportsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [data, setData] = useState<ReportSummary>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.reports()
      .then((res) => setData(res.data.report ?? res.data))
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
        <Text style={styles.title}>Reports</Text>
      </View>

      <View style={styles.statsRow}>
        {data.totalStudents !== undefined && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data.totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        )}
        {data.averageAttendance !== undefined && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(data.averageAttendance)}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
        )}
        {data.averageScore !== undefined && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(data.averageScore)}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        )}
        {data.atRiskCount !== undefined && (
          <View style={[styles.statCard, styles.riskCard]}>
            <Text style={styles.riskValue}>{data.atRiskCount}</Text>
            <Text style={styles.riskLabel}>At Risk</Text>
          </View>
        )}
      </View>

      {data.subjectPerformance && data.subjectPerformance.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Subject Performance</Text>
          {data.subjectPerformance.map((subj) => (
            <View key={subj.subject} style={styles.subjectRow}>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subj.subject}</Text>
                <Text style={styles.subjectCount}>{subj.studentCount} students</Text>
              </View>
              <View style={styles.scoreBarBg}>
                <View
                  style={[
                    styles.scoreBarFill,
                    {
                      width: `${Math.min(subj.averageScore, 100)}%`,
                      backgroundColor: subj.averageScore >= 50 ? "#10b981" : "#ef4444",
                    },
                  ]}
                />
              </View>
              <Text style={styles.scoreText}>{Math.round(subj.averageScore)}%</Text>
            </View>
          ))}
        </>
      )}

      {!data.subjectPerformance && !data.totalStudents && (
        <Text style={styles.emptyText}>Report data will appear here</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f8fb" },
  header: { padding: 24, paddingTop: 60 },
  backArrow: { fontSize: 16, color: "#4f46e5", fontWeight: "600", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  statsRow: { flexDirection: "row", flexWrap: "wrap", padding: 24, paddingTop: 8, gap: 8 },
  statCard: {
    width: "48%", backgroundColor: "white", borderRadius: 14, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  statValue: { fontSize: 28, fontWeight: "800", color: "#1F2937" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  riskCard: { backgroundColor: "#fef2f2" },
  riskValue: { fontSize: 28, fontWeight: "800", color: "#ef4444" },
  riskLabel: { fontSize: 12, color: "#ef4444", marginTop: 4 },
  sectionTitle: {
    fontSize: 18, fontWeight: "700", color: "#1F2937",
    paddingHorizontal: 24, marginBottom: 10,
  },
  subjectRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "white", marginHorizontal: 24, marginBottom: 8,
    borderRadius: 12, padding: 14, gap: 12,
  },
  subjectInfo: { width: 100 },
  subjectName: { fontSize: 13, fontWeight: "600", color: "#1F2937" },
  subjectCount: { fontSize: 11, color: "#64748b", marginTop: 1 },
  scoreBarBg: {
    flex: 1, height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden",
  },
  scoreBarFill: { height: "100%", borderRadius: 4 },
  scoreText: { fontSize: 14, fontWeight: "700", color: "#1F2937", width: 40, textAlign: "right" },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
