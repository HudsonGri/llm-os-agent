'use client';

import { useChat, Message } from 'ai/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import React, { useEffect } from "react";
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatInput } from '@/components/chat/chat-input';
import { TopicBadge } from '@/components/chat/topic-badge';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChatHistory } from '@/components/chat/chat-history';
import { PlusCircle, SquarePen } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function for message parsing
function extractSourceNumbers(content: string): number[] {
  const matches = content.matchAll(/【\{*source_(\d+)\}*】/g);
  const numbers = [...matches].map(match => parseInt(match[1]));
  return [...new Set(numbers)]; // Remove duplicates
}

function isTopicResult(result: any): result is { topic: string } {
  return result && typeof result.topic === 'string';
}

export default function Chat() {
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [initialMessages, setInitialMessages] = React.useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);

  // Load most recent chat or existing chat from cookie
  useEffect(() => {
    async function initializeChat() {
      // First check cookie for existing conversation
      const match = document.cookie.match(new RegExp('(^| )conversationId=([^;]+)'));
      if (match && !conversationId) {
        setConversationId(match[2]);
        return;
      }

      // If no conversation in cookie, fetch most recent conversation
      if (!conversationId) {
        try {
          const response = await fetch('/api/chat/conversations');
          if (!response.ok) throw new Error('Failed to load conversations');
          const conversations = await response.json();
          
          if (conversations.length > 0) {
            // Set the most recent conversation
            const mostRecentId = conversations[0].id;
            document.cookie = `conversationId=${mostRecentId}; Path=/`;
            setConversationId(mostRecentId);
          } else {
            // No existing conversations, create new one
            const newId = crypto.randomUUID();
            document.cookie = `conversationId=${newId}; Path=/`;
            setConversationId(newId);
          }
        } catch (error) {
          console.error('Error loading most recent chat:', error);
          // Fallback to new conversation
          const newId = crypto.randomUUID();
          document.cookie = `conversationId=${newId}; Path=/`;
          setConversationId(newId);
        }
      }
    }

    initializeChat();
  }, []); // Only run on initial mount

  // Load conversation history when conversationId changes
  useEffect(() => {
    if (!conversationId) return;

    async function loadConversationHistory() {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(`/api/chat/history?conversationId=${conversationId}`);
        if (!response.ok) throw new Error('Failed to load chat history');
        const history = await response.json();
        setInitialMessages(history);
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadConversationHistory();
  }, [conversationId]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, reload } = useChat({
    maxSteps: 3,
    id: conversationId as string,
    initialMessages,
    body: {
      conversationId,
    },
  });

  const handleNewChat = () => {
    // Generate new ID for the new chat
    const newId = crypto.randomUUID();
    document.cookie = `conversationId=${newId}; Path=/`;
    setConversationId(newId);
    setInitialMessages([]);
  };

  return (
    <div className="flex w-full h-screen bg-zinc-50">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNewChat}
                >
                  <SquarePen className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New Chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ChatHistory
            currentConversationId={conversationId}
            onSelectConversation={setConversationId}
            onNewChat={handleNewChat}
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="max-w-5xl mx-auto py-6 px-4">
            {messages.map((m, index) => {
              const isLastMessage = index === messages.length - 1;
              const isComplete = m.role === 'user' || (!isLastMessage || !isLoading);
              return (
                <ChatMessage
                  key={m.id}
                  message={m}
                  isTopicResult={isTopicResult}
                  extractSourceNumbers={extractSourceNumbers}
                  TopicBadge={TopicBadge}
                  onRegenerate={m.role === 'assistant' ? () => reload() : undefined}
                  isComplete={isComplete}
                />
              );
            })}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <ChatMessage
                key="loading"
                message={{
                  id: 'loading',
                  role: 'assistant',
                  content: '',
                }}
                isTopicResult={isTopicResult}
                extractSourceNumbers={extractSourceNumbers}
                TopicBadge={TopicBadge}
                isComplete={false}
              />
            )}

          </div>
        </ScrollArea>

        <div className="relative">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
          />
        </div>
      </div>
    </div>
  );
}