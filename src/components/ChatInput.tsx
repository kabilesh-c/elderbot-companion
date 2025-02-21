
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import VoiceButton from "@/components/VoiceButton";
import { useToast } from "@/components/ui/use-toast";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  isListening: boolean;
  setIsListening: (value: boolean) => void;
}

const ChatInput = ({
  input,
  setInput,
  handleSend,
  isLoading,
  isListening,
  setIsListening,
}: ChatInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleVoiceInput = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
    toast({
      title: "Voice Input Received",
      description: "You can edit the text or press Enter to send.",
    });
  };

  return (
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
  );
};

export default ChatInput;
