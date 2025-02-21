
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface Message {
  text: string;
  isUser: boolean;
  timestamp: string;
}

export interface ChatHistoryRecord {
  message: string;
  is_user: boolean;
  timestamp: string;
}

export const useMessages = (userId?: string) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your AI companion, designed to help seniors with daily tasks and provide friendly conversation. You can type your message or click the microphone button to use voice input. How may I assist you today?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const { toast } = useToast();

  const loadChatHistory = async (conversationId: string) => {
    try {
      let query = supabase
        .from('chat_history')
        .select('message, is_user, timestamp')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      if (data) {
        const historicalMessages = (data as ChatHistoryRecord[]).map(msg => ({
          text: msg.message,
          isUser: msg.is_user,
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
        }));
        setMessages(historicalMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  return {
    messages,
    setMessages,
    loadChatHistory,
  };
};
