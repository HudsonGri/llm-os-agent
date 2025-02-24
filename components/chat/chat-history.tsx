import { useState, useEffect, useRef, useCallback } from 'react';
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

// Type definitions
interface ChatHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  reloadConversations?: (reloadFn: (skipLoadingState?: boolean) => Promise<void>) => void;
  userMessageCache?: Record<string, string>;
}

interface Conversation {
  id: string;
  firstMessage: string;
  timestamp: string;
}

type ConversationGroups = {
  today?: Conversation[];
  yesterday?: Conversation[];
  previousWeek?: Conversation[];
  older?: Conversation[];
};

/**
 * Truncates a message to the specified length and adds ellipsis if needed
 * @param message The message to truncate
 * @param maxLength Maximum allowed length
 * @returns Truncated message string
 */
function truncateMessage(message: string | undefined, maxLength: number = 50): string {
  if (!message || message.trim() === '') {
    return 'New conversation...';
  }
  
  if (message.length <= maxLength) {
    return message;
  }
  
  return `${message.slice(0, maxLength).trim()}...`;
}

/**
 * Groups conversations by date (today, yesterday, previous week, older)
 */
function groupConversationsByDate(conversations: Conversation[]): ConversationGroups {
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
  }, {} as ConversationGroups);
}

/**
 * Renders a group of conversations with a title
 */
type ConversationGroupProps = {
  title: string;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  userMessageCache: Record<string, string>;
};

function ConversationGroup({ 
  title, 
  conversations, 
  currentConversationId, 
  onSelectConversation,
  onDeleteConversation,
  userMessageCache
}: ConversationGroupProps) {
  // Create a memoized handler for deletion to prevent any potential event bubbling issues
  const handleDelete = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    onDeleteConversation(id);
  }, [onDeleteConversation]);

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-zinc-400 px-3 py-2 uppercase tracking-wider">{title}</h3>
      {conversations.map((conv) => {
        const isCurrentConversation = currentConversationId === conv.id;
        
        // Use cached user message first, then fall back to API data
        const cachedMessage = userMessageCache[conv.id];
        const displayTitle = cachedMessage 
          ? truncateMessage(cachedMessage)
          : (!conv.firstMessage || conv.firstMessage.trim() === '') 
            ? 'New conversation...' 
            : truncateMessage(conv.firstMessage);
        
        return (
          <div key={conv.id} className="group relative mx-2 mb-1 rounded-md hover:bg-zinc-50 overflow-visible">
            <Button
              variant={isCurrentConversation ? "secondary" : "ghost"}
              className={`w-full justify-start text-left px-3 py-2 h-auto rounded-md text-sm pr-10
                ${isCurrentConversation ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-600 hover:text-zinc-900'}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="truncate max-w-[190px]">{displayTitle}</div>
            </Button>
            
            {/* Always visible on hover, positioned absolutely */}
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 z-10 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <DeleteConversationButton onDelete={() => handleDelete(conv.id)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Delete conversation button with confirmation dialog
 */
type DeleteConversationButtonProps = {
  onDelete: () => void;
};

function DeleteConversationButton({ onDelete }: DeleteConversationButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded backdrop-blur-sm hover:bg-red-50 hover:border-red-200 active:bg-red-100 transition-colors"
          onClick={(e) => {
            // Only stop propagation to prevent triggering the conversation selection
            // but don't prevent default behavior which would block the dialog from opening
            e.stopPropagation();
          }}
        >
          <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-red-600 transition-colors" />
          <span className="sr-only">Delete conversation</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="z-50">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * ChatHistory component displays the sidebar with conversation history
 */
export function ChatHistory({ 
  currentConversationId, 
  onSelectConversation, 
  onNewChat, 
  reloadConversations,
  userMessageCache = {}
}: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousConversationIds = useRef<Set<string>>(new Set());

  /**
   * Loads conversation list from the API
   */
  const loadConversations = useCallback(async (skipLoadingState = false) => {
    if (!skipLoadingState) {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      const response = await fetch('/api/chat/conversations');
      
      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.status}`);
      }
      
      const data = await response.json();
      setConversations(data);
      
      // Store conversation IDs for future reference
      const newIds = new Set<string>();
      data.forEach((conv: Conversation) => {
        if (conv.id) newIds.add(conv.id);
      });
      previousConversationIds.current = newIds;
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Handles conversation deletion
   */
  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.status}`);
      }
      
      if (id === currentConversationId) {
        onNewChat();
      }
      
      loadConversations(true);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete conversation');
    }
  }, [currentConversationId, onNewChat, loadConversations]);

  // Expose loadConversations to parent component
  useEffect(() => {
    if (reloadConversations) {
      reloadConversations(loadConversations);
    }
  }, [reloadConversations, loadConversations]);

  // Load conversations when currentConversationId changes
  useEffect(() => {
    // Skip loading state if selecting an existing conversation from our list
    const skipLoadingState = currentConversationId ? previousConversationIds.current.has(currentConversationId) : false;
    loadConversations(skipLoadingState);
  }, [currentConversationId, loadConversations]);

  // Group conversations by date
  const groupedConversations = groupConversationsByDate(conversations);

  return (
    <div className="w-72 border-l border-zinc-200 bg-white h-screen flex flex-col overflow-hidden">
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
      
      <ScrollArea className="flex-1 px-1 pb-4">
        <div className="py-2">
          {isLoading ? (
            <ConversationSkeleton />
          ) : error ? (
            <ErrorMessage message={error} onRetry={() => loadConversations(false)} />
          ) : (
            <ConversationList 
              groupedConversations={groupedConversations}
              currentConversationId={currentConversationId}
              onSelectConversation={onSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              userMessageCache={userMessageCache}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Skeleton loader for conversations
 */
function ConversationSkeleton() {
  return (
    <div className="space-y-2 px-1">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-8 w-full rounded-md" />
      ))}
    </div>
  );
}

/**
 * Error message with retry button
 */
function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8 px-4">
      <p className="text-sm text-red-500 mb-2">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

/**
 * Renders the grouped conversation list
 */
function ConversationList({ 
  groupedConversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  userMessageCache
}: {
  groupedConversations: ConversationGroups;
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  userMessageCache: Record<string, string>;
}) {
  if (Object.keys(groupedConversations).length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-sm text-zinc-400">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedConversations.today && groupedConversations.today.length > 0 && (
        <ConversationGroup 
          title="Today" 
          conversations={groupedConversations.today}
          currentConversationId={currentConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          userMessageCache={userMessageCache}
        />
      )}
      {groupedConversations.yesterday && groupedConversations.yesterday.length > 0 && (
        <ConversationGroup 
          title="Yesterday" 
          conversations={groupedConversations.yesterday}
          currentConversationId={currentConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          userMessageCache={userMessageCache}
        />
      )}
      {groupedConversations.previousWeek && groupedConversations.previousWeek.length > 0 && (
        <ConversationGroup 
          title="Previous 7 Days" 
          conversations={groupedConversations.previousWeek}
          currentConversationId={currentConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          userMessageCache={userMessageCache}
        />
      )}
      {groupedConversations.older && groupedConversations.older.length > 0 && (
        <ConversationGroup 
          title="Older" 
          conversations={groupedConversations.older}
          currentConversationId={currentConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          userMessageCache={userMessageCache}
        />
      )}
    </div>
  );
} 