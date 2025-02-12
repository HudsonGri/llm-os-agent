'use client';

import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
      similarity: number;
      name: string;
      filename?: string;
      url?: string;
    }>;
  }>;
}

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    maxSteps: 3,
  });
  
  return (
    <div className="flex flex-col w-full h-screen bg-background">
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-2xl mx-auto py-6 space-y-4">
          {messages.map((m: Message) => (
            <Card 
              key={m.id} 
              className={cn(
                "px-4 py-3 rounded-lg",
                m.role === "assistant" ? "bg-background border" : "bg-muted"
              )}
            >
              <div className="whitespace-pre-wrap">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                  <span className="capitalize">{m.role}</span>
                  {m.role === "assistant" && m?.toolInvocations?.find(t => t.toolName === "tagResponse")?.result?.topic && (
                    <TopicBadge topic={m.toolInvocations.find(t => t.toolName === "tagResponse")!.result.topic} />
                  )}
                </div>
                <div className="text-sm">
                  {m.role === "assistant" ? (
                    <AssistantMessage message={m.content} />
                  ) : (
                    <Markdown>{m.content}</Markdown>
                  )}
                  
                  {m.role === "assistant" && extractSourceNumbers(m.content).length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="mt-4 border-t pt-3"
                    >
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.2 }}
                        className="text-xs text-muted-foreground mb-2"
                      >
                        Referenced Sources:
                      </motion.div>
                      <ScrollArea className="w-full whitespace-nowrap rounded-md" type="always">
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
                                <Card className="flex-none p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center space-x-2">
                                    <span className="flex-none inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                      {sourceNum}
                                    </span>
                                    <div className="text-sm">
                                      <div className="font-medium">
                                        {source?.filename || `Source ${sourceNum}`}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {source?.url ? (
                                          <a 
                                            href={source.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:underline"
                                          >
                                            View source
                                          </a>
                                        ) : (
                                          'No URL available'
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}

                  {m?.toolInvocations && m.toolInvocations.length > 0 && (
                    <Collapsible className="space-y-2 mt-3">
                      <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronDown className="h-4 w-4" />
                        <span>View Dev Info</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4">
                        {m.toolInvocations.map((tool, toolIndex) => (
                          <div key={toolIndex} className="space-y-2">
                            <span className="italic text-muted-foreground block">
                              {'DEV: Results from: ' + tool.toolName}
                            </span>
                            {tool.toolName === 'getInformation' && tool.result && (
                              <div className="space-y-2">
                                <ScrollArea className="h-[200px] rounded-md border">
                                  <div className="p-2 space-y-2">
                                    {Array.isArray(tool.result) && tool.result.map((result: any, i: number) => (
                                      <Card key={i} className="p-3 bg-muted/50">
                                        <div className="text-sm space-y-2">
                                          <div className="flex items-center justify-between">
                                            <div className="font-medium">Content #{i + 1}</div>
                                            <div className="text-muted-foreground text-xs">
                                              Similarity: {(result.similarity * 100).toFixed(1)}%
                                            </div>
                                          </div>
                                          <div className="text-muted-foreground border-t pt-2">
                                            {result.name}
                                          </div>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            )}
                            {tool.toolName === 'tagResponse' && tool.result && (
                              <div className="space-y-2">
                                <Card className="p-3 bg-muted/50">
                                  <div className="text-sm">
                                    <div className="font-medium">Topic: {tool.result.topic}</div>
                                  </div>
                                </Card>
                              </div>
                            )}
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t bg-background">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4">
          <div className="flex gap-3">
            <Input
              value={input}
              placeholder="Message..."
              onChange={handleInputChange}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </form>
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