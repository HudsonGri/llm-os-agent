import { ThumbsUp, ThumbsDown, RotateCcw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";

interface MessageRatingProps {
  messageId: string;
  isComplete?: boolean;
  onRegenerate?: () => void;
  content?: string;
}

export function MessageRating({ messageId, isComplete = true, onRegenerate, content }: MessageRatingProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isComplete) return null;

  const handleCopy = async () => {
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-1.5 opacity-0 group-[.is-complete]:opacity-100 transition-opacity"
    >
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 rounded-md ${rating === 'up' ? 'text-zinc-900' : 'text-zinc-400'} transition-colors`}
        onClick={() => setRating(prev => prev === 'up' ? null : 'up')}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span className="sr-only">Thumbs up</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 rounded-md ${rating === 'down' ? 'text-zinc-900' : 'text-zinc-400'} transition-colors`}
        onClick={() => setRating(prev => prev === 'down' ? null : 'down')}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        <span className="sr-only">Thumbs down</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors"
        onClick={onRegenerate}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="sr-only">Regenerate response</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        <span className="sr-only">Copy response</span>
      </Button>
    </motion.div>
  );
} 