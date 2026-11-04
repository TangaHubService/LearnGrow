import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { studentApi } from "../../services/api";

interface MarkItem {
  id: string;
  subjectName: string;
  score?: number;
  maxScore: number;
  percentage?: number;
  grade?: string;
  assessmentType: string;
}

interface MarksData {
  subjects?: Array<{
    name: string;
    average: number;
    grade: string;
    marks: MarkItem[];
  }>;
  overallAverage?: number;
}

export function MarksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [data, setData] = useState<MarksData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.marks()
      .then((res) => setData(res.data.marks ?? res.data))
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
        <Text style={styles.title}>My Marks</Text>
        {data.overallAverage !== undefined && (
          <Text style={styles.overall}>Overall Average: {Math.round(data.overallAverage)}%</Text>
        )}
      </View>

      {(!data.subjects || data.subjects.length === 0) && (
        <Text style={styles.emptyText}>No marks available yet</Text>
      )}

      {data.subjects?.map((subject) => (
        <View key={subject.name} style={styles.subjectBlock}>
          <View style={styles.subjectHeader}>
            <Text style={styles.subjectName}>{subject.name}</Text>
            <Text style={styles.subjectAverage}>{Math.round(subject.average)}%</Text>
          </View>
          {subject.marks.map((mark) => (
            <View key={mark.id} style={styles.markRow}>
              <View style={styles.markInfo}>
                <Text style={styles.markType}>{mark.assessmentType}</Text>
                <Text style={styles.markScore}>
                  {mark.score ?? "—"} / {mark.maxScore}
                </Text>
              </View>
              {mark.percentage && (
                <Text style={styles.markPercent}>{Math.round(mark.percentage)}%</Text>
              )}
              {mark.grade && (
                <Text style={styles.markGrade}>{mark.grade}</Text>
              )}
            </View>
          ))}
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
  overall: { fontSize: 15, color: "#4f46e5", fontWeight: "600", marginTop: 6 },
  subjectBlock: { margin: 24, marginTop: 0, marginBottom: 16 },
  subjectHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#eef2ff", borderRadius: 12, padding: 14, marginBottom: 8,
  },
  subjectName: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  subjectAverage: { fontSize: 18, fontWeight: "800", color: "#4f46e5" },
  markRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "white", borderRadius: 10, padding: 14, marginBottom: 6,
  },
  markInfo: { flex: 1 },
  markType: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  markScore: { fontSize: 12, color: "#64748b", marginTop: 2 },
  markPercent: { fontSize: 16, fontWeight: "700", color: "#1F2937", marginRight: 12 },
  markGrade: {
    fontSize: 14, fontWeight: "800", color: "white", backgroundColor: "#4f46e5",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: "hidden",
  },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
