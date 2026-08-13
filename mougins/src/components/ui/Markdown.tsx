import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { AccentBar } from "./AccentBar";
import { Rail } from "./Rail";

// Map markdown nodes onto the app's semantic theme tokens (never default
// Tailwind colors), so story content respects light/dark themes.
const COMPONENTS: Components = {
  h1: (props) => (
    <div className="flex flex-col gap-1 pb-2">
      <div className="flex justify-start">
        <h2 className="text-txt text-2xl font-extrabold" {...props} />
      </div>
      <AccentBar />
    </div>
  ),
  h2: (props) => (
    <div className="flex flex-col gap-1 pb-2">
      <div className="flex justify-start">
        <h3 className="text-txt text-xl font-extrabold" {...props} />
      </div>
      <AccentBar />
    </div>
  ),
  h3: (props) => (
    <div className="flex flex-col gap-1 pb-2">
      <div className="flex justify-start">
        <h4 className="text-txt text-lg font-extrabold" {...props} />
      </div>
      <AccentBar />
    </div>
  ),
  p: (props) => <p className="text-txt my-3 leading-relaxed" {...props} />,
  a: (props) => (
    <a
      className="text-primary underline underline-offset-2"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  strong: (props) => <strong className="text-txt font-extrabold" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  ul: (props) => (
    <ul className="text-txt my-3 list-disc space-y-1 pl-5" {...props} />
  ),
  ol: (props) => (
    <ol className="text-txt my-3 list-decimal space-y-1 pl-5" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  blockquote: (props) => (
    <div className="my-3 flex items-stretch gap-4">
      <Rail className="bg-primary" />
      <blockquote className="text-txt italic [&>p]:my-0" {...props} />
    </div>
  ),
  // No panel behind code and no rule for `hr`: everything on the page sits at
  // the same level, so code is set apart by its face, not by a box.
  code: (props) => <code className="text-txt font-mono text-sm" {...props} />,
  pre: (props) => (
    <pre className="text-txt my-3 overflow-x-auto font-mono text-sm" {...props} />
  ),
  hr: () => <div className="h-8" />,
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
