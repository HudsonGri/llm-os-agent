import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import Link from 'next/link';
// import { CodeBlock } from './code-block';

// Create memoized components with display names
const PreComponent = memo(({ children, ...props }) => (
  <pre className="overflow-x-auto p-4 rounded-lg bg-zinc-100 my-4" {...props}>
    {children}
  </pre>
));
PreComponent.displayName = 'MarkdownPre';

const CodeComponent = memo(({ children, ...props }) => (
  <code className="px-1.5 py-0.5 rounded-md bg-zinc-100 font-mono text-sm" {...props}>
    {children}
  </code>
));
CodeComponent.displayName = 'MarkdownCode';

const OrderedListComponent = memo(({ children, ...props }) => (
  <ol className="list-decimal list-inside space-y-2 my-4" {...props}>
    {children}
  </ol>
));
OrderedListComponent.displayName = 'MarkdownOrderedList';

const ListItemComponent = memo(({ children, ...props }) => (
  <li className="leading-relaxed" {...props}>
    {children}
  </li>
));
ListItemComponent.displayName = 'MarkdownListItem';

const UnorderedListComponent = memo(({ children, ...props }) => (
  <ul className="list-disc list-inside space-y-2 my-4" {...props}>
    {children}
  </ul>
));
UnorderedListComponent.displayName = 'MarkdownUnorderedList';

const StrongComponent = memo(({ children, ...props }) => (
  <strong className="font-semibold" {...props}>
    {children}
  </strong>
));
StrongComponent.displayName = 'MarkdownStrong';

const EmComponent = memo(({ children, ...props }) => (
  <em className="italic" {...props}>
    {children}
  </em>
));
EmComponent.displayName = 'MarkdownEm';

const AnchorComponent = memo(({ children, href, ...props }) => (
  <Link
    className="text-blue-500 hover:underline"
    href={href || '#'}
    target="_blank"
    rel="noreferrer"
    {...props}
  >
    {children}
  </Link>
));
AnchorComponent.displayName = 'MarkdownAnchor';

const H1Component = memo(({ children, ...props }) => (
  <h1 className="text-3xl font-semibold mt-8 mb-4" {...props}>
    {children}
  </h1>
));
H1Component.displayName = 'MarkdownH1';

const H2Component = memo(({ children, ...props }) => (
  <h2 className="text-2xl font-semibold mt-6 mb-3" {...props}>
    {children}
  </h2>
));
H2Component.displayName = 'MarkdownH2';

const H3Component = memo(({ children, ...props }) => (
  <h3 className="text-xl font-semibold mt-5 mb-3" {...props}>
    {children}
  </h3>
));
H3Component.displayName = 'MarkdownH3';

const H4Component = memo(({ children, ...props }) => (
  <h4 className="text-lg font-semibold mt-4 mb-2" {...props}>
    {children}
  </h4>
));
H4Component.displayName = 'MarkdownH4';

const H5Component = memo(({ children, ...props }) => (
  <h5 className="text-base font-semibold mt-4 mb-2" {...props}>
    {children}
  </h5>
));
H5Component.displayName = 'MarkdownH5';

const H6Component = memo(({ children, ...props }) => (
  <h6 className="text-sm font-semibold mt-4 mb-2" {...props}>
    {children}
  </h6>
));
H6Component.displayName = 'MarkdownH6';

const ParagraphComponent = memo(({ children, ...props }) => (
  <p className="leading-relaxed mb-4 last:mb-0" {...props}>
    {children}
  </p>
));
ParagraphComponent.displayName = 'MarkdownParagraph';

const BlockquoteComponent = memo(({ children, ...props }) => (
  <blockquote className="border-l-4 border-zinc-200 pl-4 my-4 italic" {...props}>
    {children}
  </blockquote>
));
BlockquoteComponent.displayName = 'MarkdownBlockquote';

const HrComponent = memo((props) => (
  <hr className="my-6 border-zinc-200" {...props} />
));
HrComponent.displayName = 'MarkdownHr';

const TableComponent = memo(({ children, ...props }) => (
  <div className="overflow-x-auto my-4">
    <table className="min-w-full divide-y divide-zinc-200" {...props}>
      {children}
    </table>
  </div>
));
TableComponent.displayName = 'MarkdownTable';

const TableHeaderComponent = memo(({ children, ...props }) => (
  <th className="px-4 py-2 bg-zinc-50 font-semibold text-left" {...props}>
    {children}
  </th>
));
TableHeaderComponent.displayName = 'MarkdownTableHeader';

const TableCellComponent = memo(({ children, ...props }) => (
  <td className="px-4 py-2 border-t border-zinc-100" {...props}>
    {children}
  </td>
));
TableCellComponent.displayName = 'MarkdownTableCell';

// Move components outside of render to prevent recreation
const components: Partial<Components> = {
  pre: PreComponent,
  code: CodeComponent,
  ol: OrderedListComponent,
  li: ListItemComponent,
  ul: UnorderedListComponent,
  strong: StrongComponent,
  em: EmComponent,
  a: AnchorComponent,
  h1: H1Component,
  h2: H2Component,
  h3: H3Component,
  h4: H4Component,
  h5: H5Component,
  h6: H6Component,
  p: ParagraphComponent,
  blockquote: BlockquoteComponent,
  hr: HrComponent,
  table: TableComponent,
  th: TableHeaderComponent,
  td: TableCellComponent,
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
NonMemoizedMarkdown.displayName = 'NonMemoizedMarkdown';

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
Markdown.displayName = 'Markdown';