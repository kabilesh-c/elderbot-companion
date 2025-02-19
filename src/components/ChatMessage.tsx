
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  text: string;
  isUser: boolean;
  timestamp: string;
}

const ChatMessage = ({ text, isUser, timestamp }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex w-full animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-6 py-4 text-lg",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        <p className="leading-relaxed">{text}</p>
        <p className="mt-2 text-sm opacity-70">{timestamp}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
