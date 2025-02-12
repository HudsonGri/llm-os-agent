import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Markdown } from '@/components/markdown';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { Components } from 'react-markdown';

// Move components outside of render to prevent recreation
const inlineMarkdownComponents: Partial<Components> = {
  pre: memo(({ children }) => <>{children}</>),
  ol: memo(({ children, ...props }) => (
    <ol className="list-none pl-0 space-y-1 [counter-reset:item]" {...props}>
      {children}
    </ol>
  )),
  li: memo(({ children, ...props }) => (
    <li className="leading-relaxed flex gap-2 before:content-[counter(item)'.'] before:[counter-increment:item] before:font-normal before:text-muted-foreground" {...props}>
      {children}
    </li>
  )),
  ul: memo(({ children, ...props }) => (
    <ul className="list-none pl-0 space-y-1" {...props}>
      {children}
    </ul>
  )),
  strong: memo(({ children, ...props }) => (
    <span className="font-semibold" {...props}>
      {children}
    </span>
  )),
  a: memo(({ children, href, ...props }) => (
    <Link
      className="text-blue-500 hover:underline"
      href={href || '#'}
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      {children}
    </Link>
  )),
  h1: memo(({ children, ...props }) => (
    <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
      {children}
    </h1>
  )),
  h2: memo(({ children, ...props }) => (
    <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
      {children}
    </h2>
  )),
  h3: memo(({ children, ...props }) => (
    <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
      {children}
    </h3>
  )),
  h4: memo(({ children, ...props }) => (
    <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
      {children}
    </h4>
  )),
  h5: memo(({ children, ...props }) => (
    <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
      {children}
    </h5>
  )),
  h6: memo(({ children, ...props }) => (
    <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
      {children}
    </h6>
  )),
  p: memo(({ children, ...props }) => (
    <span className="inline" {...props}>
      {children}
    </span>
  )),
};

interface AssistantMessageProps {
  message: string;
}

const AssistantMessage = memo(function AssistantMessage({ message }: AssistantMessageProps) {
  // Memoize the clean message to prevent unnecessary recalculation
  const cleanMessage = useMemo(() => 
    message.replace(/【\{*source_\d+\}*】/g, ''),
    [message]
  );
  
  return (
    <ReactMarkdown components={inlineMarkdownComponents}>
      {cleanMessage}
    </ReactMarkdown>
  );
});

export default AssistantMessage;