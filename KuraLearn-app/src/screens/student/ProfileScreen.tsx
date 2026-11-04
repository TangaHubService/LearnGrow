import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../contexts/AuthContext";
import { studentApi } from "../../services/api";

interface ProfileData {
  studentCode?: string;
  level?: { name: string };
  class?: { name: string };
  school?: { name: string };
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [profile, setProfile] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.profile()
      .then((res) => setProfile(res.data.student ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const menuItems = [
    { icon: "📊", label: "My Marks", screen: "Marks" },
    { icon: "📋", label: "Attendance", screen: "Attendance" },
    { icon: "🕐", label: "Timetable", screen: "Timetable" },
    { icon: "🏆", label: "Rewards & Badges", screen: "Rewards" },
    { icon: "🎯", label: "Learning Goals", screen: "Goals" },
    { icon: "⚙️", label: "Settings", screen: "Settings" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {profile.studentCode && (
          <Text style={styles.code}>ID: {profile.studentCode}</Text>
        )}
      </View>

      {profile.level || profile.class ? (
        <View style={styles.infoRow}>
          {profile.level && (
            <View style={styles.infoChip}>
              <Text style={styles.infoLabel}>Level</Text>
              <Text style={styles.infoValue}>{profile.level.name}</Text>
            </View>
          )}
          {profile.class && (
            <View style={styles.infoChip}>
              <Text style={styles.infoLabel}>Class</Text>
              <Text style={styles.infoValue}>{profile.class.name}</Text>
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  header: { alignItems: "center", padding: 24, paddingTop: 60 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#4f46e5",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: "white" },
  name: { fontSize: 22, fontWeight: "700", color: "#1F2937" },
  email: { fontSize: 14, color: "#64748b", marginTop: 4 },
  code: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  infoRow: { flexDirection: "row", padding: 24, paddingTop: 0, gap: 12 },
  infoChip: {
    flex: 1, backgroundColor: "white", borderRadius: 12, padding: 14, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  infoLabel: { fontSize: 12, color: "#64748b" },
  infoValue: { fontSize: 16, fontWeight: "700", color: "#1F2937", marginTop: 4 },
  menu: { padding: 24, paddingTop: 0, gap: 8 },
  menuItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: "white",
    borderRadius: 12, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  menuIcon: { fontSize: 22, marginRight: 14 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#1F2937", flex: 1 },
  menuArrow: { fontSize: 22, color: "#94a3b8" },
  logoutButton: {
    marginHorizontal: 24, borderRadius: 12, padding: 16,
    alignItems: "center", backgroundColor: "#fee2e2",
  },
  logoutText: { color: "#ef4444", fontSize: 16, fontWeight: "700" },
});
