import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, Square } from "lucide-react";
import { useRef, useEffect } from 'react';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  stop: () => void;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop
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
        handleSubmit(e);
      }
    }
  };

  return (
    <div className="border-t border-zinc-200 bg-white/80 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
        <div className="relative flex items-start">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              placeholder="Message..."
              onChange={(e) => handleInputChange(e as any)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="pl-4 pr-12 py-3 w-full text-sm text-zinc-900 bg-zinc-100 rounded-2xl border-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-600/20 focus-visible:ring-offset-1 resize-none overflow-y-auto"
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
            <Button 
              type="button" 
              size="icon"
              onClick={isLoading ? stop : handleSubmit}
              className="absolute right-1.5 bottom-[13px] h-8 w-8 bg-zinc-900 hover:bg-zinc-700 rounded-full transition-colors"
            >
              {isLoading ? (
                <Square fill="white" className="h-3 w-3" />
              ) : (
                <ArrowUp className="h-5 w-5 text-white" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 