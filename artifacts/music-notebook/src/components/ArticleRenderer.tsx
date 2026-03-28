import { parseBlocks, type Block } from "./ArticleEditor";
import { FileText, Music2 } from "lucide-react";

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return (
        <h2 className="font-serif font-bold text-3xl text-foreground mt-10 mb-4 leading-tight">
          {block.content}
        </h2>
      );
    case "subheading":
      return (
        <h3 className="font-serif font-semibold text-xl text-foreground mt-8 mb-3">
          {block.content}
        </h3>
      );
    case "text":
      return (
        <p className="font-serif text-foreground/90 text-lg leading-[1.85] mb-0">
          {block.content}
        </p>
      );
    case "quote":
      return (
        <blockquote className="my-8 pl-6 border-l-4 border-primary/30">
          <p className="font-serif italic text-xl text-foreground/80 leading-relaxed">
            {block.content}
          </p>
        </blockquote>
      );
    case "image":
      return (
        <figure className="my-8">
          {block.url && (
            <img
              src={block.url}
              alt={block.caption || ""}
              className="w-full max-h-[600px] object-contain rounded-sm notebook-border bg-card p-2"
            />
          )}
          {block.caption && (
            <figcaption className="mt-2 text-center text-sm font-sans italic text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "score":
      return (
        <figure className="my-8">
          <div className="relative">
            {block.url && (
              <img
                src={block.url}
                alt={block.caption || "Score fragment"}
                className="w-full object-contain rounded-sm notebook-border bg-white p-4"
              />
            )}
            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-sm flex items-center gap-1 text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground">
              <Music2 className="w-2.5 h-2.5" /> Score
            </div>
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-center text-sm font-sans italic text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "pdf":
      return (
        <div className="my-6">
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-card notebook-border hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <FileText className="w-8 h-8 text-primary/60 flex-shrink-0" />
            <div>
              <div className="font-sans font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                {block.title || "PDF Document"}
              </div>
              <div className="font-sans text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{block.url}</div>
            </div>
            <span className="ml-auto text-xs font-sans uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
              Open →
            </span>
          </a>
        </div>
      );
  }
}

export function ArticleRenderer({ content }: { content: string | null | undefined }) {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) {
    return (
      <p className="italic text-muted-foreground text-center py-10 font-serif">
        No analysis written for this piece.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {blocks.map(block => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  );
}
