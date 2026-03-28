import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetComposer, useDeleteComposer, getListComposersQueryKey, useListPieces } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { ComposerForm } from "@/components/Forms";
import { Edit3, Trash2, Music } from "lucide-react";

export default function ComposerDetailPage() {
  const [, params] = useRoute("/composers/:id");
  const composerId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: composer, isLoading } = useGetComposer(composerId);
  const { data: allPieces } = useListPieces();
  
  const deleteComposer = useDeleteComposer();
  const queryClient = useQueryClient();
  const { isEditing } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const pieces = allPieces?.filter(p => p.composerId === composerId) || [];

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this master?")) {
      await deleteComposer.mutateAsync({ id: composerId });
      queryClient.invalidateQueries({ queryKey: getListComposersQueryKey() });
      window.history.back();
    }
  };

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Opening archives...</div>;
  if (!composer) return <div className="text-center py-20 font-serif italic text-muted-foreground">Composer not found.</div>;

  return (
    <article className="animate-in fade-in duration-700 max-w-3xl mx-auto">
      <header className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-16 relative">
        {composer.imageUrl ? (
          <img src={composer.imageUrl} alt={composer.name} className="w-48 h-48 rounded-full object-cover border-4 border-card shadow-xl sepia-[0.2]" />
        ) : (
          <div className="w-48 h-48 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center font-serif italic text-6xl text-primary">
            {composer.name.charAt(0)}
          </div>
        )}
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="font-serif font-bold text-5xl text-foreground leading-tight mb-2">
            {composer.name}
          </h1>
          <p className="font-sans text-sm tracking-[0.2em] uppercase text-primary font-medium">
             {[composer.born && composer.died ? `${composer.born} — ${composer.died}` : null, composer.nationality].filter(Boolean).join(" · ")}
          </p>
        </div>

        {isEditing && (
          <div className="absolute top-0 right-0 flex gap-3">
            <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-muted-foreground hover:text-primary transition-colors bg-card notebook-border rounded-full shadow-sm"><Edit3 className="w-4 h-4" /></button>
            <button onClick={handleDelete} className="p-2 text-muted-foreground hover:text-red-700 transition-colors bg-card notebook-border rounded-full shadow-sm"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </header>

      <div className="editor-content bg-card notebook-border p-8 md:p-12 mb-16 relative">
        <div className="absolute -top-4 left-8 bg-background px-4 font-sans font-semibold text-xs tracking-widest text-muted-foreground uppercase">
          Biographical Notes
        </div>
        {composer.biography ? composer.biography.split('\n').map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        )) : (
          <p className="italic text-muted-foreground text-center">No biographical notes written yet.</p>
        )}
      </div>

      <section>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="font-serif italic text-3xl text-foreground">Studied Works</h2>
          <div className="flex-1 h-px bg-border/50"></div>
          <span className="font-sans text-xs text-muted-foreground uppercase tracking-widest">{pieces.length} Pieces</span>
        </div>

        {pieces.length === 0 ? (
          <p className="font-serif italic text-muted-foreground text-center py-8">No pieces linked to this composer yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pieces.map(piece => (
              <Link key={piece.id} href={`/pieces/${piece.id}`} className="group block">
                <div className="p-5 bg-card notebook-border hover:bg-muted/30 transition-all flex items-start gap-4">
                  <div className="mt-1 text-primary/40"><Music className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-serif font-bold text-lg text-foreground leading-tight group-hover:text-primary transition-colors">{piece.title}</h4>
                    <p className="font-sans text-[0.65rem] tracking-widest uppercase text-muted-foreground mt-2">{piece.genre || "Music"}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Composer">
        <ComposerForm initialData={composer} onSuccess={() => setIsEditModalOpen(false)} />
      </Modal>
    </article>
  );
}
