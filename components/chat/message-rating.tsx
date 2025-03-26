import { ThumbsUp, ThumbsDown, RotateCcw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";
import { updateChatRating } from '@/lib/actions/chats';

interface MessageRatingProps {
  messageId: string;
  isComplete?: boolean;
  onRegenerate?: () => void;
  content?: string;
  initialRating?: 'up' | 'down' | null;
}

export function MessageRating({ messageId, isComplete = true, onRegenerate, content, initialRating }: MessageRatingProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(initialRating || null);
  const [copied, setCopied] = useState(false);

  if (!isComplete) return null;

  const handleCopy = async () => {
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRating = async (newRating: 'up' | 'down') => {
    // Toggle rating if clicking the same button
    const finalRating = rating === newRating ? null : newRating;
    setRating(finalRating);
    
    try {
      await updateChatRating(messageId, finalRating);
      console.log('Rating messageId:', messageId, 'finalRating:', finalRating);
    } catch (error) {
      console.error('Failed to update rating:', error);
      // Revert UI state if save fails
      setRating(rating);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-1.5 opacity-0 group-[.is-complete]:opacity-100 transition-opacity"
    >
      <motion.div
        whileTap={{ scale: 0.8 }}
        animate={{ 
          scale: rating === 'up' ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${rating === 'up' ? 'text-zinc-900' : 'text-zinc-400'} transition-colors cursor-pointer`}
          onClick={() => handleRating('up')}
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="sr-only">Thumbs up</span>
        </Button>
      </motion.div>
      <motion.div
        whileTap={{ scale: 0.8 }}
        animate={{ 
          scale: rating === 'down' ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${rating === 'down' ? 'text-zinc-900' : 'text-zinc-400'} transition-colors cursor-pointer`}
          onClick={() => handleRating('down')}
        >
          <ThumbsDown className="h-4 w-4" />
          <span className="sr-only">Thumbs down</span>
        </Button>
      </motion.div>
      {/* <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
        onClick={onRegenerate}
      >
        <RotateCcw className="h-4 w-4" />
        <span className="sr-only">Regenerate response</span>
      </Button> */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        <span className="sr-only">Copy response</span>
      </Button>
    </motion.div>
  );
} 