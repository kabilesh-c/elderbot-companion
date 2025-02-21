
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, LogOut } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import VoiceButton from "@/components/VoiceButton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  text: string;
  isUser: boolean;
  timestamp: string;
}

interface ChatHistoryRecord {
  message: string;
  is_user: boolean;
  timestamp: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your AI companion, designed to help seniors with daily tasks and provide friendly conversation. You can type your message or click the microphone button to use voice input. How may I assist you today?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history
    const loadChatHistory = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('chat_history')
        .select('message, is_user, timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });
      
      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      if (data) {
        const historicalMessages = (data as ChatHistoryRecord[]).map(msg => ({
          text: msg.message,
          isUser: msg.is_user,
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
        }));
        setMessages(prev => [...historicalMessages]);
      }
    };

    loadChatHistory();
  }, [user]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = {
      text: input,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Store user message
      const { error: insertError } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          message: input,
          is_user: true,
        });

      if (insertError) throw insertError;

      const { data, error } = await supabase.functions.invoke('generate-with-ai', {
        body: {
          prompt: input,
          context: messages.slice(-5),
        },
      });

      if (error) throw error;

      const aiMessage: Message = {
        text: data.generatedText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      };

      // Store AI response
      const { error: aiInsertError } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          message: data.generatedText,
          is_user: false,
        });

      if (aiInsertError) throw aiInsertError;

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "I'm having trouble responding right now. Please try again.",
        variant: "destructive",
      });
      console.error("Error in AI response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
    toast({
      title: "Voice Input Received",
      description: "You can edit the text or press Enter to send.",
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-4 shadow-lg md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">
            Your AI Companion
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-10 w-10"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-4 h-[60vh] overflow-y-auto rounded-lg bg-muted/30 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <ChatMessage key={index} {...message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <VoiceButton
            isListening={isListening}
            onClick={() => setIsListening(!isListening)}
            onTextReceived={handleVoiceInput}
            className="flex-shrink-0"
          />
          <div className="flex flex-1 items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening..." : "Type your message or click the microphone to speak..."}
              className="text-lg"
              disabled={isLoading || isListening}
              aria-label="Message input"
            />
            <Button
              onClick={handleSend}
              className="h-14 w-14 rounded-full p-0"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <Send className={`h-6 w-6 ${isLoading ? "animate-pulse" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
