import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// Map markdown nodes onto the app's semantic theme tokens (never default
// Tailwind colors), so story content respects light/dark themes.
const COMPONENTS: Components = {
  h1: (props) => <h2 className="text-txt mt-5 mb-2 text-xl font-semibold" {...props} />,
  h2: (props) => <h3 className="text-txt mt-5 mb-2 text-lg font-semibold" {...props} />,
  h3: (props) => <h4 className="text-txt mt-4 mb-2 text-base font-semibold" {...props} />,
  p: (props) => <p className="text-txt my-3 leading-relaxed" {...props} />,
  a: (props) => (
    <a
      className="text-primary underline underline-offset-2"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  strong: (props) => <strong className="text-txt font-semibold" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  ul: (props) => <ul className="text-txt my-3 list-disc space-y-1 pl-5" {...props} />,
  ol: (props) => <ol className="text-txt my-3 list-decimal space-y-1 pl-5" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="border-brd-200 text-txt-muted my-3 border-l-2 pl-3 italic"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="bg-surface-200 text-txt rounded px-1 py-0.5 text-sm"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="bg-surface-200 text-txt my-3 overflow-x-auto rounded-lg p-3 text-sm"
      {...props}
    />
  ),
  hr: () => <hr className="border-brd-200 my-4" />,
};

interface MarkdownProps {
  children: string;
  className?: string;
}

/** Renders GFM markdown with theme-aware styling. */
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("break-words", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
