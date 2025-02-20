import { useState, useEffect } from 'react';
import { FileStack, PlusCircle, MessageSquare, Clock, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';

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

function truncateMessage(message: string, maxLength: number = 40): string {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength).trim() + '...';
}

export function ChatHistory({ currentConversationId, onSelectConversation, onNewChat }: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  // Load conversations when component mounts or sheet opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const handleNewChat = () => {
    onNewChat();
    setIsOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    setIsOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete conversation');
      
      // If we're deleting the current conversation, start a new one
      if (id === currentConversationId) {
        onNewChat();
      }
      
      // Reload the conversations list
      loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <FileStack className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chat History</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="text-xl font-semibold">Your Conversations</SheetTitle>
        </SheetHeader>
        <div className="px-4 py-2">
          <Button 
            className="w-full gap-2 text-base py-6" 
            onClick={handleNewChat}
            disabled={isLoading}
          >
            <PlusCircle className="h-5 w-5" />
            Start New Chat
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          {isLoading ? (
            <div className="space-y-3 px-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 pb-4 px-4 max-w-full">
              {conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="bg-muted/50 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 mx-auto opacity-50" />
                  </div>
                  <h3 className="font-semibold mb-1">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start a new chat to begin your conversation
                  </p>
                  <Button onClick={handleNewChat} className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    New Chat
                  </Button>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} className="group relative">
                    <Button
                      variant={currentConversationId === conv.id ? "default" : "ghost"}
                      className={`w-full justify-start text-left p-4 h-auto rounded-lg hover:bg-zinc-200 transition-colors
                        ${currentConversationId === conv.id ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-zinc-100'}`}
                      onClick={() => handleSelectConversation(conv.id)}
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className="font-medium truncate break-all">
                          {truncateMessage(conv.firstMessage)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{formatDistanceToNow(new Date(conv.timestamp), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
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
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
} 