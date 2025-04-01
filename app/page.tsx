'use client';

import { useChat, Message } from 'ai/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import React, { useEffect, useCallback, useState } from "react";
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatInput } from '@/components/chat/chat-input';
import { TopicBadge } from '@/components/chat/topic-badge';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChatHistory } from '@/components/chat/chat-history';
import { SquarePen, Sparkles, BookOpen, Code, Terminal, RefreshCw, Calendar, File } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from 'next/link';
import { ChatLogo } from '@/components/ui/chat-logo';

// Helper function for message parsing
function extractSourceNumbers(content: string): number[] {
  const matches = content.matchAll(/【\{*source_(\d+)\}*】/g);
  const numbers = [...matches].map(match => parseInt(match[1]));
  return [...new Set(numbers)]; // Remove duplicates
}

function isTopicResult(result: any): result is { topic: string } {
  return result && typeof result.topic === 'string';
}

// Simplified error message component
function ErrorMessageComponent({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <div className="mb-8">
      <div className="flex items-start">
        <div className="border border-red-100 bg-red-50 rounded-xl p-4 mr-12 break-words w-full max-w-3xl">
          <div className="text-zinc-600">{message}</div>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
              onClick={onRetry}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Response
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [initialMessages, setInitialMessages] = React.useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [reloadChatHistory, setReloadChatHistory] = React.useState<((skipLoadingState?: boolean) => Promise<void>) | null>(null);
  const [userMessageCache, setUserMessageCache] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create a new conversation ID
  const createNewConversation = useCallback(() => {
    const newId = crypto.randomUUID();
    document.cookie = `conversationId=${newId}; Path=/`;
    setConversationId(newId);
    return newId;
  }, []);

  // Handle errors and provide a fallback
  const handleError = useCallback((error: any, errorMsg: string) => {
    console.error(errorMsg, error);
    setErrorMessage(errorMsg);
    return createNewConversation();
  }, [createNewConversation]);

  // Check session status on load
  useEffect(() => {
    async function checkSessionStatus() {
      try {
        const response = await fetch('/api/auth?action=check');
        if (!response.ok) {
          // Redirect to access page if not authenticated
          window.location.href = '/access';
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    }

    checkSessionStatus();
  }, []);

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
          if (!response.ok) {
            throw new Error(`Failed to load conversations: ${response.status}`);
          }

          const conversations = await response.json();

          if (conversations.length > 0) {
            // Set the most recent conversation
            const mostRecentId = conversations[0].id;
            document.cookie = `conversationId=${mostRecentId}; Path=/`;
            setConversationId(mostRecentId);
          } else {
            // No existing conversations, create new one
            createNewConversation();
          }
        } catch (error) {
          handleError(error, 'Unable to load chat history. Starting a new conversation.');
        }
      }
    }

    initializeChat();
  }, [conversationId, createNewConversation, handleError]);

  // Load conversation history when conversationId changes
  useEffect(() => {
    if (!conversationId) return;

    async function loadConversationHistory() {
      setIsLoadingHistory(true);
      setErrorMessage(null); // Clear any previous errors

      try {
        const response = await fetch(`/api/chat/history?conversationId=${conversationId}`);
        if (!response.ok) {
          throw new Error(`Failed to load chat history: ${response.status}`);
        }

        setInitialMessages(await response.json());
      } catch (error) {
        console.error('Error loading chat history:', error);
        setErrorMessage('Failed to load chat history. You can still send new messages.');
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadConversationHistory();
  }, [conversationId]);

  // Set up chat with error handling
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, reload } = useChat({
    maxSteps: 3,
    id: conversationId as string,
    initialMessages,
    body: { conversationId },
    onFinish: () => {
      // Reload chat history when a message exchange is completed
      if (reloadChatHistory) {
        reloadChatHistory(true); // Skip loading state
      }
    },
    onError: (error) => {
      console.error('Chat API error:', error);
      setErrorMessage(error.message || 'An error occurred while processing your request. Please try again.');
    }
  });

  // Handle retrying after an error
  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    reload();
  }, [reload]);

  // Wrapper for handleSubmit to ensure new conversations appear in history
  const handleSubmitWithHistoryReload = useCallback((e: React.FormEvent) => {
    // Clear any previous error
    setErrorMessage(null);

    // Store the user message before submitting
    const userMessage = input.trim();
    if (!userMessage) return;

    // Submit the message
    handleSubmit(e);

    // Store user message in the cache for immediate display
    if (conversationId) {
      setUserMessageCache(prev => ({
        ...prev,
        [conversationId]: userMessage
      }));
    }

    // Handle first message in a conversation
    if (messages.length === 0 && reloadChatHistory) {
      // Reload to ensure the chat appears in history
      reloadChatHistory(true);

      // Then reload again after a short delay
      setTimeout(() => reloadChatHistory(true), 1000);
    }
  }, [handleSubmit, input, conversationId, messages.length, reloadChatHistory]);

  const handleNewChat = useCallback(() => {
    const newId = createNewConversation();

    // Clear any existing cached messages for this new ID
    setUserMessageCache(prev => {
      const updated = { ...prev };
      delete updated[newId];
      return updated;
    });

    setInitialMessages([]);
  }, [createNewConversation]);

  // Sample questions for empty state
  const sampleQuestions = [
    { text: "What does a void pointer do?", icon: Sparkles },
    { text: "What do we need to submit for Project 2" , icon: File },
    { text: "What is the penalty for submitting assignments late?", icon: BookOpen },
    { text: "What topics should I review for Exercise 6", icon: Calendar },
  ];

  // Function for handling preset sample questions
  const handleSampleQuestion = useCallback((question: string) => {
    // Set input and prepare submission
    handleInputChange({ target: { value: question } } as React.ChangeEvent<HTMLInputElement>);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;

    // Cache the question
    if (conversationId) {
      setUserMessageCache(prev => ({
        ...prev,
        [conversationId]: question
      }));
    }

    // Different handling for first message vs follow-up
    if (messages.length === 0 && reloadChatHistory) {
      handleSubmit(fakeEvent);
      reloadChatHistory(true);
      setTimeout(() => reloadChatHistory(true), 1000);
    } else {
      handleSubmitWithHistoryReload(fakeEvent);
    }
  }, [conversationId, handleInputChange, handleSubmit, handleSubmitWithHistoryReload, messages.length, reloadChatHistory]);

  // Function to receive the reload function from ChatHistory
  const handleReloadChatHistory = useCallback((reloadFn: (skipLoadingState?: boolean) => Promise<void>) => {
    setReloadChatHistory(() => reloadFn);
  }, []);

  useEffect(() => {
    if (conversationId && messages.length === 0) {
      const match = document.cookie.match(new RegExp('(^| )samplePrompt=([^;]+)'));
      if (match) {
        const samplePrompt = decodeURIComponent(match[2]);
        handleInputChange({ target: { value: samplePrompt } } as React.ChangeEvent<HTMLInputElement>);
        document.cookie = "samplePrompt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/;";
      }
    }
  }, [conversationId, messages.length, handleInputChange]);

  // Check if we should show the error message in the chat
  const shouldShowErrorInChat = errorMessage && messages.length > 0 && messages[messages.length - 1].role === 'user';

  // Check if we should show the loading indicator
  const shouldShowLoading = isLoading && messages[messages.length - 1]?.role === 'user' && !errorMessage;

  return (
    <div className="flex w-full h-screen bg-zinc-50">
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Add gradient and dot grid pattern background */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-zinc-100 to-zinc-50 pointer-events-none transition-opacity duration-250 ${
            messages.length > 0 ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <div 
          className={`absolute inset-0 bg-[radial-gradient(#e0e0e0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none transition-opacity duration-250 ${
            messages.length > 0 ? 'opacity-0' : 'opacity-50'
          }`}
        />
        
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
            {/* White container for content */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 w-full max-w-2xl relative z-20">
              <div className="flex flex-col items-center mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <ChatLogo className="w-14 h-14" fill="#3c74d4" />
                  <h1 className="text-4xl font-semibold text-zinc-900">OS Chat Assistant</h1>
                </div>
                <p className="text-zinc-500 text-center">Your 24/7 helper for Operating Systems (COP600)</p>
              </div>
              
              {errorMessage && (
                <div className="w-full mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {errorMessage}
                </div>
              )}
              <div className="w-full space-y-4">
                <div className="relative">
                  <ChatInput
                    input={input}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmitWithHistoryReload}
                    isLoading={isLoading}
                    stop={stop}
                    variant="empty"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 mt-8">
                  {sampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start gap-3 py-6 text-left text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 rounded-2xl border-zinc-200"
                      onClick={() => handleSampleQuestion(question.text)}
                    >
                      <question.icon className="h-5 w-5 text-[#3c74d4]" />
                      {question.text}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer links */}
            <div className="absolute bottom-6 flex gap-6 text-xs text-zinc-500">
              <Link href="/about" className="hover:text-zinc-800 transition-colors">More Information</Link>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto py-6 px-4">
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

                {/* Show error message in the chat flow */}
                {shouldShowErrorInChat && (
                  <ErrorMessageComponent
                    message={errorMessage}
                    onRetry={handleRetry}
                  />
                )}

                {/* Show loading indicator */}
                {shouldShowLoading && (
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

            <ChatInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmitWithHistoryReload}
              isLoading={isLoading}
              stop={stop}
            />
          </>
        )}
      </div>
      <ChatHistory
        currentConversationId={conversationId}
        onSelectConversation={setConversationId}
        onNewChat={handleNewChat}
        reloadConversations={handleReloadChatHistory}
        userMessageCache={userMessageCache}
      />
    </div>
  );
}