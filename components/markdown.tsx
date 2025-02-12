import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import Link from 'next/link';
// import { CodeBlock } from './code-block';

// Move components outside of render to prevent recreation
const components: Partial<Components> = {
//   code: CodeBlock,
  pre: memo(({ children }) => <>{children}</>),
  ol: memo(({ children, ...props }) => (
    <ol className="list-decimal list-inside space-y-1" {...props}>
      {children}
    </ol>
  )),
  li: memo(({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  )),
  ul: memo(({ children, ...props }) => (
    <ul className="list-disc list-inside space-y-1" {...props}>
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
    <p className="mb-4 last:mb-0" {...props}>
      {children}
    </p>
  )),
};

// Memoize remarkPlugins array to prevent recreation
const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = memo(function NonMemoizedMarkdown({ children }: { children: string }) {
  return (
    <div className="prose dark:prose-invert prose-sm max-w-none text-black">
      <ReactMarkdown components={components} remarkPlugins={remarkPlugins}>
        {children}
      </ReactMarkdown>
    </div>
  );
});

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);