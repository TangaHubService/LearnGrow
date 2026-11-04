import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { studentApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface Subject {
  id: string;
  name: string;
  code?: string;
  progress?: number;
}

export function SubjectsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.subjects()
      .then((res) => setSubjects(res.data.subjects ?? res.data))
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
        <Text style={styles.greeting}>My Subjects</Text>
        <Text style={styles.subtitle}>
          {subjects.length} subject{subjects.length !== 1 ? "s" : ""} available
        </Text>
      </View>

      {subjects.length === 0 && (
        <Text style={styles.emptyText}>No subjects available yet</Text>
      )}

      <View style={styles.list}>
        {subjects.map((subject) => (
          <TouchableOpacity
            key={subject.id}
            style={styles.card}
            onPress={() => navigation.navigate("Courses", { subjectId: subject.id, subjectName: subject.name })}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.subjectIcon}>
                {subject.name.includes("Math") || subject.name.includes("math")
                  ? "📐"
                  : subject.name.includes("Eng") || subject.name.includes("eng") || subject.name.includes("Kiny")
                    ? "📖"
                    : subject.name.includes("Sci") || subject.name.includes("sci")
                      ? "🔬"
                      : subject.name.includes("Hist") || subject.name.includes("hist") || subject.name.includes("SST")
                        ? "🌍"
                        : "📚"}
              </Text>
              <View>
                <Text style={styles.subjectName}>{subject.name}</Text>
                {subject.code && (
                  <Text style={styles.subjectCode}>{subject.code}</Text>
                )}
              </View>
            </View>
            <View style={styles.cardRight}>
              {subject.progress !== undefined && (
                <Text style={styles.progressText}>{subject.progress}%</Text>
              )}
              <Text style={styles.arrow}>›</Text>
            </View>
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
  greeting: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  list: { paddingHorizontal: 24, gap: 10, paddingBottom: 24 },
  card: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "white", borderRadius: 14, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  subjectIcon: { fontSize: 32, marginRight: 14 },
  subjectName: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  subjectCode: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressText: { fontSize: 14, fontWeight: "600", color: "#4f46e5" },
  arrow: { fontSize: 24, color: "#94a3b8" },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
