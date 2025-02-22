import { useState, useEffect } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, isToday, isYesterday, subDays } from 'date-fns';

interface ChatHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
}

interface Conversation {
  id: string;
  firstMessage: string;
  timestamp: string;
}

function truncateMessage(message: string, maxLength: number = 35): string {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength).trim() + '...';
}

function groupConversationsByDate(conversations: Conversation[]) {
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);

  return conversations.reduce((groups, conv) => {
    const date = new Date(conv.timestamp);
    
    if (isToday(date)) {
      if (!groups.today) groups.today = [];
      groups.today.push(conv);
    } else if (isYesterday(date)) {
      if (!groups.yesterday) groups.yesterday = [];
      groups.yesterday.push(conv);
    } else if (date > sevenDaysAgo) {
      if (!groups.previousWeek) groups.previousWeek = [];
      groups.previousWeek.push(conv);
    } else {
      if (!groups.older) groups.older = [];
      groups.older.push(conv);
    }
    
    return groups;
  }, {} as Record<string, Conversation[]>);
}

export function ChatHistory({ currentConversationId, onSelectConversation, onNewChat }: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function loadConversations() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/conversations');
      if (!response.ok) throw new Error('Failed to load conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete conversation');
      
      if (id === currentConversationId) {
        onNewChat();
      }
      
      loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const groupedConversations = groupConversationsByDate(conversations);

  const ConversationGroup = ({ title, conversations }: { title: string; conversations: Conversation[] }) => (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-zinc-400 px-3 py-2 uppercase tracking-wider">{title}</h3>
      {conversations.map((conv) => (
        <div key={conv.id} className="group relative px-2">
          <Button
            variant={currentConversationId === conv.id ? "secondary" : "ghost"}
            className={`w-full justify-start text-left px-3 py-2 h-auto rounded-md text-sm
              ${currentConversationId === conv.id ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-600 hover:text-zinc-900'}`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <div className="truncate">{truncateMessage(conv.firstMessage)}</div>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
              >
                <Trash2 className="h-3 w-3 text-zinc-400 hover:text-red-500 transition-colors" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this conversation? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteConversation(conv.id)}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-72 border-l border-zinc-200 bg-white h-screen flex flex-col">
      <div className="p-4">
        <Button 
          variant="outline"
          className="w-full gap-2 text-sm h-9 px-4 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900 transition-colors rounded-lg shadow-sm" 
          onClick={onNewChat}
          disabled={isLoading}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="font-medium">Start New Chat</span>
        </Button>
      </div>
      
      <div className="px-2 mb-2">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
      </div>
      
      <ScrollArea className="flex-1 px-2">
        <div className="py-2">
          {isLoading ? (
            <div className="space-y-2 px-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedConversations.today?.length > 0 && (
                <ConversationGroup title="Today" conversations={groupedConversations.today} />
              )}
              {groupedConversations.yesterday?.length > 0 && (
                <ConversationGroup title="Yesterday" conversations={groupedConversations.yesterday} />
              )}
              {groupedConversations.previousWeek?.length > 0 && (
                <ConversationGroup title="Previous 7 Days" conversations={groupedConversations.previousWeek} />
              )}
              {groupedConversations.older?.length > 0 && (
                <ConversationGroup title="Older" conversations={groupedConversations.older} />
              )}
              {Object.keys(groupedConversations).length === 0 && (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-zinc-400">No conversations yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 