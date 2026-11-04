import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { aiApi } from "../../services/api";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

export function AITutorScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", role: "ai", text: "Muraho! I'm Kura, your AI tutor. Ask me anything about your lessons!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await aiApi.chat(userMsg.text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: data.reply ?? "I'm not sure how to answer that. Can you try asking differently?",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: "Sorry, I'm having trouble connecting. Please try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AI Tutor</Text>
        <Text style={styles.subtitle}>Ask Kura anything about your lessons</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
            {item.role === "ai" && <Text style={styles.bubbleIcon}>🤖</Text>}
            <View style={item.role === "user" ? styles.userTextWrap : styles.aiTextWrap}>
              <Text style={[styles.bubbleText, item.role === "user" && styles.userText]}>
                {item.text}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
          placeholderTextColor="#94a3b8"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fb" },
  header: { padding: 24, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  chatList: { padding: 16, paddingBottom: 8, gap: 12 },
  bubble: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  userBubble: { justifyContent: "flex-end" },
  aiBubble: { justifyContent: "flex-start" },
  bubbleIcon: { fontSize: 28 },
  userTextWrap: {
    backgroundColor: "#4f46e5",
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 14,
    maxWidth: "78%",
  },
  aiTextWrap: {
    backgroundColor: "white",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 14,
    maxWidth: "78%",
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  bubbleText: { fontSize: 15, color: "#1F2937", lineHeight: 22 },
  userText: { color: "white" },
  inputBar: {
    flexDirection: "row", padding: 12, gap: 8,
    backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#e2e8f0",
    alignItems: "flex-end",
  },
  input: {
    flex: 1, backgroundColor: "#f1f5f9", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    maxHeight: 100, color: "#1F2937",
  },
  sendButton: {
    backgroundColor: "#4f46e5", borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 12, justifyContent: "center",
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: "white", fontWeight: "700", fontSize: 15 },
});
