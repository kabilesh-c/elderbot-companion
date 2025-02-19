
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";

// Add type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

interface VoiceButtonProps {
  isListening: boolean;
  onClick: () => void;
  className?: string;
  onTextReceived: (text: string) => void;
}

const VoiceButton = ({ isListening, onClick, className, onTextReceived }: VoiceButtonProps) => {
  const recognition = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognitionConstructor();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        onTextReceived(text);
        onClick(); // Stop listening after receiving result
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Voice Input Error",
          description: "There was a problem with voice recognition. Please try again.",
          variant: "destructive",
        });
        onClick(); // Stop listening on error
      };

      recognition.current.onend = () => {
        if (isListening) {
          onClick(); // Update listening state when recognition ends
        }
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.abort();
      }
    };
  }, [onClick, onTextReceived, toast, isListening]);

  useEffect(() => {
    if (recognition.current) {
      if (isListening) {
        recognition.current.start();
      } else {
        recognition.current.stop();
      }
    }
  }, [isListening]);

  const handleClick = () => {
    if (!recognition.current) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support voice input. Please type your message instead.",
        variant: "destructive",
      });
      return;
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isListening
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      aria-label={isListening ? "Stop listening" : "Start voice input"}
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
