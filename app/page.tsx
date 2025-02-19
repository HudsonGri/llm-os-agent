'use client';

import { useChat, Message } from 'ai/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown } from "lucide-react";
import React, { useCallback, useEffect, useMemo } from "react";
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { TopicBadge } from '@/components/chat/topic-badge';

function extractSourceNumbers(content: string): number[] {
  const matches = content.matchAll(/【\{*source_(\d+)\}*】/g);
  const numbers = [...matches].map(match => parseInt(match[1]));
  return [...new Set(numbers)]; // Remove duplicates
}

// Type guard functions
function isTopicResult(result: any): result is { topic: string } {
  return result && typeof result.topic === 'string';
}

function isSourceResult(result: any): result is Array<{
  similarity: number;
  name: string;
  filename?: string;
  url?: string;
}> {
  return Array.isArray(result) && result.length > 0 && typeof result[0].similarity === 'number';
}

export default function Chat() {
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [initialMessages, setInitialMessages] = React.useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);

  // Load conversation history when conversationId is set
  React.useEffect(() => {
    if (!conversationId) {
      const match = document.cookie.match(new RegExp('(^| )conversationId=([^;]+)'));
      if (match) {
        setConversationId(match[2]);
      }
      return;
    }

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
    id: conversationId || undefined,
    initialMessages,
    body: {
      conversationId,
    },
  });

  console.log("Loading on start:", messages);
  
  // Track active sources in the sidebar
  const [activeSources, setActiveSources] = React.useState<Array<{
    sourceNum: number;
    source: any;
    addedAt: number;
  }>>([]);

  // Add sorting state
  const [sortBy, setSortBy] = React.useState<'recent' | 'similarity'>('recent');
  // Add filter state
  const [searchFilter, setSearchFilter] = React.useState('');
  // Add sidebar view state
  const [sidebarView, setSidebarView] = React.useState<'sources' | 'dev'>('sources');

  // Add a ref to track the last processed assistant message
  const lastAssistantMessageIdRef = React.useRef<string | null>(null);

  // Optimize source management with useCallback and useMemo
  const updateActiveSources = useCallback((message: Message) => {
    if (message?.role === 'assistant') {
      const sourceNumbers = extractSourceNumbers(message.content);
      const toolInvocation = message.toolInvocations?.find(t => 
        t.state === 'result' && 
        'toolName' in t && 
        t.toolName === 'getInformation'
      );
      
      if (toolInvocation?.state === 'result' && sourceNumbers.length > 0) {
        const sourceInfo = toolInvocation.result;
        if (Array.isArray(sourceInfo)) {
          const newSources = sourceNumbers.map(num => ({
            sourceNum: num,
            source: sourceInfo[num - 1],
            addedAt: new Date().getTime()
          }));
          
          setActiveSources(prev => {
            const sourceMap = new Map(prev.map(item => [item.sourceNum, item]));
            newSources.forEach(item => sourceMap.set(item.sourceNum, item));
            return Array.from(sourceMap.values());
          });
        }
      }
    }
  }, []);

  // Update sources only when messages change, now with guard to prevent infinite update loop
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.role === 'assistant' && latestMessage.id !== lastAssistantMessageIdRef.current) {
      updateActiveSources(latestMessage);
      lastAssistantMessageIdRef.current = latestMessage.id;
    }
  }, [messages, updateActiveSources]);

  // Memoize filtered and sorted sources
  const filteredAndSortedSources = useMemo(() => {
    let sources = [...activeSources];
    
    if (searchFilter) {
      const filter = searchFilter.toLowerCase();
      sources = sources.filter(({ source }) => 
        (source?.filename?.toLowerCase() || '').includes(filter) ||
        (source?.name?.toLowerCase() || '').includes(filter)
      );
    }
    
    return sources.sort((a, b) => 
      sortBy === 'similarity' 
        ? (b.source?.similarity || 0) - (a.source?.similarity || 0)
        : (b.addedAt || 0) - (a.addedAt || 0)
    );
  }, [activeSources, sortBy, searchFilter]);

  return (
    <div className="flex w-full h-screen bg-zinc-50">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
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

      {/* Sidebar */}
      <ChatSidebar
        sidebarView={sidebarView}
        setSidebarView={setSidebarView}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        activeSources={activeSources}
        filteredAndSortedSources={filteredAndSortedSources}
        messages={messages}
      />
    </div>
  );
}