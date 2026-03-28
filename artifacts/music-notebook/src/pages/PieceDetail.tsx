import { useState } from "react";
import { useRoute } from "wouter";
import { useGetPiece, useUpdatePiece, useDeletePiece, getListPiecesQueryKey, getGetPieceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { PieceForm } from "@/components/Forms";
import { ArticleEditor, parseBlocks, serializeBlocks, type Block } from "@/components/ArticleEditor";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { Edit3, Trash2, BookOpen, Check, X, Loader2 } from "lucide-react";
import { extractYouTubeId } from "@/lib/utils";

export default function PieceDetailPage() {
  const [, params] = useRoute("/pieces/:id");
  const pieceId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: piece, isLoading } = useGetPiece(pieceId);
  const deletePiece = useDeletePiece();
  const updatePiece = useUpdatePiece();
  const queryClient = useQueryClient();
  const { isEditing } = useAuth();
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this piece?")) {
      await deletePiece.mutateAsync({ id: pieceId });
      queryClient.invalidateQueries({ queryKey: getListPiecesQueryKey() });
      window.history.back();
    }
  };

  const startEditingAnalysis = () => {
    setBlocks(parseBlocks(piece?.content));
    setIsEditingAnalysis(true);
  };

  const cancelEditingAnalysis = () => {
    setIsEditingAnalysis(false);
    setBlocks([]);
  };

  const saveAnalysis = async () => {
    if (!piece) return;
    setIsSaving(true);
    try {
      await updatePiece.mutateAsync({
        id: pieceId,
        data: {
          title: piece.title,
          composer: piece.composer,
          composerId: piece.composerId ?? undefined,
          year: piece.year ?? undefined,
          youtubeUrl: piece.youtubeUrl ?? undefined,
          tags: piece.tags,
          content: serializeBlocks(blocks),
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetPieceQueryKey(pieceId) });
      setIsEditingAnalysis(false);
      setBlocks([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Reading score...</div>;
  if (!piece) return <div className="text-center py-20 font-serif italic text-muted-foreground">Piece not found.</div>;

  const ytId = extractYouTubeId(piece.youtubeUrl);

  return (
    <article className="animate-in fade-in duration-700 max-w-4xl mx-auto">
      <header className="mb-10 relative pr-24">
        <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-primary mb-3">
          {piece.composer}{piece.year ? ` · ${piece.year}` : ""}
        </div>
        <h1 className="font-serif font-bold text-4xl md:text-5xl text-foreground leading-tight mb-4">
          {piece.title}
        </h1>

        {piece.tags && piece.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {piece.tags.map(t => (
              <span key={t} className="px-3 py-1 bg-primary/8 border border-primary/20 text-xs font-sans uppercase tracking-[0.15em] text-primary/80 rounded-sm">
                {t}
              </span>
            ))}
          </div>
        )}

        {isEditing && (
          <div className="absolute top-0 right-0 flex gap-2">
            <button
              onClick={() => setIsEditInfoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/40 bg-card transition-all rounded-sm shadow-sm"
            >
              <Edit3 className="w-3 h-3" /> Edit info
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-muted-foreground hover:text-red-700 transition-colors bg-card border border-border/50 rounded-sm shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
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
          />
        </div>
      )}

      <section className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-primary/60" />
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Analysis & Notes
            </h2>
          </div>
          {isEditing && !isEditingAnalysis && (
            <button
              onClick={startEditingAnalysis}
              className="flex items-center gap-1.5 text-[0.65rem] font-sans uppercase tracking-widest text-primary hover:opacity-70 transition-opacity border border-primary/30 px-3 py-1.5 rounded-sm hover:bg-primary/5"
            >
              <Edit3 className="w-3 h-3" /> Edit Analysis
            </button>
          )}
          {isEditing && isEditingAnalysis && (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEditingAnalysis}
                className="flex items-center gap-1.5 text-[0.65rem] font-sans uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border border-border/50 px-3 py-1.5 rounded-sm"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
              <button
                onClick={saveAnalysis}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-[0.65rem] font-sans uppercase tracking-widest text-primary-foreground bg-primary hover:bg-primary/90 transition-colors px-3 py-1.5 rounded-sm disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-border/30 pt-8">
          {isEditingAnalysis ? (
            <ArticleEditor blocks={blocks} onChange={setBlocks} />
          ) : (
            <ArticleRenderer content={piece.content} />
          )}
        </div>
      </section>

      <div className="mt-20 flex justify-center opacity-40">
        <img src={`${import.meta.env.BASE_URL}images/ornament-2.png`} alt="" className="w-48" />
      </div>

      <Modal isOpen={isEditInfoOpen} onClose={() => setIsEditInfoOpen(false)} title="Edit Piece Info">
        <PieceForm initialData={piece} onSuccess={() => setIsEditInfoOpen(false)} />
      </Modal>
    </article>
  );
}
