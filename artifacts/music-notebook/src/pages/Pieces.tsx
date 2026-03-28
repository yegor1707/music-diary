import { useState } from "react";
import { Link } from "wouter";
import { useListPieces } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { PieceForm } from "@/components/Forms";
import { Plus, PlayCircle, ArrowRight } from "lucide-react";

export default function PiecesPage() {
  const { data: pieces, isLoading } = useListPieces();
  const { isEditing } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Sorting sheet music...</div>;

  const grouped = pieces?.reduce((acc, piece) => {
    const comp = piece.composer || "Unknown";
    if (!acc[comp]) acc[comp] = [];
    acc[comp].push(piece);
    return acc;
  }, {} as Record<string, typeof pieces>);

  const sortedComposers = Object.keys(grouped || {}).sort();

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif italic text-3xl text-foreground">Music & Analysis</h2>
        {isEditing && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Add Piece
          </button>
        )}
      </div>

      {!pieces || pieces.length === 0 ? (
        <div className="text-center py-20 italic font-serif text-muted-foreground">No pieces logged yet.</div>
      ) : (
        <div className="space-y-12">
          {sortedComposers.map(composer => (
            <section key={composer}>
              <h3 className="font-serif font-bold text-2xl text-foreground border-b-2 border-border pb-2 mb-6 inline-block pr-8">{composer}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped![composer].map(piece => (
                  <div key={piece.id} className="flex flex-col h-full p-5 bg-card notebook-border hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-serif font-bold text-xl text-foreground leading-tight">{piece.title}</h4>
                      {piece.youtubeUrl && <PlayCircle className="w-5 h-5 text-primary/40 flex-shrink-0 ml-2" />}
                    </div>

                    {piece.tags && piece.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                        {piece.tags.map(t => (
                          <span key={t} className="px-2.5 py-0.5 bg-primary/8 border border-primary/20 text-[0.6rem] font-sans uppercase tracking-widest text-primary/80 rounded-sm">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-border/30 pt-3">
                      <span className="font-sans text-[0.65rem] tracking-widest text-muted-foreground uppercase">{piece.year || "—"}</span>
                      <Link href={`/pieces/${piece.id}`}>
                        <span className="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
                          Analyze <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Piece">
        <PieceForm onSuccess={() => setIsAddModalOpen(false)} />
      </Modal>
    </div>
  );
}
