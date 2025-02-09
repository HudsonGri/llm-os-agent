import React from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Markdown } from '@/components/markdown';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

// Override the paragraph element so it renders as an inline <span> instead of a block <p>

const inlineMarkdownComponents = {
  pre: ({ children }) => <>{children}</>,
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-none pl-0 space-y-1 [counter-reset:item]" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="leading-relaxed flex gap-2 before:content-[counter(item)'.'] before:[counter-increment:item] before:font-normal before:text-muted-foreground" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-none pl-0 space-y-1" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
    );
  },
  p: ({ node, children, ...props }) => {
    return (
      <span className="inline" {...props}>
        {children}
      </span>
    );
  },
  
};

interface AssistantMessageProps {
  message: string;
}

export default function AssistantMessage({ message }: AssistantMessageProps) {
  const parts = message.split(/【\{*source_(\d+)\}*】/);
  
  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          // Render non-hover parts as inline markdown.
          return (
            <ReactMarkdown 
              key={index} 
              components={inlineMarkdownComponents}
            >
              {part}
            </ReactMarkdown>
          );
        } else {
          // Render hover cards inline for the source markers.
          return (
            <HoverCard key={index} openDelay={10} closeDelay={0}>
              <HoverCardTrigger asChild>
                <span
                  className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium 
                    rounded-full bg-blue-100 text-blue-800 mx-1 cursor-pointer align-middle
                    hover:bg-blue-200 transition-colors"
                >
                  {part}
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Source {part}</h4>
                  <p className="text-sm text-muted-foreground">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        }
      })}
    </>
  );
}
