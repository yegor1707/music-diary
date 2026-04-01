import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetComposer, useUpdateComposer, useDeleteComposer, getListComposersQueryKey, getGetComposerQueryKey, useListPieces } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { ComposerForm } from "@/components/Forms";
import { ArticleEditor, parseBlocks, serializeBlocks, type Block } from "@/components/ArticleEditor";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { Edit3, Trash2, Music, Check, X, Loader2 } from "lucide-react";

export default function ComposerDetailPage() {
  const [, params] = useRoute("/composers/:id");
  const composerId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: composer, isLoading } = useGetComposer(composerId);
  const { data: allPieces } = useListPieces();
  const updateComposer = useUpdateComposer();
  const deleteComposer = useDeleteComposer();
  const queryClient = useQueryClient();
  const { isEditing } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const pieces = allPieces?.filter(p => p.composerId === composerId) || [];

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this master?")) {
      await deleteComposer.mutateAsync({ id: composerId });
      queryClient.invalidateQueries({ queryKey: getListComposersQueryKey() });
      window.history.back();
    }
  };

  const startEditingBio = () => {
    const raw = composer?.biography || "";
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setBlocks(parsed);
      } else {
        setBlocks(raw.trim() ? [{ id: "bio0", type: "text" as const, content: raw }] : []);
      }
    } catch {
      setBlocks(raw.trim() ? [{ id: "bio0", type: "text" as const, content: raw }] : []);
    }
    setIsEditingBio(true);
  };

  const cancelEditingBio = () => {
    setIsEditingBio(false);
    setBlocks([]);
  };

  const saveBio = async () => {
    if (!composer) return;
    setIsSaving(true);
    try {
      await updateComposer.mutateAsync({
        id: composerId,
        data: {
          name: composer.name,
          born: composer.born ?? undefined,
          died: composer.died ?? undefined,
          nationality: composer.nationality ?? undefined,
          imageUrl: composer.imageUrl ?? undefined,
          biography: serializeBlocks(blocks),
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetComposerQueryKey(composerId) });
      setIsEditingBio(false);
      setBlocks([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Opening archives...</div>;
  if (!composer) return <div className="text-center py-20 font-serif italic text-muted-foreground">Composer not found.</div>;

  return (
    <article className="animate-in fade-in duration-700 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-10 mb-14 relative">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="aspect-[3/4] w-full bg-card notebook-border shadow-xl overflow-hidden border-l-8 border-l-primary/60 rounded-r-sm">
            {composer.imageUrl ? (
              <img
                src={composer.imageUrl}
                alt={composer.name}
                className="w-full h-full object-cover sepia-[0.15]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/10">
                <span className="font-serif italic text-8xl text-primary/20">
                  {composer.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 pt-2 md:pt-12">
          <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.25em] text-primary mb-4">
            {composer.nationality || "Composer"}
          </div>
          <h1 className="font-serif font-bold text-4xl md:text-5xl text-foreground leading-tight mb-4">
            {composer.name}
          </h1>
          {(composer.born || composer.died) && (
            <p className="font-sans text-sm tracking-[0.15em] uppercase text-muted-foreground mb-6">
              {composer.born && composer.died
                ? `${composer.born} — ${composer.died}`
                : composer.born
                  ? `b. ${composer.born}`
                  : `d. ${composer.died}`}
            </p>
          )}
          <div className="h-px bg-border/40 my-6 w-24"></div>
          <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
            {pieces.length} studied {pieces.length === 1 ? "work" : "works"}
          </p>
        </div>

        {isEditing && (
          <div className="absolute top-0 right-0 flex gap-3">
            <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-muted-foreground hover:text-primary transition-colors bg-card notebook-border rounded-full shadow-sm">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="p-2 text-muted-foreground hover:text-red-700 transition-colors bg-card notebook-border rounded-full shadow-sm">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="font-sans font-semibold text-xs tracking-widest text-muted-foreground uppercase">Biographical Notes</h2>
            <div className="h-px bg-border/50 w-16"></div>
          </div>
          {isEditing && !isEditingBio && (
            <button
              onClick={startEditingBio}
              className="flex items-center gap-1.5 text-[0.65rem] font-sans uppercase tracking-widest text-primary hover:opacity-70 transition-opacity border border-primary/30 px-3 py-1.5 rounded-sm hover:bg-primary/5"
            >
              <Edit3 className="w-3 h-3" /> Edit Biography
            </button>
          )}
          {isEditing && isEditingBio && (
            <div className="flex gap-2">
              <button
                onClick={cancelEditingBio}
                className="flex items-center gap-1.5 text-[0.65rem] font-sans uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border border-border/50 px-3 py-1.5 rounded-sm"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
              <button
                onClick={saveBio}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-[0.65rem] font-sans uppercase tracking-widest text-primary-foreground bg-primary hover:bg-primary/90 transition-colors px-3 py-1.5 rounded-sm disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
            </div>
          )}
        </div>

        {isEditingBio
          ? <ArticleEditor blocks={blocks} onChange={setBlocks} mode="content" />
          : (
            <div className="bg-card notebook-border p-8 md:p-12 relative">
              <div className="absolute -top-4 left-8 bg-background px-4 font-sans font-semibold text-xs tracking-widest text-muted-foreground uppercase">
                Life & Work
              </div>
              {composer.biography ? (
                (() => {
                  try {
                    const parsed = JSON.parse(composer.biography);
                    if (Array.isArray(parsed)) {
                      return <ArticleRenderer content={composer.biography} />;
                    }
                  } catch {}
                  return composer.biography.split('\n').map((para, i) => (
                    <p key={i} className="font-serif text-foreground/90 text-lg leading-[1.85] mb-4">{para}</p>
                  ));
                })()
              ) : (
                <p className="font-serif italic text-muted-foreground text-center py-8">
                  No biographical notes written yet.
                </p>
              )}
            </div>
          )
        }
      </div>

      {pieces.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-serif italic text-3xl text-foreground">Studied Works</h2>
            <div className="flex-1 h-px bg-border/50"></div>
            <span className="font-sans text-xs text-muted-foreground uppercase tracking-widest">{pieces.length} pieces</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pieces.map(piece => (
              <Link key={piece.id} href={`/pieces/${piece.id}`} className="group block">
                <div className="p-5 bg-card notebook-border hover:bg-muted/30 transition-all flex items-start gap-4">
                  <div className="mt-1 text-primary/40">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-lg text-foreground leading-tight group-hover:text-primary transition-colors">{piece.title}</h4>
                    <p className="font-sans text-[0.65rem] tracking-widest uppercase text-muted-foreground mt-2">{piece.genre || piece.year || "Music"}</p>
                  </div>
                  <span className="ml-auto text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all self-center">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Composer">
        <ComposerForm initialData={composer} onSuccess={() => setIsEditModalOpen(false)} />
      </Modal>
    </article>
  );
}
