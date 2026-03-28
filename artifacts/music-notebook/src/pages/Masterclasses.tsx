import { useState } from "react";
import { Link } from "wouter";
import { useListNotes } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { NoteForm } from "@/components/Forms";
import { Plus, GraduationCap } from "lucide-react";
import { format } from "date-fns";

export default function MasterclassesPage() {
  const { data: allNotes, isLoading } = useListNotes();
  const { isEditing } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const masterclasses = allNotes?.filter(n => n.section === "masterclasses") ?? [];

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Loading masterclasses...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif italic text-3xl text-foreground">Masterclasses</h2>
        {isEditing && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Add Masterclass
          </button>
        )}
      </div>

      {masterclasses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm bg-card/50">
          <GraduationCap className="w-8 h-8 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="font-serif italic text-muted-foreground text-lg">No masterclasses recorded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {masterclasses.map((mc) => (
            <Link key={mc.id} href={`/notes/${mc.id}`} className="group block">
              <article className="h-full bg-card notebook-border p-6 hover:bg-muted/30 hover:shadow-md transition-all relative overflow-hidden">
                {mc.imageUrl && (
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <img src={mc.imageUrl} alt="" className="w-full h-full object-cover rounded-bl-3xl mix-blend-multiply" />
                  </div>
                )}
                <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                  {mc.createdAt ? format(new Date(mc.createdAt), "MMMM d, yyyy") : "Timeless"}
                </div>
                <h3 className="font-serif font-bold text-2xl text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">
                  {mc.title}
                </h3>
                {mc.chapterTitle && (
                  <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-4">
                    {mc.chapterTitle}
                  </p>
                )}
                <p className="font-serif italic text-muted-foreground line-clamp-3 leading-relaxed">
                  {mc.content?.replace(/<[^>]*>?/gm, "") || "No notes written yet."}
                </p>
                <div className="mt-6 flex items-center text-xs font-sans uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Read more <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Masterclass Entry">
        <NoteForm defaultSection="masterclasses" onSuccess={() => setIsAddModalOpen(false)} />
      </Modal>
    </div>
  );
}
