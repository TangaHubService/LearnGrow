import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../contexts/AuthContext";
import { teacherApi } from "../../services/api";

const quickActions = [
  { icon: "👨‍🏫", label: "Classes", screen: "ClassList", color: "#eef2ff" },
  { icon: "📋", label: "Attendance", screen: "MarkAttendance", color: "#fff7ed" },
  { icon: "📝", label: "Lessons", screen: "Lessons", color: "#ecfdf5" },
  { icon: "🤖", label: "AI Copilot", screen: "AICopilot", color: "#faf5ff" },
  { icon: "📊", label: "Reports", screen: "Reports", color: "#f0f9ff" },
  { icon: "❓", label: "Quizzes", screen: "Quizzes", color: "#fef2f2" },
];

export function TeacherDashboardScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.dashboard()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Muraho, {user?.name?.split(" ")[0]}</Text>
          <Text style={styles.role}>Teacher</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.activeClasses ?? 0}</Text>
          <Text style={styles.statLabel}>Active Classes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.totalStudents ?? 0}</Text>
          <Text style={styles.statLabel}>Students</Text>
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
    paddingHorizontal: 24, gap: 10,
  },
  actionCard: {
    width: "30%", borderRadius: 14, padding: 16, alignItems: "center",
  },
  actionIcon: { fontSize: 26, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "#1F2937" },
});
