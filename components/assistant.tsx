import React, { memo, useMemo, createContext, useContext, ReactElement, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Copy, Check } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator"
import type { Components } from 'react-markdown';
import type { ComponentProps, ComponentType } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
      state?: string;
      step?: number;
      toolCallId?: string;
      args?: {
        question?: string;
        topic?: string;
        topicNumber?: number;
      };
      result: Array<SourceInfo> | any;
    }>;
  };
}

type MarkdownComponentProps<T extends keyof JSX.IntrinsicElements> = 
  ComponentProps<T> & { children?: ReactNode };

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
 * Creates a component that handles source citations.
 */
const createMarkdownComponent = <T extends keyof JSX.IntrinsicElements>(Component: T): ComponentType<any> => {
  const MemoComponent = ({ children, ...props }: { children?: ReactNode } & ComponentProps<T>) => {
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
  };
  
  MemoComponent.displayName = `MarkdownComponent(${Component})`;
  return memo(MemoComponent);
};

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
  pre: (() => {
    const PreComponent = ({ children, ...props }: { children?: ReactNode }) => {
      // Extract the code content from the nested structure
      const codeElement = React.Children.toArray(children)[0];
      
      // Helper function to extract text content recursively
      const extractTextContent = (node: ReactNode): string => {
        if (node === null || node === undefined) return '';
        if (typeof node === 'string') return node;
        if (typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(extractTextContent).join('');
        
        // Handle React elements
        if (React.isValidElement(node)) {
          return extractTextContent(node.props.children);
        }
        
        return '';
      };

      // Extract language from className (e.g., "language-javascript")
      const language = React.isValidElement(codeElement) && 
        typeof codeElement.props.className === 'string' ? 
        codeElement.props.className.replace('language-', '') : 'text';
        
      // Extract the code content
      const codeContent = extractTextContent(codeElement);

      const [copied, setCopied] = React.useState(false);

      const handleCopy = () => {
        navigator.clipboard.writeText(codeContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      return (
        <div className="relative group">
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-zinc-700" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-zinc-700" />
            )}
          </button>
          <SyntaxHighlighter 
            language={language} 
            style={prism}
            {...props}
          >
            {codeContent}
          </SyntaxHighlighter>
        </div>
      );
    };
    PreComponent.displayName = 'CodePreComponent';
    return memo(PreComponent);
  })(),
  
  code: (() => {
    const CodeComponent = ({ children, ...props }: { children?: ReactNode }) => (
      <code className="px-1.5 py-0.5 rounded-md bg-zinc-100 font-mono text-sm" {...props}>
        {children}
      </code>
    );
    CodeComponent.displayName = 'CodeComponent';
    return memo(CodeComponent);
  })(),
  
  a: (() => {
    const LinkComponent = ({ children, href, ...props }: { children?: ReactNode, href?: string }) => (
      <Link
        className="text-blue-500 hover:text-blue-600 hover:underline"
        href={href || '#'}
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {typeof children === 'string' ? processSourceNumbers(children) : children}
      </Link>
    );
    LinkComponent.displayName = 'MarkdownLinkComponent';
    return memo(LinkComponent);
  })(),
  
  table: (() => {
    const TableComponent = ({ children, ...props }: { children?: ReactNode }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-zinc-200" {...props}>
          {children}
        </table>
      </div>
    );
    TableComponent.displayName = 'MarkdownTableComponent';
    return memo(TableComponent);
  })(),
  
  hr: (() => {
    const HrComponent = (props: any) => <hr className="my-6 border-zinc-200" {...props} />;
    HrComponent.displayName = 'MarkdownHrComponent';
    return memo(HrComponent);
  })(),
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