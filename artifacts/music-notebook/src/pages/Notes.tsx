import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListNotes } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { NoteForm } from "@/components/Forms";
import { Plus, Feather, Search, Calendar, X as XIcon } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-1 text-sm font-sans"
        >
          <XIcon className="w-5 h-5" /> Close
        </button>
        <img src={src} alt={alt} className="w-full h-auto max-h-[85vh] object-contain rounded-sm" />
      </div>
    </div>
  );
}

export default function NotesPage() {
  const { data: allNotes, isLoading } = useListNotes();
  const { isEditing } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState("");

  const notes = useMemo(() => {
    const all = allNotes?.filter(n => n.section !== "chronicle" && n.section !== "masterclasses") ?? [];
    return all.filter(n => {
      const matchesText = !search.trim() ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        (n.content || "").toLowerCase().includes(search.toLowerCase());
      const matchesDate = !dateFilter ||
        (n.createdAt && isSameDay(parseISO(n.createdAt), parseISO(dateFilter)));
      return matchesText && matchesDate;
    });
  }, [allNotes, search, dateFilter]);

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Loading manuscript...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif italic text-3xl text-foreground">Notes & Thoughts</h2>
        {isEditing && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> New Entry
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex items-center gap-2 flex-1 p-4 bg-card notebook-border">
          <Search className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes by title or content..."
            className="w-full bg-transparent text-foreground font-serif text-sm placeholder:text-muted-foreground/50 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground/50 hover:text-foreground transition-colors text-xs">✕</button>
          )}
        </div>
        <div className="flex items-center gap-2 p-4 bg-card notebook-border">
          <Calendar className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-transparent text-foreground font-serif text-sm focus:outline-none text-muted-foreground"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter("")} className="text-muted-foreground/50 hover:text-foreground transition-colors text-xs">✕</button>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm bg-card/50">
          <Feather className="w-8 h-8 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="font-serif italic text-muted-foreground text-lg">
            {search || dateFilter ? "No notes match your search." : "The journal is empty."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="group block">
              <article className="h-full bg-card notebook-border p-5 hover:bg-muted/30 hover:shadow-md transition-all">
                <div className="flex gap-4">
                  {note.imageUrl && (
                    <div
                      className="flex-shrink-0 w-16 h-16 rounded-sm overflow-hidden border border-border/50 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLightboxSrc(note.imageUrl!);
                        setLightboxAlt(note.title);
                      }}
                      title="Click to expand"
                    >
                      <img src={note.imageUrl} alt={note.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-primary mb-2">
                      {note.createdAt ? format(new Date(note.createdAt), 'MMMM d, yyyy') : 'Timeless'}
                    </div>
                    <h3 className="font-serif font-bold text-xl text-foreground leading-tight mb-1 group-hover:text-primary transition-colors truncate">
                      {note.title}
                    </h3>
                    {note.chapterTitle && (
                      <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        {note.chapterTitle}
                      </p>
                    )}
                    <p className="font-serif italic text-muted-foreground line-clamp-2 leading-relaxed text-sm">
                      {note.content || "No content written yet."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-sans uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Read more <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Note">
        <NoteForm defaultSection="notes" onSuccess={() => setIsAddModalOpen(false)} />
      </Modal>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={lightboxAlt}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </div>
  );
}
