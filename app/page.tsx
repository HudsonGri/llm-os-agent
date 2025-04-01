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

// Chat Logo Component
const ChatLogo = ({ className, fill = "currentColor", ...props }: { 
  className?: string;
  fill?: string;
  [key: string]: any;
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 765.7 739.7" 
      className={className}
      {...props}
    >
      <path 
        d="M382.53,739.63c-83.49,0-166.98,.23-250.46-.12-29.48-.13-56.96-8.1-80.51-26.52-29.69-23.23-48.05-53.08-50.52-91.4-.82-12.78-.9-25.62-.91-38.43C.08,432.84,.37,282.53,0,132.22-.18,61.27,52.84,10.21,113.16,2.07c8.05-1.09,16.22-1.88,24.33-1.88,165.64-.1,331.29-.42,496.93,.11,68.34,.22,115.85,48.72,127.6,100.48,2.05,9.02,3.42,18.42,3.43,27.64,.2,161.31,.41,322.62,.02,483.93-.16,66.58-50.53,118.22-110.65,125.27-10.21,1.2-20.55,1.92-30.83,1.94-80.49,.16-160.98,.09-241.46,.09v-.02Zm248.57-387.31c-.81-8.14-1.5-18.61-2.95-28.97-6.44-45.72-25.6-85.4-57.64-118.64-49.45-51.31-110.72-75.59-181.21-77.88-28.09-.91-55.79,2.72-82.73,10.9-62.55,19.01-112.44,54.22-144.28,112.72-23.21,42.66-31.86,87.95-24.38,135.87,7.74,49.57,31.05,91.19,67.59,125.36,8.25,7.71,17.33,14.55,26.31,21.43,7.6,5.83,12.13,12.97,10.62,22.69-3.16,20.34-6.58,40.64-10.12,60.92-.75,4.3-1.46,8.32,2.29,11.47,3.78,3.18,7.73,1.8,11.71,.17,16.25-6.65,31.48-15.18,45.48-25.69,9.3-6.98,17.93-14.88,26.84-22.39,3.9-3.29,7.69-5.65,13.46-4.57,30.63,5.75,61.44,6.83,92.34,2.14,38.59-5.86,74.11-19.67,106.08-42.05,62.88-44,97.97-103.56,100.6-183.5ZM1.42,494.49c.08,0,.15,0,.23,0v-34.25c-.08,0-.15,0-.23,0v34.25Z"
        fill={fill}
      />
      <path 
        d="M631.1,352.32c-2.63,79.94-37.72,139.5-100.6,183.5-31.97,22.37-67.5,36.19-106.08,42.05-30.9,4.69-61.71,3.62-92.34-2.14-5.77-1.08-9.56,1.28-13.46,4.57-8.91,7.51-17.53,15.4-26.84,22.39-14,10.51-29.23,19.04-45.48,25.69-3.98,1.63-7.93,3.01-11.71-.17-3.75-3.16-3.04-7.18-2.29-11.47,3.54-20.28,6.96-40.58,10.12-60.92,1.51-9.73-3.02-16.87-10.62-22.69-8.98-6.88-18.07-13.72-26.31-21.43-36.54-34.17-59.85-75.79-67.59-125.36-7.48-47.92,1.16-93.2,24.38-135.87,31.84-58.5,81.73-93.72,144.28-112.72,26.94-8.19,54.64-11.81,82.73-10.9,70.49,2.28,131.76,26.57,181.21,77.88,32.04,33.25,51.21,72.92,57.64,118.64,1.46,10.36,2.14,20.83,2.95,28.97Zm-246.58,121.33c13.84-1.68,27.81-2.67,41.5-5.18,26.48-4.87,51.19-14.52,72.64-31.13,5.55-4.3,10.46-9.82,14.45-15.62,3.33-4.83,2.97-10.86-.67-15.98-3.31-4.66-8.28-5.6-13.38-4.47-2.95,.65-5.63,2.66-8.35,4.18-11.29,6.31-22.11,13.71-33.93,18.79-30.57,13.13-62.67,16.65-95.73,13.11-21.86-2.34-43.02-7.07-62.49-17.39-8.59-4.56-16.37-10.71-24.34-16.37-6.18-4.39-13.09-4.64-18.35-.17-5.07,4.32-6.31,11.19-2.94,17.71,1.21,2.34,2.56,4.87,4.51,6.52,7.73,6.51,15.08,13.81,23.74,18.82,31.82,18.42,66.68,25.8,103.33,27.18Zm-131.65-185.05c0,19.28,14.82,34.05,34.16,34.06,19.04,.01,33.95-14.91,34.2-34.25,.25-18.64-15.05-34.19-33.72-34.28-19.15-.09-34.65,15.33-34.64,34.46Zm226.07,34.11c19.15,0,34.23-15.11,34.16-34.21-.07-18.88-15.2-34.29-33.74-34.35-18.7-.07-34.28,15.51-34.33,34.34-.06,19.43,14.61,34.23,33.92,34.22Z"
        fill="#fff"
      />
      <path 
        d="M1.42,494.49v-34.25c.08,0,.15,0,.23,0v34.25c-.08,0-.15,0-.23,0Z"
        fill="#fff"
      />
      <path 
        d="M384.52,473.64c-36.65-1.38-71.5-8.76-103.33-27.18-8.65-5.01-16.01-12.31-23.74-18.82-1.96-1.65-3.3-4.18-4.51-6.52-3.37-6.52-2.14-13.4,2.94-17.71,5.26-4.47,12.17-4.23,18.35,.17,7.97,5.67,15.75,11.82,24.34,16.37,19.47,10.32,40.63,15.05,62.49,17.39,33.06,3.54,65.16,.02,95.73-13.11,11.82-5.08,22.63-12.49,33.93-18.79,2.73-1.52,5.4-3.53,8.35-4.18,5.1-1.12,10.08-.18,13.38,4.47,3.63,5.12,3.99,11.15,.67,15.98-3.99,5.8-8.9,11.32-14.45,15.62-21.46,16.61-46.16,26.27-72.64,31.13-13.69,2.52-27.66,3.51-41.5,5.18Z"
        fill={fill}
      />
      <path 
        d="M252.86,288.59c0-19.13,15.49-34.55,34.64-34.46,18.67,.09,33.97,15.63,33.72,34.28-.26,19.34-15.16,34.26-34.2,34.25-19.34-.01-34.15-14.79-34.16-34.06Z"
        fill={fill}
      />
      <path 
        d="M478.93,322.7c-19.3,0-33.98-14.8-33.92-34.22,.06-18.83,15.63-34.41,34.33-34.34,18.54,.07,33.67,15.47,33.74,34.35,.07,19.1-15.01,34.2-34.16,34.21Z"
        fill={fill}
      />
    </svg>
  );
};

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
    { text: "What topics should I review for Excercise 6", icon: Calendar },
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