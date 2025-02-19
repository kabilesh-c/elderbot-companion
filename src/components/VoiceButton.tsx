
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isListening: boolean;
  onClick: () => void;
  className?: string;
}

const VoiceButton = ({ isListening, onClick, className }: VoiceButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full transition-all",
        isListening
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      aria-label={isListening ? "Stop listening" : "Start listening"}
    >
      {isListening ? (
        <MicOff className="h-6 w-6" />
      ) : (
        <Mic className="h-6 w-6" />
      )}
    </button>
  );
};

export default VoiceButton;
