import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Questions as native disclosure widgets: keyboard and screen-reader support built in, no
 * JavaScript, and every answer stays in the HTML for search engines (unlike an accordion
 * that unmounts closed panels).
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map(({ question, answer }) => (
        <details key={question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-medium transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
            {question}
            <ChevronDown
              aria-hidden
              className="size-5 shrink-0 transition-transform group-open:rotate-180"
            />
          </summary>
          <p className="pb-6 text-muted">{answer}</p>
        </details>
      ))}
    </div>
  );
}
