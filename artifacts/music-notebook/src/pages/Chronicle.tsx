import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListNotes, useCreateNote, getListNotesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { NoteForm } from "@/components/Forms";
import { Plus, ScrollText } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";

export default function ChroniclePage() {
  const { data: allNotes, isLoading } = useListNotes();
  const { isEditing } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const createNote = useCreateNote();

  const notes = allNotes?.filter(n => n.section === "chronicle") ?? [];

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const hasTodayEntry = notes.some(n => {
    if (!n.createdAt) return false;
    return format(parseISO(n.createdAt), "yyyy-MM-dd") === todayStr;
  });

  useEffect(() => {
    if (!isLoading && isEditing && !hasTodayEntry) {
      const autoCreate = async () => {
        await createNote.mutateAsync({
          data: {
            title: format(new Date(), "MMMM d, yyyy"),
            section: "chronicle",
            chapterTitle: "Today's Entry",
            content: "",
            imageUrl: "",
            sortOrder: 0,
          }
        });
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      };
      autoCreate();
    }
  }, [isLoading, isEditing]);

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Loading chronicle...</div>;

  const groupedByDate = notes.reduce((acc, note) => {
    const dateKey = note.createdAt ? format(parseISO(note.createdAt), "yyyy-MM-dd") : "unknown";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(note);
    return acc;
  }, {} as Record<string, typeof notes>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === "unknown") return "Unknown Date";
    const d = parseISO(dateStr);
    if (isToday(d)) return `Today — ${format(d, "MMMM d, yyyy")}`;
    if (isYesterday(d)) return `Yesterday — ${format(d, "MMMM d, yyyy")}`;
    return format(d, "EEEE, MMMM d, yyyy");
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-10">
        <h2 className="font-serif italic text-3xl text-foreground">Chronicle</h2>
        {isEditing && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> New Entry
          </button>
        )}
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm bg-card/50">
          <ScrollText className="w-8 h-8 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="font-serif italic text-muted-foreground text-lg">The chronicle is empty.</p>
          {isEditing && (
            <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mt-2 opacity-60">
              A new entry will be created automatically when you next log in.
            </p>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border/40 ml-[6.5rem] hidden md:block" />
          <div className="space-y-10">
            {sortedDates.map((dateKey) => (
              <div key={dateKey} className="md:flex gap-8">
                <div className="md:w-24 flex-shrink-0 mb-3 md:mb-0 text-right">
                  <span className={`text-[0.6rem] font-sans font-semibold uppercase tracking-[0.15em] ${isToday(parseISO(dateKey)) ? "text-primary" : "text-muted-foreground"}`}>
                    {isToday(parseISO(dateKey)) ? (
                      <>Today<br /><span className="normal-case tracking-normal text-[0.6rem]">{format(parseISO(dateKey), "MMM d")}</span></>
                    ) : format(parseISO(dateKey), "MMM d")}
                  </span>
                </div>
                <div className="relative md:pl-8 flex-1 space-y-4">
                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-background border-2 border-primary/40 hidden md:block" />
                  {groupedByDate[dateKey].map((note) => (
                    <Link key={note.id} href={`/notes/${note.id}`} className="group block">
                      <article className="bg-card notebook-border p-5 hover:bg-muted/30 hover:shadow-md transition-all">
                        <div className="font-serif font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-1">
                          {note.title}
                        </div>
                        {note.chapterTitle && (
                          <div className="font-sans text-[0.65rem] uppercase tracking-widest text-muted-foreground mb-2">{note.chapterTitle}</div>
                        )}
                        {note.content ? (
                          <p className="font-serif italic text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                            {note.content.replace(/<[^>]*>?/gm, "")}
                          </p>
                        ) : (
                          <p className="font-serif italic text-muted-foreground/40 text-sm">No content yet...</p>
                        )}
                        <div className="mt-3 text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                          Open entry →
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Chronicle Entry">
        <NoteForm defaultSection="chronicle" onSuccess={() => setIsAddModalOpen(false)} />
      </Modal>
    </div>
  );
}
