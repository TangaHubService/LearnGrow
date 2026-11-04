import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../contexts/AuthContext";
import { studentApi } from "../../services/api";

interface DashboardData {
  recentSubjects?: Array<{ id: string; name: string; progress?: number }>;
  upcomingDeadlines?: Array<{ id: string; title: string; dueDate: string }>;
  attendanceRate?: number;
  averageGrade?: string;
}

const quickActions = [
  { icon: "📚", label: "Learn", screen: "Subjects", color: "#eef2ff" },
  { icon: "🤖", label: "AI Tutor", screen: "AITutor", color: "#faf5ff" },
  { icon: "📊", label: "My Marks", screen: "Marks", color: "#ecfdf5" },
  { icon: "📋", label: "Attendance", screen: "Attendance", color: "#fff7ed" },
  { icon: "🕐", label: "Timetable", screen: "Timetable", color: "#fef2f2" },
  { icon: "🔔", label: "Notifications", screen: "Notifications", color: "#f0f9ff" },
];

export function StudentDashboardScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.dashboard()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Muraho, {user?.name?.split(" ")[0]}</Text>
          <Text style={styles.role}>Student</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.attendanceRate ?? 0}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.averageGrade ?? "—"}</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.screen}
            style={[styles.actionCard, { backgroundColor: action.color }]}
            onPress={() => navigation.navigate(action.screen)}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
      {data.upcomingDeadlines?.length === 0 && (
        <Text style={styles.emptyText}>No upcoming deadlines</Text>
      )}
      {data.upcomingDeadlines?.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDate}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
        </View>
      ))}

      {(!data.upcomingDeadlines || data.upcomingDeadlines.length === 0) && (
        <Text style={styles.emptyText}>No upcoming deadlines</Text>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 24, paddingTop: 60,
  },
  greeting: { fontSize: 24, fontWeight: "700", color: "#1F2937" },
  role: { fontSize: 14, color: "#64748b", marginTop: 4 },
  logoutBtn: { padding: 8 },
  logoutText: { color: "#ef4444", fontWeight: "600" },
  statsRow: { flexDirection: "row", padding: 24, paddingTop: 0, gap: 12 },
  statCard: {
    flex: 1, backgroundColor: "white", borderRadius: 16,
    padding: 20, shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 10, elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: "800", color: "#4f46e5" },
  statLabel: { fontSize: 13, color: "#64748b", marginTop: 4 },
  sectionTitle: {
    fontSize: 18, fontWeight: "700", color: "#1F2937",
    paddingHorizontal: 24, marginBottom: 12,
  },
  quickActions: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 24, marginBottom: 20, gap: 10,
  },
  actionCard: {
    width: "30%", borderRadius: 14, padding: 16, alignItems: "center",
  },
  actionIcon: { fontSize: 26, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "#1F2937" },
  card: {
    backgroundColor: "white", marginHorizontal: 24, marginBottom: 8,
    borderRadius: 12, padding: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  cardDate: { fontSize: 13, color: "#64748b", marginTop: 4 },
  emptyText: {
    textAlign: "center", color: "#94a3b8",
    padding: 24, fontSize: 14,
  },
});
