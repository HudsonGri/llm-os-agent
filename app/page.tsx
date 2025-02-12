'use client';

import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { motion } from "framer-motion";
import { Markdown } from '@/components/markdown';
import AssistantMessage from '@/components/assistant';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import Image from "next/image";
import React from "react";

function extractSourceNumbers(content: string): number[] {
  const matches = content.matchAll(/【\{*source_(\d+)\}*】/g);
  const numbers = [...matches].map(match => parseInt(match[1]));
  return [...new Set(numbers)]; // Remove duplicates
}

function TopicBadge({ topic }: { topic: string }) {
  const colors: Record<string, string> = {
    General: 'bg-gray-100 text-gray-800',
    Architecture: 'bg-blue-100 text-blue-800',
    Development: 'bg-green-100 text-green-800',
    Security: 'bg-red-100 text-red-800',
    Database: 'bg-yellow-100 text-yellow-800',
    Frontend: 'bg-purple-100 text-purple-800',
    Backend: 'bg-indigo-100 text-indigo-800',
    DevOps: 'bg-orange-100 text-orange-800',
    Testing: 'bg-pink-100 text-pink-800',
    'Best Practices': 'bg-teal-100 text-teal-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[topic] || colors.General}`}>
      {topic}
    </span>
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
  const { messages, input, handleInputChange, handleSubmit } = useChat({
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

  // Update active sources when messages change
  React.useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.role === 'assistant') {
      const sourceNumbers = extractSourceNumbers(latestMessage.content);
      const sourceInfo = latestMessage.toolInvocations
        ?.find(t => t.toolName === 'getInformation')
        ?.result;
      
      if (sourceInfo && isSourceResult(sourceInfo) && sourceNumbers.length > 0) {
        const newSources = sourceNumbers.map(num => ({
          sourceNum: num,
          source: sourceInfo[num - 1],
          addedAt: new Date().getTime()
        }));
        setActiveSources(prev => {
          const combined = [...prev, ...newSources];
          return Array.from(new Map(combined.map(item => [item.sourceNum, item])).values());
        });
      }
    }
  }, [messages]);

  // Sort and filter sources
  const filteredAndSortedSources = React.useMemo(() => {
    let sources = [...activeSources];
    
    // Apply filter
    if (searchFilter) {
      sources = sources.filter(({ source }) => 
        source?.filename?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        source?.name?.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortBy === 'similarity') {
      sources.sort((a, b) => (b.source?.similarity || 0) - (a.source?.similarity || 0));
    } else {
      sources.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }
    
    return sources;
  }, [activeSources, sortBy, searchFilter]);

  return (
    <div className="flex w-full h-screen bg-zinc-50">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto py-6 px-4">
            {messages.map((m: Message, i) => (
              <div 
                key={m.id}
                className={cn(
                  "mb-6 last:mb-0",
                  m.role === "assistant" ? "ml-0" : "flex justify-end"
                )}
              >
                {m.role === "user" ? (
                  <div className="group relative max-w-[85%] lg:max-w-[65%]">
                    <div className="p-4 rounded-2xl bg-zinc-200/70 shadow-sm">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  </div>
                ) : m.role === "assistant" ? (
                  <div className="group relative max-w-[85%] lg:max-w-[65%] text-zinc-900">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="space-y-4">
                          <AssistantMessage message={m.content} />
                          
                          {/* Referenced Sources */}
                          {extractSourceNumbers(m.content).length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="pt-4 border-t border-zinc-200"
                            >
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.2 }}
                                className="text-xs text-zinc-500 mb-3"
                              >
                                Referenced Sources:
                              </motion.div>
                              <ScrollArea className="w-full whitespace-nowrap rounded-xl" type="always">
                                <div className="flex gap-2 pb-2 min-w-min">
                                  {extractSourceNumbers(m.content).map((sourceNum, index) => {
                                    const sourceInfo = m.toolInvocations
                                      ?.find(t => t.toolName === 'getInformation')
                                      ?.result as any[];
                                    const source = sourceInfo?.[sourceNum - 1];
                                    
                                    return (
                                      <motion.div
                                        key={sourceNum}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.1, duration: 0.2 }}
                                      >
                                        <HoverCard>
                                          <HoverCardTrigger asChild>
                                            <a
                                              href={source?.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block"
                                            >
                                              <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors border border-zinc-200">
                                                <span className="flex-none inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-zinc-700 text-white">
                                                  {sourceNum}
                                                </span>
                                                <div className="text-sm min-w-0">
                                                  <div className="font-medium truncate text-zinc-900">
                                                    {source?.filename || `Source ${sourceNum}`}
                                                  </div>
                                                  <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                                    <span className="inline-block w-1 h-1 rounded-full bg-zinc-400" />
                                                    Click to view source
                                                  </div>
                                                </div>
                                              </div>
                                            </a>
                                          </HoverCardTrigger>
                                          <HoverCardContent 
                                            side="top" 
                                            className="w-80 p-0 overflow-hidden bg-white border border-zinc-200 shadow-lg"
                                          >
                                            <div className="relative aspect-video bg-zinc-100">
                                              <Image
                                                src="/placeholder.png"
                                                alt="Preview"
                                                fill
                                                className="object-cover transition-all"
                                                sizes="320px"
                                              />
                                            </div>
                                            <div className="p-3">
                                              <div className="font-medium text-sm mb-1 text-zinc-900">
                                                {source?.filename || `Source ${sourceNum}`}
                                              </div>
                                              <p className="text-xs text-zinc-500 line-clamp-2">
                                                Preview of the matching slide.
                                              </p>
                                            </div>
                                          </HoverCardContent>
                                        </HoverCard>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            </motion.div>
                          )}

                          {/* Dev Info */}
                          {m?.toolInvocations && m.toolInvocations.length > 0 && (
                            <Collapsible className="space-y-2">
                              <CollapsibleTrigger className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-700 transition-colors">
                                <ChevronDown className="h-3 w-3" />
                                <span>View Dev Info</span>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="space-y-3 pt-2">
                                {m.toolInvocations.map((tool, toolIndex) => (
                                  <div key={toolIndex} className="space-y-2">
                                    <span className="text-xs italic text-zinc-500 block">
                                      {'DEV: Results from: ' + tool.toolName}
                                    </span>
                                    {tool.toolName === 'getInformation' && tool.result && (
                                      <div className="space-y-2">
                                        <ScrollArea className="h-[200px] rounded-xl border border-zinc-200">
                                          <div className="p-2 space-y-2">
                                            {Array.isArray(tool.result) && tool.result.map((result: any, i: number) => (
                                              <div key={i} className="p-3 rounded-lg bg-zinc-50 space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <div className="font-medium text-sm text-zinc-900">Content #{i + 1}</div>
                                                  <div className="text-zinc-500 text-xs">
                                                    Similarity: {(result.similarity * 100).toFixed(1)}%
                                                  </div>
                                                </div>
                                                <div className="text-zinc-600 text-sm border-t border-zinc-200 pt-2">
                                                  {result.name}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </ScrollArea>
                                      </div>
                                    )}
                                    {tool.toolName === 'tagResponse' && tool.result && (
                                      <div className="p-3 rounded-lg bg-zinc-50">
                                        <div className="text-sm text-zinc-900">
                                          <div className="font-medium">Topic: {tool.result.topic}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-zinc-200 bg-white/80 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
            <div className="flex gap-3">
              <Input
                value={input}
                placeholder="Message..."
                onChange={handleInputChange}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                className="bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l border-zinc-200 bg-white hidden lg:block">
        <div className="p-4 border-b border-zinc-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">Referenced Sources</h2>
            <span className="text-xs text-zinc-500">
              {activeSources.length} source{activeSources.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-2">
            <Input
              placeholder="Search sources..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="h-8 text-sm"
            />
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                className="text-xs flex-1 h-8"
                onClick={() => setSortBy('recent')}
              >
                Most Recent
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'similarity' ? 'default' : 'outline'}
                className="text-xs flex-1 h-8"
                onClick={() => setSortBy('similarity')}
              >
                Best Match
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-9.5rem)]">
          <div className="p-4 space-y-4">
            {filteredAndSortedSources.length === 0 ? (
              <div className="text-center text-sm text-zinc-500 p-4">
                {searchFilter ? 'No matching sources found' : 'No sources referenced yet'}
              </div>
            ) : (
              filteredAndSortedSources.map(({ sourceNum, source }) => (
                <Card key={sourceNum} className="overflow-hidden group">
                  <div className="relative h-24 bg-zinc-100">
                    <Image
                      src="/placeholder.png"
                      alt="Source preview"
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
                      <span className="text-sm font-medium truncate">
                        {source?.filename || `Source ${sourceNum}`}
                      </span>
                      <span className="flex-none bg-zinc-900/40 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                        #{sourceNum}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <div className="text-sm text-zinc-600 line-clamp-2">
                      {source?.name || 'No preview available'}
                    </div>
                    
                    <div className="space-y-1.5">
                      {source?.similarity && (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-full bg-zinc-100 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full" 
                              style={{ width: `${source.similarity * 100}%` }}
                            />
                          </div>
                          <span className="flex-none tabular-nums text-zinc-600">
                            {(source.similarity * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs flex-1 group-hover:bg-zinc-100"
                          asChild
                        >
                          <a
                            href={source?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Source
                          </a>
                        </Button>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 group-hover:bg-zinc-100"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent 
                            side="left" 
                            className="w-80 p-0 overflow-hidden bg-white border border-zinc-200 shadow-lg"
                          >
                            <div className="relative aspect-video bg-zinc-100">
                              <Image
                                src="/placeholder.png"
                                alt="Preview"
                                fill
                                className="object-cover"
                                sizes="320px"
                              />
                            </div>
                            <div className="p-3">
                              <div className="font-medium text-sm mb-1 text-zinc-900">
                                {source?.filename || `Source ${sourceNum}`}
                              </div>
                              <p className="text-xs text-zinc-500">
                                {source?.name || 'No preview available'}
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function SendIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}