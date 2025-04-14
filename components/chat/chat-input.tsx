import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, Square, Lightbulb } from "lucide-react";
import { useRef, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent, reasoning?: boolean) => void;
  isLoading: boolean;
  stop: () => void;
  variant?: 'default' | 'empty';
  reasoningEnabled?: boolean;
  onReasoningChange?: (enabled: boolean) => void;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  variant = 'default',
  reasoningEnabled = false,
  onReasoningChange
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max height of 200px
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Handle enter and shift+enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSubmit(e, reasoningEnabled);
      }
    }
  };

  const toggleReasoning = () => {
    if (onReasoningChange) {
      onReasoningChange(!reasoningEnabled);
    }
  };

  const isEmptyVariant = variant === 'empty';

  return (
    <div className={isEmptyVariant ? '' : "border-t border-zinc-200 bg-white py-4"}>
      <form onSubmit={(e) => handleSubmit(e, reasoningEnabled)} className={isEmptyVariant ? '' : "max-w-3xl mx-auto px-4"}>
        <div className="relative flex items-start">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              placeholder="Ask anything..."
              onChange={(e) => handleInputChange(e as any)}
              onKeyDown={handleKeyDown}
              rows={1}
              className={`pl-4 pr-12 py-3.75 w-full text-sm text-zinc-900 ${
                isEmptyVariant 
                  ? 'bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 focus:border-zinc-300'
                  : 'bg-zinc-100 border border-zinc-200'
              } rounded-2xl focus:outline-none resize-none overflow-y-auto transition-all duration-300`}
              style={{ minHeight: '52px', maxHeight: '200px' }}
            />
            <div className="absolute right-1.5 bottom-[17px] flex space-x-1">
              <TooltipProvider>
                <Tooltip delayDuration={10}>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button" 
                      size="icon"
                      onClick={toggleReasoning}
                      className={`h-8 w-8 ${
                        reasoningEnabled
                          ? 'bg-yellow-100 hover:bg-yellow-200 border border-yellow-300'
                          : 'bg-transparent border border-zinc-300 hover:bg-zinc-100'
                      } rounded-full transition-colors`}
                    >
                      <Lightbulb className={`h-4 w-4 ${reasoningEnabled ? 'text-yellow-600' : 'text-zinc-600'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {reasoningEnabled ? "Reasoning enabled" : "Enable reasoning"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button 
                type="button" 
                size="icon"
                onClick={isLoading ? stop : (e) => handleSubmit(e as any, reasoningEnabled)}
                className={`h-8 w-8 ${
                  isEmptyVariant
                    ? 'bg-zinc-900 hover:bg-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-700'
                } rounded-full transition-colors`}
                disabled={!isLoading && !input.trim()}
              >
                {isLoading ? (
                  <Square fill="white" className="h-3 w-3" />
                ) : (
                  <ArrowUp className="h-5 w-5 text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 