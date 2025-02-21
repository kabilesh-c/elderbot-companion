
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface ConversationListProps {
  currentId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  userId?: string;
}

const ConversationList = ({ currentId, onSelect, onNew, userId }: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, [userId]);

  const loadConversations = async () => {
    try {
      let query = supabase.from('conversations').select('*');
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.is('user_id', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <Button onClick={onNew} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          New Chat
        </Button>
      </div>
      <div className="space-y-2">
        {conversations.map((conv) => (
          <Button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            variant={currentId === conv.id ? "default" : "ghost"}
            className="w-full justify-start"
          >
            {conv.title || "New Conversation"}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
