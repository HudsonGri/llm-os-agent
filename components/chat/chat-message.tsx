import { motion } from "framer-motion";
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/markdown';
import AssistantMessage from '@/components/assistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import Image from "next/image";
import { MessageRating } from './message-rating';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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

interface ChatMessageProps {
  message: Message;
  isTopicResult: (result: any) => result is { topic: string };
  extractSourceNumbers: (content: string) => number[];
  TopicBadge: React.ComponentType<{ topic: string }>;
  onRegenerate?: () => void;
  isComplete?: boolean;
}

export function ChatMessage({ message: m, isTopicResult, extractSourceNumbers, TopicBadge, onRegenerate, isComplete }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "mb-6 last:mb-0",
        m.role === "assistant" ? "ml-0" : "flex justify-end"
      )}
    >
      {m.role === "user" ? (
        <div className="group relative max-w-[85%] lg:max-w-[65%]">
          <div className="mb-2 flex justify-end">
            {(() => {
              const tagResult = m.toolInvocations?.find(t => t.toolName === "tagResponse")?.result;
              return isTopicResult(tagResult) && tagResult.topic ? (
                <TopicBadge topic={tagResult.topic} />
              ) : null;
            })()}
          </div>
          <div className="p-4 rounded-3xl bg-zinc-200/70">
            <Markdown>{m.content}</Markdown>
          </div>
        </div>
      ) : m.role === "assistant" ? (
        <div className="group relative max-w-[95%] lg:max-w-[85%] text-zinc-900">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  {!m.content && m.role === 'assistant' ? (
                    <div
                      className="p-4 flex items-center gap-3"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                      <span className="text-sm text-zinc-500">Generating response...</span>
                    </div>
                  ) : (
                    <div>
                      <AssistantMessage
                        message={{
                          content: m.content,
                          toolInvocations: m.toolInvocations?.map(t => ({
                            toolName: t.toolName,
                            result: t.result
                          }))
                        }}
                      />
                    </div>
                  )}

                  {/* Rating buttons integrated with the message */}
                  {isComplete && m.role === 'assistant' && (
                    <div className="mt-2">
                      <MessageRating
                        messageId={m.id}
                        isComplete={isComplete}
                        onRegenerate={onRegenerate}
                        content={m.content}
                      />
                    </div>
                  )}
                </div>


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
                      className="text-xs text-zinc-500 mb-3 flex items-center justify-between"
                    >
                      <span>Referenced Sources:</span>
                    </motion.div>
                    <div className="relative">
                      <ScrollArea className="w-full rounded-xl max-w-full" type="always">
                        <div className="flex flex-wrap gap-2 pb-2">
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
                                className="flex-none"
                              >
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
                                        Click to visit source
                                      </div>
                                    </div>
                                  </div>
                                </a>
                              </motion.div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Similar Sources Section */}
                    {m.toolInvocations?.find(t => t.toolName === 'getInformation')?.result && (
                      <SimilarSources 
                        sources={m.toolInvocations.find(t => t.toolName === 'getInformation')?.result as any[]} 
                        citedSourceNumbers={extractSourceNumbers(m.content)}
                      />
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface SimilarSourcesProps {
  sources: Array<{
    similarity: number;
    filename?: string;
    url?: string;
    name?: string;
  }>;
  citedSourceNumbers: number[];
}

function SimilarSources({ sources, citedSourceNumbers }: SimilarSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get cited source filenames for duplicate checking
  const citedSourceFilenames = new Set(
    citedSourceNumbers.map(num => {
      const source = sources[num - 1];
      return source?.filename || source?.name || '';
    })
  );

  // Filter out cited sources and duplicates
  const uncitedSources = sources.filter((source, index) => {
    const filename = source.filename || source.name || '';
    // Skip if already cited or if we've seen this filename before
    if (citedSourceNumbers.includes(index + 1) || citedSourceFilenames.has(filename)) {
      return false;
    }
    // Add filename to set and include this source
    citedSourceFilenames.add(filename);
    return true;
  }).sort((a, b) => (b.similarity || 0) - (a.similarity || 0)); // Sort by similarity

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    // Only add listener when expanded
    if (isExpanded) {
      // Use capture phase to ensure we get the event first
      document.addEventListener('mousedown', handleClickOutside, true);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isExpanded]);

  // Close on ESC key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    }
    
    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  if (uncitedSources.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.2 }}
      className="mt-3 flex items-start"
    >
      <div className="relative inline-block" ref={dropdownRef}>
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 py-1 px-2 text-xs text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
        >
          <span className="inline-block w-1 h-1 rounded-full bg-zinc-400" />
          <span className="font-medium">{isExpanded ? "Hide" : `${uncitedSources.length} similar`}</span>
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 min-w-[18rem] max-w-[32rem] z-10"
          >
            <div className="bg-white rounded-lg shadow-lg border border-zinc-200 overflow-hidden">
              <ScrollArea className="max-h-[200px]">
                <div className="p-1 space-y-1">
                  {uncitedSources.map((source, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.15 }}
                    >
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block whitespace-nowrap"
                      >
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-zinc-50 transition-colors">
                          <div className="flex-none text-xs font-medium text-zinc-500">
                            {Math.round(source.similarity * 100)}%
                          </div>
                          <div className="text-sm text-zinc-700 font-medium">
                            {source.filename || source.name || "Untitled Source"}
                          </div>
                        </div>
                      </a>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 