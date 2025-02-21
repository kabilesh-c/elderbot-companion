
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, LogOut, Clock } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import VoiceButton from "@/components/VoiceButton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ConversationList from "@/components/ConversationList";
import ReminderDialog from "@/components/ReminderDialog";

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
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
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

  const loadChatHistory = async (conversationId: string) => {
    try {
      let query = supabase
        .from('chat_history')
        .select('message, is_user, timestamp')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (user) {
        query = query.eq('user_id', user.id);
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

  const createNewConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          title: 'New Conversation',
          user_id: user?.id || null
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentConversationId(data.id);
      setMessages([messages[0]]); // Reset to welcome message
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      text: input,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Check for reminder-related keywords
      if (input.toLowerCase().includes('remind') || input.toLowerCase().includes('reminder')) {
        setIsReminderDialogOpen(true);
      }

      // Store user message
      const { error: insertError } = await supabase
        .from('chat_history')
        .insert({
          user_id: user?.id || null,
          message: input,
          is_user: true,
          conversation_id: currentConversationId
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
          user_id: user?.id || null,
          message: data.generatedText,
          is_user: false,
          conversation_id: currentConversationId
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
    <div className="flex min-h-screen bg-background">
      <div className="w-64 p-4 border-r border-border">
        <ConversationList
          currentId={currentConversationId}
          onSelect={(id) => {
            setCurrentConversationId(id);
            loadChatHistory(id);
          }}
          onNew={createNewConversation}
          userId={user?.id}
        />
      </div>
      
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary">
            Your AI Companion
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsReminderDialogOpen(true)}
              className="h-10 w-10"
              aria-label="Set reminder"
            >
              <Clock className="h-5 w-5" />
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-10 w-10"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 mb-4 overflow-y-auto rounded-lg bg-muted/30 p-4">
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

      <ReminderDialog
        open={isReminderDialogOpen}
        onClose={() => setIsReminderDialogOpen(false)}
        userId={user?.id}
      />
    </div>
  );
};

export default Index;
