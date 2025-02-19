
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import VoiceButton from "@/components/VoiceButton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  text: string;
  isUser: boolean;
  timestamp: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your AI companion, designed to help seniors with daily tasks and provide friendly conversation. How may I assist you today?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const { data, error } = await supabase.functions.invoke('generate-with-ai', {
        body: {
          prompt: input,
          context: messages.slice(-5), // Send last 5 messages for context
        },
      });

      if (error) throw error;

      const aiMessage: Message = {
        text: data.generatedText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
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

  const toggleVoice = () => {
    setIsListening(!isListening);
    // Voice recognition implementation will go here
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-4 shadow-lg md:p-8">
        <h1 className="mb-8 text-center text-3xl font-bold text-primary">
          Your AI Companion
        </h1>

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
            onClick={toggleVoice}
            className="flex-shrink-0"
          />
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message here..."
              className="text-lg"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              className="h-14 w-14 rounded-full p-0"
              disabled={!input.trim() || isLoading}
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
