import { useState } from "react";
import { useRoute } from "wouter";
import { useGetPiece, useUpdatePiece, useDeletePiece, getListPiecesQueryKey, getGetPieceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { PieceForm } from "@/components/Forms";
import { ArticleEditor, parseBlocks, serializeBlocks, type Block } from "@/components/ArticleEditor";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { Edit3, Trash2, BookOpen, Check, X, Loader2, FileText, Music } from "lucide-react";
import { extractYouTubeId } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "analysis" | "sheet-music";

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
  const [activeTab, setActiveTab] = useState<Tab>("analysis");

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
          sheetMusicUrl: piece.sheetMusicUrl ?? undefined,
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: "analysis", label: "Analysis & Notes", icon: <BookOpen className="w-3.5 h-3.5" />, show: true },
    { id: "sheet-music", label: "Sheet Music", icon: <FileText className="w-3.5 h-3.5" />, show: true },
  ];

  return (
    <article className="animate-in fade-in duration-700 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8 relative pr-24">
        <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-primary mb-3">
          {piece.composer}{piece.year ? ` · ${piece.year}` : ""}
        </div>
        <h1 className="font-serif font-bold text-4xl md:text-5xl text-foreground leading-tight mb-4">
          {piece.title}
        </h1>
        {piece.tags && piece.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
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
              <Edit3 className="w-3 h-3" /> Edit
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

      {/* YouTube player — always at top */}
      {ytId ? (
        <div className="mb-10 rounded-sm overflow-hidden notebook-border bg-black shadow-xl aspect-video w-full">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            title={piece.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      ) : (
        isEditing && (
          <div
            onClick={() => setIsEditInfoOpen(true)}
            className="mb-10 aspect-video w-full border-2 border-dashed border-border/40 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/3 transition-all group"
          >
            <Music className="w-10 h-10 text-muted-foreground/30 group-hover:text-primary/40 mb-3 transition-colors" />
            <span className="font-sans text-xs uppercase tracking-widest text-muted-foreground/50 group-hover:text-primary/60 transition-colors">
              Click to add YouTube recording
            </span>
          </div>
        )
      )}

      {/* Tabs */}
      <div className="border-b border-border/40 mb-8">
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-xs font-sans font-medium tracking-[0.12em] uppercase border-b-2 transition-all",
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/50"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Tab */}
      {activeTab === "analysis" && (
        <section>
          {isEditing && !isEditingAnalysis && (
            <div className="flex justify-end mb-6">
              <button
                onClick={startEditingAnalysis}
                className="flex items-center gap-1.5 text-[0.65rem] font-sans uppercase tracking-widest text-primary hover:opacity-70 transition-opacity border border-primary/30 px-3 py-1.5 rounded-sm hover:bg-primary/5"
              >
                <Edit3 className="w-3 h-3" /> Edit Analysis
              </button>
            </div>
          )}
          {isEditing && isEditingAnalysis && (
            <div className="flex justify-end gap-2 mb-6">
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
          {isEditingAnalysis
            ? <ArticleEditor blocks={blocks} onChange={setBlocks} />
            : <ArticleRenderer content={piece.content} />
          }
        </section>
      )}

      {/* Sheet Music Tab */}
      {activeTab === "sheet-music" && (
        <section>
          {piece.sheetMusicUrl ? (
            <div className="space-y-6">
              <a
                href={piece.sheetMusicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-card notebook-border hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-14 bg-primary/8 border border-primary/20 rounded-sm flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary/60" />
                </div>
                <div className="flex-1">
                  <div className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {piece.title} — Sheet Music
                  </div>
                  <div className="font-sans text-xs text-muted-foreground mt-1 uppercase tracking-widest">
                    {piece.composer}
                  </div>
                </div>
                <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
                  Open PDF →
                </span>
              </a>

              {piece.sheetMusicUrl.endsWith(".pdf") || piece.sheetMusicUrl.includes("pdf") ? (
                <div className="w-full rounded-sm overflow-hidden notebook-border bg-card" style={{ height: "80vh" }}>
                  <iframe
                    src={piece.sheetMusicUrl}
                    title="Sheet Music"
                    className="w-full h-full"
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-border rounded-sm bg-card/30">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-serif italic text-muted-foreground text-lg">No sheet music attached.</p>
              {isEditing && (
                <button
                  onClick={() => setIsEditInfoOpen(true)}
                  className="mt-4 text-xs font-sans uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                >
                  + Add sheet music PDF
                </button>
              )}
            </div>
          )}
        </section>
      )}

      <div className="mt-20 flex justify-center opacity-40">
        <img src={`${import.meta.env.BASE_URL}images/ornament-2.png`} alt="" className="w-48" />
      </div>

      <Modal isOpen={isEditInfoOpen} onClose={() => setIsEditInfoOpen(false)} title="Edit Piece Info">
        <PieceForm initialData={piece} onSuccess={() => setIsEditInfoOpen(false)} />
      </Modal>
    </article>
  );
}
