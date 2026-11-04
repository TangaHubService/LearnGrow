import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { notificationsApi } from "../../services/api";
import type { Notification } from "@kuralearn/shared";

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.list()
      .then((res) => setNotifications(res.data.notifications ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkRead(id: string) {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          {notifications.filter((n) => !n.readAt).length} unread
        </Text>
      </View>

      {notifications.length === 0 && (
        <Text style={styles.emptyText}>No notifications yet</Text>
      )}

      <View style={styles.list}>
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[styles.card, !notification.readAt && styles.unreadCard]}
            onPress={() => !notification.readAt && handleMarkRead(notification.id)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{notification.title}</Text>
              {!notification.readAt && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.cardBody}>{notification.body}</Text>
            <Text style={styles.cardTime}>
              {new Date(notification.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </Text>
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
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  list: { paddingHorizontal: 24, gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: "white", borderRadius: 12, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: "#4f46e5" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1F2937", flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4f46e5", marginLeft: 8 },
  cardBody: { fontSize: 14, color: "#64748b", marginTop: 6, lineHeight: 20 },
  cardTime: { fontSize: 11, color: "#94a3b8", marginTop: 8 },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
