import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";

interface MessageRatingProps {
  messageId: string;
  isComplete?: boolean;
}

export function MessageRating({ messageId, isComplete = true }: MessageRatingProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);

  if (!isComplete) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 1 }}
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
    </motion.div>
  );
} 