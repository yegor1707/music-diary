import { useState } from "react";
import { useGetMusicalInspiration } from "@workspace/api-client-react";
import {
  RefreshCw, Quote, Lightbulb, Music2, BookOpen,
  GraduationCap, Layers, Sparkles, Clock, Dumbbell, Shuffle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type InspirationCategory =
  | "fact" | "quote" | "tip" | "recording" | "masterclass"
  | "theory" | "inspiration" | "history" | "practice" | "misc";

type CategoryMeta = {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
  border: string;
};

const CATEGORY_META: Record<InspirationCategory, CategoryMeta> = {
  fact: {
    icon: <Lightbulb className="w-4 h-4" />,
    label: "Факт",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  quote: {
    icon: <Quote className="w-4 h-4" />,
    label: "Цитата",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  tip: {
    icon: <BookOpen className="w-4 h-4" />,
    label: "Совет",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  recording: {
    icon: <Music2 className="w-4 h-4" />,
    label: "История записи",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
  masterclass: {
    icon: <GraduationCap className="w-4 h-4" />,
    label: "Мастер-класс",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  theory: {
    icon: <Layers className="w-4 h-4" />,
    label: "Теория",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  inspiration: {
    icon: <Sparkles className="w-4 h-4" />,
    label: "Вдохновение",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  history: {
    icon: <Clock className="w-4 h-4" />,
    label: "История музыки",
    color: "text-stone-700",
    bg: "bg-stone-50",
    border: "border-stone-200",
  },
  practice: {
    icon: <Dumbbell className="w-4 h-4" />,
    label: "Практика",
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  misc: {
    icon: <Shuffle className="w-4 h-4" />,
    label: "Разное",
    color: "text-fuchsia-700",
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
  },
};

function buildYouTubeSearchUrl(query: string | null | undefined, author: string | null | undefined, workTitle: string | null | undefined): string | null {
  const q = query ?? (author && workTitle ? `${author} ${workTitle}` : workTitle ? workTitle : null);
  if (!q) return null;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

export default function HomePage() {
  const [fetchKey, setFetchKey] = useState(0);
  const { data, isLoading, isError } = useGetMusicalInspiration({
    query: { queryKey: ["inspiration", fetchKey], staleTime: 0, gcTime: 0 }
  });

  const refresh = () => setFetchKey(k => k + 1);

  const category = (data?.type ?? "fact") as InspirationCategory;
  const meta = CATEGORY_META[category] ?? CATEGORY_META.fact;

  const ytSearchUrl = buildYouTubeSearchUrl(
    (data as any)?.musicSearchQuery,
    data?.author,
    data?.workTitle,
  );

  const isQuote = category === "quote";

  return (
    <div className="animate-in fade-in duration-700 min-h-[60vh] flex flex-col items-center justify-center max-w-3xl mx-auto text-center">
      {isLoading && (
        <div className="space-y-6">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="font-serif italic text-muted-foreground text-lg">Листаю страницы...</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="space-y-4">
          <p className="font-serif italic text-muted-foreground">Не удалось загрузить.</p>
          <button onClick={refresh} className="text-xs font-sans uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
            Попробовать снова
          </button>
        </div>
      )}

      {data && !isLoading && (
        <div className="w-full space-y-10">
          <div className="space-y-2">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 text-[0.6rem] font-sans uppercase tracking-[0.2em] rounded-sm border",
              meta.color, meta.bg, meta.border,
            )}>
              {meta.icon}
              {meta.label}
            </div>
          </div>

          {isQuote ? (
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
              <p className="font-serif text-xl md:text-2xl leading-relaxed text-foreground text-left">
                {data.content}
              </p>
              {(data.author || data.workTitle) && (
                <div className="space-y-1 text-left">
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

          {ytSearchUrl && (
            <div className="flex justify-start">
              <a
                href={ytSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-xs font-sans uppercase tracking-widest rounded-sm border transition-opacity hover:opacity-70",
                  meta.color, meta.bg, meta.border,
                )}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Слушать на YouTube
              </a>
            </div>
          )}

          <div className="pt-4 border-t border-border/30 flex items-center justify-center">
            <button
              onClick={refresh}
              className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Следующее
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
