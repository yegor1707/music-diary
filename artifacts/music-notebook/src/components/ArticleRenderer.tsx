import { parseBlocks, type Block, type ImageSize } from "./ArticleEditor";
import { FileText, Music2, Clock, Youtube } from "lucide-react";
import { extractYouTubeId } from "@/lib/utils";

const SIZE_CLASSES: Record<ImageSize, string> = {
  small: "w-1/4",
  medium: "w-1/2",
  large: "w-3/4",
  full: "w-full",
};

function BlockView({ block, onTimestampClick }: { block: Block; onTimestampClick?: (time: string) => void }) {
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
    case "image": {
      const sizeClass = SIZE_CLASSES[block.size || "full"];
      return (
        <figure className="my-8">
          {block.url && (
            <div className={`${sizeClass}`}>
              <img
                src={block.url}
                alt={block.caption || ""}
                className="w-full h-auto object-contain rounded-sm notebook-border bg-card p-2"
              />
            </div>
          )}
          {block.caption && (
            <figcaption className="mt-2 text-sm font-sans italic text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case "score": {
      const sizeClass = SIZE_CLASSES[block.size || "full"];
      return (
        <figure className="my-8">
          <div className={`relative ${sizeClass}`}>
            {block.url && (
              <img
                src={block.url}
                alt={block.caption || "Score fragment"}
                className="w-full h-auto object-contain rounded-sm notebook-border bg-white p-4"
              />
            )}
            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-sm flex items-center gap-1 text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground">
              <Music2 className="w-2.5 h-2.5" /> Score
            </div>
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-sm font-sans italic text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }
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
    case "timestamp": {
      const handleClick = () => {
        if (onTimestampClick && block.time) {
          onTimestampClick(block.time);
        }
      };
      return (
        <div className="my-3">
          <button
            type="button"
            onClick={handleClick}
            className="flex items-center gap-3 px-4 py-2.5 bg-card notebook-border hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer w-full text-left"
          >
            <Clock className="w-4 h-4 text-primary/70 flex-shrink-0 group-hover:text-primary transition-colors" />
            <span className="font-mono text-sm font-semibold text-primary/80 group-hover:text-primary transition-colors min-w-[3rem]">
              {block.time}
            </span>
            <span className="font-serif text-foreground/80 text-sm">
              {block.label}
            </span>
            <span className="ml-auto text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
              Jump →
            </span>
          </button>
        </div>
      );
    }
    case "video": {
      const ytId = extractYouTubeId(block.url);
      if (!ytId && !block.url) return null;
      return (
        <figure className="my-8">
          {ytId ? (
            <div className="rounded-sm overflow-hidden notebook-border bg-black shadow-md aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title={block.caption || "Video"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-card notebook-border text-muted-foreground text-sm font-sans">
              <Youtube className="w-4 h-4" />
              <span>Video: {block.url}</span>
            </div>
          )}
          {block.caption && (
            <figcaption className="mt-2 text-center text-sm font-sans italic text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case "image-text": {
      const imgWidthClass = SIZE_CLASSES[block.size || "medium"];
      const isLeft = block.imagePosition !== "right";
      return (
        <figure className={`my-8 flex gap-6 items-start ${isLeft ? "flex-row" : "flex-row-reverse"}`}>
          {block.imageUrl && (
            <div className={`flex-shrink-0 ${imgWidthClass}`}>
              <img
                src={block.imageUrl}
                alt={block.caption || ""}
                className="w-full h-auto object-contain rounded-sm notebook-border bg-card p-2"
              />
              {block.caption && (
                <figcaption className="mt-1.5 text-xs font-sans italic text-muted-foreground text-center">
                  {block.caption}
                </figcaption>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-serif text-foreground/90 text-lg leading-[1.85] whitespace-pre-wrap">
              {block.text}
            </p>
          </div>
        </figure>
      );
    }
  }
}

export function ArticleRenderer({ 
  content,
  onTimestampClick
}: { 
  content: string | null | undefined;
  onTimestampClick?: (time: string) => void;
}) {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) {
    return (
      <p className="italic text-muted-foreground text-center py-10 font-serif">
        No content written yet.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {blocks.map(block => (
        <BlockView key={block.id} block={block} onTimestampClick={onTimestampClick} />
      ))}
    </div>
  );
}
