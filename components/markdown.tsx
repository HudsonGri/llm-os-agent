import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import Link from 'next/link';
// import { CodeBlock } from './code-block';

// Move components outside of render to prevent recreation
const components: Partial<Components> = {
//   code: CodeBlock,
  pre: memo(({ children, ...props }) => (
    <pre className="overflow-x-auto p-4 rounded-lg bg-zinc-100 my-4" {...props}>
      {children}
    </pre>
  )),
  code: memo(({ children, ...props }) => (
    <code className="px-1.5 py-0.5 rounded-md bg-zinc-100 font-mono text-sm" {...props}>
      {children}
    </code>
  )),
  ol: memo(({ children, ...props }) => (
    <ol className="list-decimal list-inside space-y-2 my-4" {...props}>
      {children}
    </ol>
  )),
  li: memo(({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  )),
  ul: memo(({ children, ...props }) => (
    <ul className="list-disc list-inside space-y-2 my-4" {...props}>
      {children}
    </ul>
  )),
  strong: memo(({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  )),
  em: memo(({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
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
    <h1 className="text-3xl font-semibold mt-8 mb-4" {...props}>
      {children}
    </h1>
  )),
  h2: memo(({ children, ...props }) => (
    <h2 className="text-2xl font-semibold mt-6 mb-3" {...props}>
      {children}
    </h2>
  )),
  h3: memo(({ children, ...props }) => (
    <h3 className="text-xl font-semibold mt-5 mb-3" {...props}>
      {children}
    </h3>
  )),
  h4: memo(({ children, ...props }) => (
    <h4 className="text-lg font-semibold mt-4 mb-2" {...props}>
      {children}
    </h4>
  )),
  h5: memo(({ children, ...props }) => (
    <h5 className="text-base font-semibold mt-4 mb-2" {...props}>
      {children}
    </h5>
  )),
  h6: memo(({ children, ...props }) => (
    <h6 className="text-sm font-semibold mt-4 mb-2" {...props}>
      {children}
    </h6>
  )),
  p: memo(({ children, ...props }) => (
    <p className="leading-relaxed mb-4 last:mb-0" {...props}>
      {children}
    </p>
  )),
  blockquote: memo(({ children, ...props }) => (
    <blockquote className="border-l-4 border-zinc-200 pl-4 my-4 italic" {...props}>
      {children}
    </blockquote>
  )),
  hr: memo((props) => (
    <hr className="my-6 border-zinc-200" {...props} />
  )),
  table: memo(({ children, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full divide-y divide-zinc-200" {...props}>
        {children}
      </table>
    </div>
  )),
  th: memo(({ children, ...props }) => (
    <th className="px-4 py-2 bg-zinc-50 font-semibold text-left" {...props}>
      {children}
    </th>
  )),
  td: memo(({ children, ...props }) => (
    <td className="px-4 py-2 border-t border-zinc-100" {...props}>
      {children}
    </td>
  )),
};

// Memoize remarkPlugins array to prevent recreation
const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = memo(function NonMemoizedMarkdown({ children }: { children: string }) {
  return (
    <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
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