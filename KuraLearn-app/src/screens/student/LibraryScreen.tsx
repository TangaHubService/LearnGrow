import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { libraryApi } from "../../services/api";

interface LibraryItem {
  id: string;
  title: string;
  type?: string;
  description?: string;
  url?: string;
}

export function LibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    libraryApi.list()
      .then((res) => setItems(res.data.library ?? res.data.items ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? items.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
      )
    : items;

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
        <Text style={styles.title}>Resource Library</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search resources..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 && (
        <Text style={styles.emptyText}>
          {search ? "No matching resources" : "No resources available"}
        </Text>
      )}

      <View style={styles.list}>
        {filtered.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card}>
            <Text style={styles.fileIcon}>
              {item.type === "PDF" ? "📄" : item.type === "VIDEO" ? "🎬" : item.type === "IMAGE" ? "🖼️" : "📁"}
            </Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              )}
              {item.type && (
                <Text style={styles.cardType}>{item.type}</Text>
              )}
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
  header: { padding: 24, paddingTop: 60, paddingBottom: 0 },
  backArrow: { fontSize: 16, color: "#4f46e5", fontWeight: "600", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  searchBar: { padding: 24, paddingBottom: 12 },
  searchInput: {
    backgroundColor: "white", borderRadius: 12, padding: 14, fontSize: 15,
    borderWidth: 1, borderColor: "#e2e8f0", color: "#1F2937",
  },
  list: { paddingHorizontal: 24, gap: 10, paddingBottom: 24 },
  card: {
    flexDirection: "row", backgroundColor: "white", borderRadius: 12, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  fileIcon: { fontSize: 28, marginRight: 14, marginTop: 2 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  cardDesc: { fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 18 },
  cardType: { fontSize: 11, fontWeight: "600", color: "#4f46e5", marginTop: 6, textTransform: "uppercase" },
  emptyText: { textAlign: "center", color: "#94a3b8", padding: 48, fontSize: 15 },
});
