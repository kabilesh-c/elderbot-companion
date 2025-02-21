
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReminderDialogProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

const ReminderDialog = ({ open, onClose, userId }: ReminderDialogProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [reminderType, setReminderType] = useState<'daily' | 'monthly'>('daily');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderDay, setReminderDay] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!phoneNumber || !message || !reminderTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('process-reminder', {
        body: {
          phone_number: phoneNumber,
          message,
          reminder_type: reminderType,
          reminder_time: reminderTime,
          reminder_day: reminderType === 'monthly' ? parseInt(reminderDay) : undefined,
          user_id: userId
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reminder set successfully!",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set reminder",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set a Reminder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
            />
          </div>
          <div>
            <Label htmlFor="message">Reminder Message</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Take your medication"
            />
          </div>
          <div>
            <Label>Reminder Type</Label>
            <Select
              value={reminderType}
              onValueChange={(value: 'daily' | 'monthly') => setReminderType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>
          {reminderType === 'monthly' && (
            <div>
              <Label htmlFor="day">Day of Month</Label>
              <Select value={reminderDay} onValueChange={setReminderDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Setting reminder..." : "Set Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDialog;
