import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { studentApi } from "../../services/api";

interface Badge {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  earnedAt?: string;
}

interface RewardsData {
  badges?: Badge[];
  points?: number;
  streak?: number;
  level?: number;
}

export function RewardsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [data, setData] = useState<RewardsData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.rewards()
      .then((res) => setData(res.data.rewards ?? res.data))
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

  const badges = data.badges ?? [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rewards & Badges</Text>
      </View>

      <View style={styles.statsRow}>
        {data.points !== undefined && (
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{data.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        )}
        {data.streak !== undefined && (
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{data.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        )}
        {data.level !== undefined && (
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏅</Text>
            <Text style={styles.statValue}>{data.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Badges</Text>
      {badges.length === 0 && (
        <Text style={styles.emptyText}>Complete lessons to earn badges!</Text>
      )}
      <View style={styles.badgeGrid}>
        {badges.map((badge) => (
          <View key={badge.id} style={styles.badgeCard}>
            <Text style={styles.badgeIcon}>{badge.icon ?? "🏅"}</Text>
            <Text style={styles.badgeName}>{badge.name}</Text>
            {badge.description && (
              <Text style={styles.badgeDesc} numberOfLines={2}>{badge.description}</Text>
            )}
            {badge.earnedAt && (
              <Text style={styles.badgeDate}>
                {new Date(badge.earnedAt).toLocaleDateString()}
              </Text>
            )}
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
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  statsRow: { flexDirection: "row", padding: 24, paddingTop: 8, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: "white", borderRadius: 14, padding: 16, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  statEmoji: { fontSize: 28 },
  statValue: { fontSize: 24, fontWeight: "800", color: "#1F2937", marginTop: 4 },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },
  sectionTitle: {
    fontSize: 18, fontWeight: "700", color: "#1F2937",
    paddingHorizontal: 24, marginBottom: 12,
  },
  badgeGrid: {
    flexDirection: "row", flexWrap: "wrap", padding: 24, paddingTop: 0, gap: 12,
  },
  badgeCard: {
    width: "47%", backgroundColor: "white", borderRadius: 14, padding: 20, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  badgeIcon: { fontSize: 36, marginBottom: 8 },
  badgeName: { fontSize: 14, fontWeight: "600", color: "#1F2937", textAlign: "center" },
  badgeDesc: { fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 4, lineHeight: 16 },
  badgeDate: { fontSize: 10, color: "#94a3b8", marginTop: 6 },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 24, fontSize: 15 },
});
