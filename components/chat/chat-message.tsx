import { motion } from "framer-motion";
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/markdown';
import AssistantMessage from '@/components/assistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import Image from "next/image";

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
}

export function ChatMessage({ message: m, isTopicResult, extractSourceNumbers, TopicBadge }: ChatMessageProps) {
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
          <div className="p-4 rounded-2xl bg-zinc-200/70 shadow-sm">
            <Markdown>{m.content}</Markdown>
          </div>
        </div>
      ) : m.role === "assistant" ? (
        <div className="group relative max-w-[95%] lg:max-w-[85%] text-zinc-900">
          <div className="mb-2">
            {(() => {
              const tagResult = m.toolInvocations?.find(t => t.toolName === "tagResponse")?.result;
              return isTopicResult(tagResult) && tagResult.topic ? (
                <TopicBadge topic={tagResult.topic} />
              ) : null;
            })()}
          </div>
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
                    </div>
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