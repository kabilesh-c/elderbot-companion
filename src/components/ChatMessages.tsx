
import { useRef, useEffect } from "react";
import ChatMessage from "@/components/ChatMessage";
import { Message } from "@/hooks/useMessages";

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 mb-4 overflow-y-auto rounded-lg bg-muted/30 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} {...message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
