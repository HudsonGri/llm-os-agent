import React, { memo, useMemo, createContext, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator"
import type { Components } from 'react-markdown';
import type { ReactNode, ComponentProps } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrowNight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Types and Interfaces
interface SourceInfo {
  name?: string;
  filename?: string;
  url?: string;
  similarity?: number;
  content?: string;
}

interface AssistantMessageProps {
  message: {
    content: string;
    toolInvocations?: Array<{
      toolName: string;
      result: Array<SourceInfo>;
    }>;
  };
}

type MarkdownComponentProps<T extends keyof JSX.IntrinsicElements> = 
  ComponentProps<T> & { children: ReactNode };

// Context Setup
const SourceContext = createContext<SourceInfo[]>([]);

/**
 * Extracts and formats the most relevant content from a source.
 * Removes HTML tags, backticks, and truncates if necessary.
 * TODO: Add some more advanced processing so it will highlight a relevant sentence from the content where context was pulled from
 */
const formatSourceContent = (content: string): string => {
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/`/g, '')       // Remove backticks
    .replace(/html/g, '')    // Remove 'html' text
    .slice(0, 300);         // Truncate to reasonable length
};

/**
 * SourceNumber Component
 * Renders an interactive source citation number with a hover card showing source details.
 */
const SourceNumber = memo(({ number }: { number: string }) => {
  const sources = useContext(SourceContext);
  const source = sources[parseInt(number) - 1];

  return (
    <HoverCard openDelay={10} closeDelay={50}>
      <HoverCardTrigger asChild>
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded bg-zinc-200 border border-zinc-300 text-black mx-0.5 cursor-pointer hover:bg-zinc-300 hover:border-zinc-400 transition-colors">
          {number}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 p-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">
              {source?.filename || source?.name || `Source ${number}`}
            </span>
            {source?.url && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <Link href={source.url} target="_blank" rel="noopener noreferrer">
                  <ArrowUpRight className="h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
          <Separator className="my-2" />
          <div className="text-sm text-zinc-600 leading-relaxed">
            {source?.name ? (
              <div className="line-clamp-4">
                {formatSourceContent(source.name)}
              </div>
            ) : (
              "Content not available"
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});

SourceNumber.displayName = 'SourceNumber';

/**
 * Processes text to identify and replace source citations with interactive components.
 * Matches patterns like 【source_1】 or 【source】.
 */
const processSourceNumbers = (text: string): ReactNode[] => {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  // Regex matches both 【source_N】 and abbreviated forms
  const regex = /【\{?(?:(?:source_(\d+))|s(?:o(?:u(?:r(?:c(?:e)?)?)?)?))?\}?】/g;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add the source number component
    const sourceNumber = match[1] || '?';
    parts.push(<SourceNumber key={`source-${match.index}`} number={sourceNumber} />);
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts;
};
/**
 * Creates a memoized markdown component that handles source citations.
 */
const createMarkdownComponent = <T extends keyof JSX.IntrinsicElements>(Component: T) => 
  memo(({ children, ...props }: MarkdownComponentProps<T>) => {
    const processChild = (child: ReactNode): ReactNode => {
      if (typeof child === 'string') return processSourceNumbers(child);
      if (!child) return child;
      
      if (React.isValidElement(child)) {
        return React.cloneElement(
          child,
          child.props,
          child.props.children && React.Children.map(child.props.children, processChild)
        );
      }
      
      return Array.isArray(child) ? child.map(processChild) : child;
    };

    return React.createElement(
      Component, 
      props,
      React.Children.map(children, processChild)
    );
  });

// Markdown component configuration
const markdownComponents: Partial<Components> = {
  // Text components with source processing
  p: createMarkdownComponent('p'),
  li: createMarkdownComponent('li'),
  strong: createMarkdownComponent('strong'),
  em: createMarkdownComponent('em'),
  h1: createMarkdownComponent('h1'),
  h2: createMarkdownComponent('h2'),
  h3: createMarkdownComponent('h3'),
  h4: createMarkdownComponent('h4'),
  h5: createMarkdownComponent('h5'),
  h6: createMarkdownComponent('h6'),
  blockquote: createMarkdownComponent('blockquote'),
  th: createMarkdownComponent('th'),
  td: createMarkdownComponent('td'),

  // Special components with custom styling
  pre: memo(({ children, ...props }) => {
    // Extract the code content from the nested structure
    const codeElement = Array.isArray(children) ? children[0] : children;
    const codeContent = codeElement?.props?.children?.[0] || '';
    const language = codeElement?.props?.className?.replace('language-', '') || 'text';

    return (
      <SyntaxHighlighter 
        language={language} 
        style={tomorrowNight} 
        {...props}
      >
        {codeContent}
      </SyntaxHighlighter>
    );
  }),
  code: memo(({ children, ...props }) => (
    <code className="px-1.5 py-0.5 rounded-md bg-zinc-100 font-mono text-sm" {...props}>
      {children}
    </code>
  )),
  a: memo(({ children, href, ...props }) => (
    <Link
      className="text-blue-500 hover:underline"
      href={href || '#'}
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      {typeof children === 'string' ? processSourceNumbers(children) : children}
    </Link>
  )),
  table: memo(({ children, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full divide-y divide-zinc-200" {...props}>
        {children}
      </table>
    </div>
  )),
  hr: memo((props) => <hr className="my-6 border-zinc-200" {...props} />),
};

/**
 * AssistantMessage Component
 * Renders AI assistant messages with markdown support and source citations.
 */
const AssistantMessage = memo(function AssistantMessage({ message }: AssistantMessageProps) {
  // Extract and memoize sources from tool invocations
  const sources = useMemo(() => 
    message.toolInvocations?.find(t => t.toolName === 'getInformation')?.result || [],
    [message.toolInvocations]
  );

  return (
    <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
      <SourceContext.Provider value={sources}>
        <ReactMarkdown components={markdownComponents}>
          {message.content}
        </ReactMarkdown>
      </SourceContext.Provider>
    </div>
  );
});

AssistantMessage.displayName = 'AssistantMessage';

export default AssistantMessage;