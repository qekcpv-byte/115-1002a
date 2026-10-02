import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cleanAllDollarSignsAndLatex } from "../utils/mathSanitizer";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Pre-processes markdown text:
 * 1. Sanitizes LaTeX expressions and removes any abnormal dollar signs ($).
 * 2. Ensures an empty line precedes table headers (CommonMark/GFM requirement).
 * 3. Fixes squashed table rows where newlines were collapsed into `||` or `| |` or `| :---`.
 * 4. Normalizes HTML `<br>` tags to valid JSX-friendly break or newlines.
 * 5. Ensures an empty line succeeds the table block.
 */
function normalizeMarkdown(raw: string): string {
  if (!raw) return "";

  // First, completely sanitize and strip all dollar signs ($) and convert LaTeX macros
  let text = cleanAllDollarSignsAndLatex(raw);

  // 1. Replace <br> or <br/> with clean linebreaks or space for table safety
  text = text.replace(/<br\s*\/?>/gi, "  \n");

  // 2. Fix cases where table rows were squashed together without newline
  text = text.replace(/\|\s*\|\s*:/g, "|\n|:");
  text = text.replace(/\|\s*\|\s*(?=[^\s|])/g, "|\n| ");
  text = text.replace(/\|\s*\|\s*--+/g, "|\n| ---");

  // 3. Ensure a blank line before any markdown table if it directly follows normal text
  text = text.replace(/([^\n|])\n(\|[\s\S]*?\|[\t ]*\n\|[\s\S]*?--+[\s\S]*?\|)/g, "$1\n\n$2");

  // 4. Ensure a blank line after table block before following text
  text = text.replace(/(\|[^\n]+\|)\n([^\n|#\-*\s>])/g, "$1\n\n$2");

  return text;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  const processed = normalizeMarkdown(content);

  return (
    <div className={`markdown-body ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom responsive, stylish table container
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-5 rounded-2xl border-2 border-[#362723] shadow-[3px_3px_0px_0px_rgba(54,39,35,0.85)] bg-white not-prose">
              <table
                className="min-w-full text-left border-collapse text-xs sm:text-sm text-[#362723]"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              className="bg-amber-100/95 text-[#362723] border-b-2 border-[#362723] font-black text-xs sm:text-sm tracking-wide"
              {...props}
            />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-stone-200" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr
              className="odd:bg-white even:bg-[#fffef7] hover:bg-amber-50/80 transition-colors"
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-4 py-3 font-black text-[#362723] border-r border-[#362723]/20 last:border-r-0 whitespace-nowrap text-xs sm:text-sm"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="px-4 py-3 text-stone-800 border-r border-stone-200 last:border-r-0 leading-relaxed align-top text-xs sm:text-sm font-medium"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-[#d55734] bg-[#fbf8ee] p-4 rounded-r-2xl my-4 text-[#362723] font-medium text-xs sm:text-sm leading-relaxed"
              {...props}
            />
          ),
        }}
      >
        {processed}
      </Markdown>
    </div>
  );
};
