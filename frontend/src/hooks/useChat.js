import { useState, useEffect } from "react";
import client from "../api/client";

/**
 * Custom hook to manage real-time Server-Sent Events (SSE) chat streaming
 * and fetch chat session history.
 * 
 * @param {string} sessionId - The active chat session UUID
 */

export function useChat(sessionId) {

  //Stores the conversation
  const [messages, setMessages] = useState([]);

  //Shows whethere ai is currently responding, disables send button
  const [isGenerating, setIsGenerating] = useState(false);

  //Stores error response
  const [error, setError] = useState(null);

  // Fetch session messages history when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    const fetchHistory = async () => {
      setIsGenerating(false);
      setError(null);
      try {
        const response = await client.get(`/chat/sessions/${sessionId}`);
        // SessionResponse contains messages list
        setMessages(response.data.messages || []);
      } catch (err) {
        console.error("Failed to load chat history:", err);
        setError("Could not load conversation history.");
      }
    };

    fetchHistory();
  }, [sessionId]);

  /**
   * Sends a user query to the active session and streams the assistant response
   * 
   * @param {string} text - The user query content
   */
  const sendMessage = async (text) => {

    //The prevent empty message, no selectchat, stops when ai is generating
    if (!sessionId || !text.trim() || isGenerating) return;

    setError(null);
    setIsGenerating(true);

    // 1. Append the user's message to the state list
    const userMsg = { id: `user-temp-${Date.now()}`, role: "user", content: text };

    // 2. Append a blank placeholder message for the assistant that will receive the stream
    const assistantMsg = { id: `assistant-temp-${Date.now()}`, role: "assistant", content: "", citations: [] };

    //It appends a new user message and a new assistant message to the existing list of messages,  spread operator. It unpacks all the older messages from the prev array so they aren't lost
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const token = localStorage.getItem("token");

      // We must use standard fetch instead of Axios because Axios does not support 
      // reading stream bodies easily in the browser environment.
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";
      const response = await fetch(`${apiBase}/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      // Check if response body is a readable stream
      if (!response.body) {
        throw new Error("ReadableStream is not supported by the response body.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      // Stream parsing loop
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode incoming binary chunk to string and append to buffer
        buffer += decoder.decode(value, { stream: true });

        // Split buffer by newlines to process complete lines
        const lines = buffer.split("\n");

        // Save the last potentially incomplete line back to the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          // SSE protocol streams lines in the format: data: {"token": "text"}
          if (trimmedLine.startsWith("data: ")) {
            const dataStr = trimmedLine.slice(6).trim();

            if (dataStr === "[DONE]") {
              break; // Stream completed
            }

            try {
              const data = JSON.parse(dataStr);

              // Update the last message in state with new tokens and citations
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg && lastMsg.role === "assistant") {
                  if (data.token) {
                    lastMsg.content += data.token;
                  }
                  if (data.citations) {
                    // Update or append citations
                    lastMsg.citations = data.citations;
                  }
                }
                return updated;
              });
            } catch (jsonErr) {
              console.warn("Failed to parse stream JSON line:", dataStr, jsonErr);
            }
          }
        }
      }
    } catch (err) {
      console.error("Stream reader error:", err);
      setError("Failed to generate response. Please try again.");

      // Remove the empty placeholder if we encountered an error immediately
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "assistant" && lastMsg.content === "") {
          updated.pop();
        }
        return updated;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return { messages, sendMessage, isGenerating, error };
}