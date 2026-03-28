import { useState } from "react";
import { useRoute } from "wouter";
import { useGetPiece, useDeletePiece, getListPiecesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { PieceForm } from "@/components/Forms";
import { Edit3, Trash2 } from "lucide-react";
import { extractYouTubeId } from "@/lib/utils";

export default function PieceDetailPage() {
  const [, params] = useRoute("/pieces/:id");
  const pieceId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: piece, isLoading } = useGetPiece(pieceId);
  const deletePiece = useDeletePiece();
  const queryClient = useQueryClient();
  const { isEditing } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this piece?")) {
      await deletePiece.mutateAsync({ id: pieceId });
      queryClient.invalidateQueries({ queryKey: getListPiecesQueryKey() });
      window.history.back();
    }
  };

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Reading score...</div>;
  if (!piece) return <div className="text-center py-20 font-serif italic text-muted-foreground">Piece not found.</div>;

  const ytId = extractYouTubeId(piece.youtubeUrl);

  return (
    <article className="animate-in fade-in duration-700 max-w-4xl mx-auto">
      <header className="mb-10 relative pr-20">
        <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-primary mb-3">
          {piece.composer} {piece.year ? `· ${piece.year}` : ''}
        </div>
        <h1 className="font-serif font-bold text-4xl md:text-5xl text-foreground leading-tight mb-4">
          {piece.title}
        </h1>
        
        {piece.tags && piece.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {piece.tags.map(t => (
              <span key={t} className="px-3 py-1 bg-card notebook-border text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground rounded-sm">
                {t}
              </span>
            ))}
          </div>
        )}

        {isEditing && (
          <div className="absolute top-0 right-0 flex gap-3">
            <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-muted-foreground hover:text-primary transition-colors bg-card notebook-border rounded-full shadow-sm"><Edit3 className="w-4 h-4" /></button>
            <button onClick={handleDelete} className="p-2 text-muted-foreground hover:text-red-700 transition-colors bg-card notebook-border rounded-full shadow-sm"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </header>

      {ytId && (
        <div className="mb-12 rounded-sm overflow-hidden notebook-border bg-black shadow-xl aspect-video w-full">
          <iframe 
            src={`https://www.youtube.com/embed/${ytId}`}
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      )}

      <div className="editor-content bg-card notebook-border p-8 md:p-12 relative max-w-3xl mx-auto">
        <div className="absolute -top-4 left-8 bg-background px-4 font-sans font-semibold text-xs tracking-widest text-muted-foreground uppercase">
          Analysis & Notes
        </div>
        {piece.content ? piece.content.split('\n').map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        )) : (
          <p className="italic text-muted-foreground text-center">No analysis written for this piece.</p>
        )}
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Piece">
        <PieceForm initialData={piece} onSuccess={() => setIsEditModalOpen(false)} />
      </Modal>
    </article>
  );
}
