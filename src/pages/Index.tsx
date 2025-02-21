
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ConversationList from "@/components/ConversationList";
import ReminderDialog from "@/components/ReminderDialog";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import ChatInput from "@/components/ChatInput";
import { useMessages } from "@/hooks/useMessages";

const Index = () => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { messages, setMessages, loadChatHistory } = useMessages(user?.id);

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

    const userMessage = {
      text: input,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (input.toLowerCase().includes('remind') || input.toLowerCase().includes('reminder')) {
        setIsReminderDialogOpen(true);
      }

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

      const aiMessage = {
        text: data.generatedText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      };

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
        <ChatHeader
          onReminderClick={() => setIsReminderDialogOpen(true)}
          onSignOut={handleSignOut}
          isAuthenticated={!!user}
        />

        <ChatMessages messages={messages} />

        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isLoading={isLoading}
          isListening={isListening}
          setIsListening={setIsListening}
        />
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
