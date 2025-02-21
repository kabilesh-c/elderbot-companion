
import { Button } from "@/components/ui/button";
import { LogOut, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHeaderProps {
  onReminderClick: () => void;
  onSignOut?: () => void;
  isAuthenticated?: boolean;
}

const ChatHeader = ({ onReminderClick, onSignOut, isAuthenticated }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold text-primary">
        Your AI Companion
      </h1>
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                onClick={onReminderClick}
                className="flex items-center gap-2 px-4"
                aria-label="Set reminder"
              >
                <Clock className="h-5 w-5" />
                Set Reminder
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click here to set up your reminders</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isAuthenticated && onSignOut && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="h-10 w-10"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
