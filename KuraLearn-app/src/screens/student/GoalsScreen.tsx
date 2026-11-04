import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { studentApi } from "../../services/api";

interface Goal {
  id: string;
  title: string;
  targetDate?: string;
  completed?: boolean;
  progress?: number;
  createdAt: string;
}

export function GoalsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    studentApi.goals()
      .then((res) => setGoals(res.data.goals ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { data } = await studentApi.createGoal({
        title: newTitle.trim(),
        targetDate: newTargetDate || undefined,
      });
      setGoals((prev) => [...prev, data.goal ?? data]);
      setNewTitle("");
      setNewTargetDate("");
      setShowForm(false);
    } catch {
      Alert.alert("Error", "Failed to create goal");
    } finally {
      setCreating(false);
    }
  }

  async function toggleGoal(goal: Goal) {
    try {
      await studentApi.updateGoal(goal.id, { completed: !goal.completed });
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goal.id ? { ...g, completed: !g.completed } : g
        )
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

  const incomplete = goals.filter((g) => !g.completed);
  const completed = goals.filter((g) => g.completed);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Learning Goals</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(!showForm)}
          >
            <Text style={styles.addButtonText}>{showForm ? "Cancel" : "+ Add"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="What do you want to achieve?"
            placeholderTextColor="#94a3b8"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Target date (YYYY-MM-DD) - optional"
            placeholderTextColor="#94a3b8"
            value={newTargetDate}
            onChangeText={setNewTargetDate}
          />
          <TouchableOpacity
            style={[styles.createButton, creating && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={creating || !newTitle.trim()}
          >
            <Text style={styles.createButtonText}>
              {creating ? "Creating..." : "Set Goal"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {incomplete.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>In Progress ({incomplete.length})</Text>
          {incomplete.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalCard}
              onPress={() => toggleGoal(goal)}
            >
              <View style={[styles.checkbox, goal.completed && styles.checkboxDone]} />
              <View style={styles.goalContent}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                {goal.targetDate && (
                  <Text style={styles.goalDate}>Due: {goal.targetDate}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {completed.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Completed ({completed.length})</Text>
          {completed.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalCard}
              onPress={() => toggleGoal(goal)}
            >
              <View style={[styles.checkbox, styles.checkboxDone]}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <View style={styles.goalContent}>
                <Text style={[styles.goalTitle, styles.goalDone]}>{goal.title}</Text>
                {goal.targetDate && (
                  <Text style={styles.goalDate}>Due: {goal.targetDate}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {goals.length === 0 && !showForm && (
        <Text style={styles.emptyText}>
          Set your first learning goal to get started!
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f8fb" },
  header: { padding: 24, paddingTop: 60 },
  backArrow: { fontSize: 16, color: "#4f46e5", fontWeight: "600", marginBottom: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  addButton: { backgroundColor: "#4f46e5", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  addButtonText: { color: "white", fontWeight: "700", fontSize: 14 },
  form: { padding: 24, paddingTop: 0, gap: 10 },
  input: {
    backgroundColor: "white", borderRadius: 12, padding: 14, fontSize: 15,
    borderWidth: 1, borderColor: "#e2e8f0", color: "#1F2937",
  },
  createButton: { backgroundColor: "#10b981", borderRadius: 12, padding: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  createButtonText: { color: "white", fontWeight: "700", fontSize: 15 },
  sectionTitle: {
    fontSize: 18, fontWeight: "700", color: "#1F2937",
    paddingHorizontal: 24, marginBottom: 10,
  },
  goalCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "white", marginHorizontal: 24, marginBottom: 8,
    borderRadius: 12, padding: 16, gap: 12,
    shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    borderColor: "#cbd5e1", justifyContent: "center", alignItems: "center",
  },
  checkboxDone: { backgroundColor: "#10b981", borderColor: "#10b981" },
  checkmark: { color: "white", fontSize: 14, fontWeight: "800" },
  goalContent: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  goalDone: { textDecorationLine: "line-through", color: "#94a3b8" },
  goalDate: { fontSize: 12, color: "#64748b", marginTop: 2 },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
