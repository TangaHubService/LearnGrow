import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { teacherApi } from "../../services/api";

interface ClassItem {
  id: string;
  name: string;
  level?: { name: string };
  studentCount?: number;
}

export function ClassListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.classes()
      .then((res) => setClasses(res.data.classes ?? res.data))
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
        <Text style={styles.title}>My Classes</Text>
        <Text style={styles.subtitle}>{classes.length} class{classes.length !== 1 ? "es" : ""}</Text>
      </View>

      {classes.length === 0 && (
        <Text style={styles.emptyText}>No classes assigned yet</Text>
      )}

      <View style={styles.list}>
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls.id}
            style={styles.card}
            onPress={() => navigation.navigate("StudentsList", { classId: cls.id, className: cls.name })}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.classIcon}>👨‍🏫</Text>
              <View>
                <Text style={styles.className}>{cls.name}</Text>
                {cls.level && (
                  <Text style={styles.classLevel}>{cls.level.name}</Text>
                )}
              </View>
            </View>
            <View style={styles.cardRight}>
              {cls.studentCount !== undefined && (
                <Text style={styles.studentCount}>{cls.studentCount} students</Text>
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
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  list: { paddingHorizontal: 24, gap: 10, paddingBottom: 24 },
  card: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "white", borderRadius: 14, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  classIcon: { fontSize: 32, marginRight: 14 },
  className: { fontSize: 17, fontWeight: "700", color: "#1F2937" },
  classLevel: { fontSize: 13, color: "#64748b", marginTop: 2 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  studentCount: { fontSize: 13, color: "#64748b" },
  arrow: { fontSize: 22, color: "#94a3b8" },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
