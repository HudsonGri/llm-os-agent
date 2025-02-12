'use client';

import { useChat } from 'ai/react';
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
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    maxSteps: 3,
  });
  
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

  // Add scroll state management
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: 'smooth'
    });

    // Hide the button after scrolling
    setShowScrollButton(false);
  };

  // Handle scroll events
  const handleScroll = React.useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget;
    const isAtBottom = Math.abs((viewport.scrollHeight - viewport.clientHeight) - viewport.scrollTop) < 100;
    if (isAtBottom) {
      setShowScrollButton(false);
    } else {
      setShowScrollButton(true);
    }
  }, []);

  // Check scroll position on new messages
  React.useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    
    const isAtBottom = Math.abs((viewport.scrollHeight - viewport.clientHeight) - viewport.scrollTop) < 100;
    setShowScrollButton(!isAtBottom);
  }, [messages]);

  // Optimize source management with useCallback and useMemo
  const updateActiveSources = useCallback((message: Message) => {
    if (message?.role === 'assistant') {
      const sourceNumbers = extractSourceNumbers(message.content);
      const sourceInfo = message.toolInvocations
        ?.find(t => t.toolName === 'getInformation')
        ?.result;
      
      if (sourceInfo && isSourceResult(sourceInfo) && sourceNumbers.length > 0) {
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
  }, []);

  // Update sources only when messages change
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage) {
      updateActiveSources(latestMessage);
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
        <ScrollArea 
          className="flex-1"
          onScroll={handleScroll}
          ref={scrollAreaRef}
        >
          <div className="max-w-5xl mx-auto py-6 px-4">
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                isTopicResult={isTopicResult}
                extractSourceNumbers={extractSourceNumbers}
                TopicBadge={TopicBadge}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="relative">
          {showScrollButton && (
            <div className="absolute bottom-[calc(100%+1rem)] left-1/2 -translate-x-1/2 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollToBottom}
                className="h-8 px-3 py-2 bg-white/95 shadow-md border border-zinc-200 rounded-full flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
              >
                <ChevronDown className="h-3 w-3" />
                Scroll to bottom
              </Button>
            </div>
          )}
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

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  toolInvocations?: Array<{
    toolName: string;
    result?: {
      topic?: string;
      similarity?: number;
      name?: string;
      filename?: string;
      url?: string;
    } | Array<{
      topic?: string;
      similarity: number;
      name: string;
      filename?: string;
      url?: string;
    }>;
  }>;
}