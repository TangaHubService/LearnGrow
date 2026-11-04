import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { studentApi } from "../../services/api";

interface TimetableEntry {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher?: string;
  room?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function TimetableScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);

  useEffect(() => {
    studentApi.timetable()
      .then((res) => setEntries(res.data.timetable ?? res.data.entries ?? res.data))
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

  const dayEntries = entries.filter((e) => e.day === selectedDay);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Timetable</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayStrip}
        contentContainerStyle={styles.dayStripContent}
      >
        {DAYS.map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>
              {day.slice(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {dayEntries.length === 0 && (
        <Text style={styles.emptyText}>No classes scheduled for {selectedDay}</Text>
      )}

      <View style={styles.list}>
        {dayEntries
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((entry) => (
            <View key={entry.id} style={styles.card}>
              <View style={styles.timeColumn}>
                <Text style={styles.startTime}>{entry.startTime}</Text>
                <Text style={styles.endTime}>{entry.endTime}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoColumn}>
                <Text style={styles.subjectName}>{entry.subject}</Text>
                {entry.teacher && (
                  <Text style={styles.teacherName}>{entry.teacher}</Text>
                )}
                {entry.room && (
                  <Text style={styles.room}>Room {entry.room}</Text>
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
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  dayStrip: { paddingLeft: 24, marginBottom: 16 },
  dayStripContent: { gap: 8, paddingRight: 24 },
  dayChip: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0",
  },
  dayChipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  dayText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  dayTextActive: { color: "white" },
  list: { paddingHorizontal: 24, gap: 10, paddingBottom: 24 },
  card: {
    flexDirection: "row", backgroundColor: "white", borderRadius: 14, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  timeColumn: { alignItems: "center", justifyContent: "center", width: 60 },
  startTime: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  endTime: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  divider: { width: 2, backgroundColor: "#e2e8f0", marginHorizontal: 14 },
  infoColumn: { flex: 1, justifyContent: "center" },
  subjectName: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  teacherName: { fontSize: 13, color: "#64748b", marginTop: 2 },
  room: { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
