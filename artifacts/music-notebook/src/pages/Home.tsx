import { useState } from "react";
import { useGetMusicalInspiration } from "@workspace/api-client-react";
import { RefreshCw, Quote, Lightbulb, Music2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function extractYtId(id: string | null | undefined): string | null {
  if (!id) return null;
  const m = id.match(/(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : (id.length === 11 ? id : null);
}

export default function HomePage() {
  const [fetchKey, setFetchKey] = useState(0);
  const { data, isLoading, isError } = useGetMusicalInspiration({
    query: { queryKey: ["inspiration", fetchKey], staleTime: 0, gcTime: 0 }
  });

  const refresh = () => setFetchKey(k => k + 1);

  const ytId = extractYtId(data?.youtubeId);

  const typeIcon = {
    quote: <Quote className="w-5 h-5" />,
    fact: <Lightbulb className="w-5 h-5" />,
    recommendation: <Music2 className="w-5 h-5" />,
  }[data?.type ?? "fact"] ?? <Lightbulb className="w-5 h-5" />;

  const typeLabel = {
    quote: "Musical Quote",
    fact: "Musical Insight",
    recommendation: "Musical Recommendation",
  }[data?.type ?? "fact"] ?? "Musical Insight";

  return (
    <div className="animate-in fade-in duration-700 min-h-[60vh] flex flex-col items-center justify-center max-w-3xl mx-auto text-center">
      {isLoading && (
        <div className="space-y-6">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="font-serif italic text-muted-foreground text-lg">Searching the manuscripts...</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="space-y-4">
          <p className="font-serif italic text-muted-foreground">Could not load inspiration.</p>
          <button onClick={refresh} className="text-xs font-sans uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
            Try again
          </button>
        </div>
      )}

      {data && !isLoading && (
        <div className="w-full space-y-10">
          <div className="space-y-2">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 text-[0.6rem] font-sans uppercase tracking-[0.2em] rounded-sm border",
              data.type === "quote" ? "text-amber-700 bg-amber-50 border-amber-200" :
              data.type === "recommendation" ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
              "text-primary/80 bg-primary/8 border-primary/20"
            )}>
              {typeIcon}
              {typeLabel}
            </div>
          </div>

          {data.type === "quote" ? (
            <blockquote className="space-y-6">
              <div className="font-serif text-3xl md:text-4xl leading-relaxed text-foreground font-medium relative">
                <span className="text-primary/20 text-7xl font-serif absolute -top-4 -left-4 leading-none select-none">"</span>
                <span className="relative z-10 px-8">{data.content}</span>
                <span className="text-primary/20 text-7xl font-serif absolute -bottom-8 -right-4 leading-none select-none">"</span>
              </div>
              {data.author && (
                <div className="pt-4 space-y-1">
                  <div className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                    — {data.author}
                  </div>
                  {data.workTitle && (
                    <div className="font-serif italic text-sm text-muted-foreground">{data.workTitle}</div>
                  )}
                </div>
              )}
            </blockquote>
          ) : (
            <div className="space-y-6">
              <p className="font-serif text-2xl md:text-3xl leading-relaxed text-foreground">
                {data.content}
              </p>
              {(data.author || data.workTitle) && (
                <div className="space-y-1">
                  {data.author && (
                    <div className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                      {data.author}
                    </div>
                  )}
                  {data.workTitle && (
                    <div className="font-serif italic text-sm text-muted-foreground">{data.workTitle}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {ytId && (
            <div className="w-full max-w-xl mx-auto rounded-sm overflow-hidden notebook-border shadow-lg aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=0`}
                title={data.workTitle ?? "Musical recording"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          <div className="pt-4 border-t border-border/30 flex items-center justify-center">
            <button
              onClick={refresh}
              className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Another inspiration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
