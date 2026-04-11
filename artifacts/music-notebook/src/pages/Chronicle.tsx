import { useMemo } from "react";
import { Link } from "wouter";
import {
  useListNotes,
  useListPieces,
  useListComposers,
  useListBooks,
} from "@workspace/api-client-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Music, Users, BookOpen, GraduationCap, FileText, Scroll } from "lucide-react";

type EventKind = "piece" | "composer" | "book" | "masterclass" | "note";

interface ActivityEvent {
  id: number;
  kind: EventKind;
  title: string;
  subtitle?: string;
  href: string;
  date: string;
}

const KIND_META: Record<EventKind, { label: string; Icon: React.FC<{ className?: string }>; color: string }> = {
  piece:       { label: "Произведение",  Icon: Music,         color: "text-amber-700" },
  composer:    { label: "Композитор",    Icon: Users,         color: "text-stone-600" },
  book:        { label: "Книга",         Icon: BookOpen,      color: "text-emerald-700" },
  masterclass: { label: "Мастеркласс",  Icon: GraduationCap, color: "text-blue-700" },
  note:        { label: "Заметка",       Icon: FileText,      color: "text-rose-700" },
};

function formatDateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d))     return `Сегодня — ${format(d, "d MMMM yyyy", { locale: ru })}`;
  if (isYesterday(d)) return `Вчера — ${format(d, "d MMMM yyyy", { locale: ru })}`;
  return format(d, "EEEE, d MMMM yyyy", { locale: ru });
}

export default function ChroniclePage() {
  const { data: notes,      isLoading: ln } = useListNotes();
  const { data: pieces,     isLoading: lp } = useListPieces();
  const { data: composers,  isLoading: lc } = useListComposers();
  const { data: books,      isLoading: lb } = useListBooks();

  const isLoading = ln || lp || lc || lb;

  const groupedByDate = useMemo(() => {
    const events: ActivityEvent[] = [];

    (pieces ?? []).forEach(p => {
      if (!p.createdAt) return;
      events.push({ id: p.id, kind: "piece", title: p.title, subtitle: p.composerName ?? undefined, href: `/pieces/${p.id}`, date: p.createdAt.slice(0, 10) });
    });

    (composers ?? []).forEach(c => {
      if (!c.createdAt) return;
      events.push({ id: c.id, kind: "composer", title: c.name, href: `/composers/${c.id}`, date: c.createdAt.slice(0, 10) });
    });

    (books ?? []).forEach(b => {
      if (!b.createdAt) return;
      events.push({ id: b.id, kind: "book", title: b.title, subtitle: b.author ?? undefined, href: `/books/${b.id}`, date: b.createdAt.slice(0, 10) });
    });

    (notes ?? []).forEach(n => {
      if (!n.createdAt) return;
      const kind: EventKind = n.section === "masterclasses" ? "masterclass" : "note";
      const href = n.section === "masterclasses" ? `/masterclasses/${n.id}` : `/notes`;
      events.push({ id: n.id, kind, title: n.title, href, date: n.createdAt.slice(0, 10) });
    });

    const grouped: Record<string, ActivityEvent[]> = {};
    events.forEach(ev => {
      if (!grouped[ev.date]) grouped[ev.date] = [];
      grouped[ev.date].push(ev);
    });
    return grouped;
  }, [notes, pieces, composers, books]);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  if (isLoading) {
    return <div className="text-center py-20 font-serif italic text-muted-foreground">Листаю страницы...</div>;
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="mb-10">
        <h2 className="font-serif italic text-3xl text-foreground">Хроника</h2>
        <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mt-1">
          Твой прогресс по дням
        </p>
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-sm bg-card/50">
          <Scroll className="w-8 h-8 mx-auto text-muted-foreground mb-4 opacity-40" />
          <p className="font-serif italic text-muted-foreground text-lg">
            Пока ничего не добавлено.
          </p>
          <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mt-2 opacity-50">
            Добавляй произведения, композиторов, заметки — и они появятся здесь
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-border/30 hidden md:block" />

          <div className="space-y-10">
            {sortedDates.map(dateKey => {
              const dayEvents = groupedByDate[dateKey];
              const isNow = isToday(parseISO(dateKey));
              return (
                <div key={dateKey} className="md:flex gap-0">
                  <div className="md:w-24 flex-shrink-0 mb-3 md:mb-0 text-right pr-0 md:pr-5">
                    <span className={`text-[0.58rem] font-sans font-semibold uppercase tracking-[0.15em] leading-tight block ${isNow ? "text-primary" : "text-muted-foreground/70"}`}>
                      {isNow ? (
                        <>Сегодня<br /><span className="normal-case tracking-normal opacity-70">{format(parseISO(dateKey), "d MMM", { locale: ru })}</span></>
                      ) : (
                        format(parseISO(dateKey), "d MMM", { locale: ru })
                      )}
                    </span>
                  </div>

                  <div className="relative md:pl-8 flex-1">
                    <div className={`absolute left-0 top-2 w-2.5 h-2.5 rounded-full hidden md:block border-2 ${isNow ? "bg-primary border-primary" : "bg-background border-border/60"}`} />

                    <p className="font-serif italic text-xs text-muted-foreground mb-3 capitalize">
                      {formatDateLabel(dateKey)}
                    </p>

                    <div className="space-y-2">
                      {dayEvents.map(ev => {
                        const meta = KIND_META[ev.kind];
                        return (
                          <Link key={`${ev.kind}-${ev.id}`} href={ev.href}>
                            <div className="group flex items-center gap-3 bg-card notebook-border px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer">
                              <meta.Icon className={`w-3.5 h-3.5 flex-shrink-0 ${meta.color} opacity-70`} />
                              <div className="flex-1 min-w-0">
                                <span className="font-serif text-foreground text-sm group-hover:text-primary transition-colors">
                                  {ev.title}
                                </span>
                                {ev.subtitle && (
                                  <span className="font-sans text-muted-foreground text-xs ml-2">
                                    — {ev.subtitle}
                                  </span>
                                )}
                              </div>
                              <span className={`text-[0.55rem] font-sans uppercase tracking-widest flex-shrink-0 ${meta.color} opacity-50`}>
                                {meta.label}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    <p className="font-sans text-[0.6rem] text-muted-foreground/40 mt-2 tracking-wide">
                      {dayEvents.length} {dayEvents.length === 1 ? "запись" : dayEvents.length < 5 ? "записи" : "записей"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
