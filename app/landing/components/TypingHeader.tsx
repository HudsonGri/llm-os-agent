'use client'
import { useState, useEffect, useRef } from 'react'

type TypingHeaderProps = {
  prefix: string;
  materials: string[];
  className?: string;
}

export default function TypingHeader({ prefix, materials, className = '' }: TypingHeaderProps) {
  const [displayText, setDisplayText] = useState(materials[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  
  const typingRef = useRef(null);
  
  useEffect(() => {
    const current = materials[loopNum % materials.length];
    
    const handleTyping = () => {
      if (typingRef.current) {
        if (!isDeleting) {
          // Typing forward
          setDisplayText(current.substring(0, displayText.length + 1));
          
          // If we've fully typed the word
          if (displayText === current) {
            // Wait 2 seconds before starting to delete
            setTimeout(() => setIsDeleting(true), 8000);
            return;
          }
        } else {
          // Deleting
          setDisplayText(current.substring(0, displayText.length - 1));
          
          // If we've deleted the word
          if (displayText === '') {
            setIsDeleting(false);
            setLoopNum(loopNum + 1);
            // Pause before typing the next word
            return;
          }
        }
      }
    };
    
    // Adjust typing speed based on action
    const typeSpeed = isDeleting ? 50 : 100;
    
    const timer = setTimeout(handleTyping, typeSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, materials]);

  return (
    <h1 className={className}>
      {prefix}{' '}
      <span ref={typingRef} className="relative inline-block min-w-[240px]">
        <span>{displayText}</span>
        <span className="cursor"></span>
      </span>
    </h1>
  );
} 