import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, Square } from "lucide-react";

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
  return (
    <div className="border-t border-zinc-200 bg-white/80 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
        <div className="relative flex items-center">
          <div className="relative flex-1">
            <Input
              value={input}
              placeholder="Message..."
              onChange={handleInputChange}
              className="pl-4 pr-12 py-3 w-full text-sm text-zinc-900 bg-zinc-100 rounded-2xl border-0 focus-visible:ring-2 focus-visible:ring-zinc-600/20 focus-visible:ring-offset-1"
            />
            <Button 
              type="button" 
              size="icon"
              onClick={isLoading ? stop : handleSubmit}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors"
            >
              {isLoading ? (
                <Square fill="white" className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 