import React from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../contexts/AuthContext";

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState(true);
  const [offlineMode, setOfflineMode] = React.useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDesc}>Get notified about deadlines and updates</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: "#e2e8f0", true: "#a5b4fc" }}
            thumbColor={notifications ? "#4f46e5" : "#94a3b8"}
          />
        </View>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Offline Mode</Text>
            <Text style={styles.settingDesc}>Download content for offline access</Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={setOfflineMode}
            trackColor={{ false: "#e2e8f0", true: "#a5b4fc" }}
            thumbColor={offlineMode ? "#4f46e5" : "#94a3b8"}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.actionRow}>
          <Text style={styles.actionLabel}>Change Password</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow}>
          <Text style={styles.actionLabel}>Language</Text>
          <Text style={styles.actionValue}>English</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <TouchableOpacity style={styles.actionRow}>
          <Text style={styles.actionLabel}>Version</Text>
          <Text style={styles.actionValue}>0.1.0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow}>
          <Text style={styles.actionLabel}>Privacy Policy</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow}>
          <Text style={styles.actionLabel}>Terms of Service</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  header: { padding: 24, paddingTop: 60 },
  backArrow: { fontSize: 16, color: "#4f46e5", fontWeight: "600", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  section: { margin: 24, marginTop: 0, marginBottom: 16 },
  sectionTitle: {
    fontSize: 14, fontWeight: "700", color: "#64748b",
    textTransform: "uppercase", marginBottom: 10,
  },
  settingRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 8,
  },
  settingLabel: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  settingDesc: { fontSize: 12, color: "#64748b", marginTop: 2 },
  actionRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 8,
  },
  actionLabel: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  actionValue: { fontSize: 14, color: "#64748b" },
  menuArrow: { fontSize: 20, color: "#94a3b8" },
});
