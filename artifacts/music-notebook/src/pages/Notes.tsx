import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListNotes } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { NoteForm } from "@/components/Forms";
import { Plus, Feather, Search } from "lucide-react";
import { format } from "date-fns";

export default function NotesPage() {
  const { data: allNotes, isLoading } = useListNotes();
  const { isEditing } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const notes = useMemo(() => {
    const all = allNotes?.filter(n => n.section !== "chronicle" && n.section !== "masterclasses") ?? [];
    if (!search.trim()) return all;
    return all.filter(n =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.content || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [allNotes, search]);

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

      <div className="flex items-center gap-2 mb-8 p-4 bg-card notebook-border">
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

      {notes.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm bg-card/50">
          <Feather className="w-8 h-8 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="font-serif italic text-muted-foreground text-lg">
            {search ? "No notes match your search." : "The journal is empty."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="group block">
              <article className="h-full bg-card notebook-border p-6 hover:bg-muted/30 hover:shadow-md transition-all relative overflow-hidden">
                {note.imageUrl && (
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <img src={note.imageUrl} alt="" className="w-full h-full object-cover rounded-bl-3xl mix-blend-multiply" />
                  </div>
                )}
                <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                  {note.createdAt ? format(new Date(note.createdAt), 'MMMM d, yyyy') : 'Timeless'}
                </div>
                <h3 className="font-serif font-bold text-2xl text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">
                  {note.title}
                </h3>
                {note.chapterTitle && (
                  <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-4">
                    {note.chapterTitle}
                  </p>
                )}
                <p className="font-serif italic text-muted-foreground line-clamp-3 leading-relaxed">
                  {note.content || "No content written yet."}
                </p>
                <div className="mt-6 flex items-center text-xs font-sans uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
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
    </div>
  );
}
