import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListPieces } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { PieceForm } from "@/components/Forms";
import { Plus, PlayCircle, ArrowRight, Search, ChevronDown } from "lucide-react";

export default function PiecesPage() {
  const { data: pieces, isLoading } = useListPieces();
  const { isEditing } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [composerFilter, setComposerFilter] = useState("all");

  const allComposers = useMemo(() => {
    const names = Array.from(new Set(pieces?.map(p => p.composer).filter(Boolean) ?? [])).sort();
    return names;
  }, [pieces]);

  const filtered = useMemo(() => {
    if (!pieces) return [];
    return pieces.filter(p => {
      const matchesComposer = composerFilter === "all" || p.composer === composerFilter;
      const matchesSearch = !search.trim() || p.title.toLowerCase().includes(search.toLowerCase());
      return matchesComposer && matchesSearch;
    });
  }, [pieces, composerFilter, search]);

  const grouped = filtered.reduce((acc, piece) => {
    const comp = piece.composer || "Unknown";
    if (!acc[comp]) acc[comp] = [];
    acc[comp].push(piece);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const sortedComposers = Object.keys(grouped).sort();

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Sorting sheet music...</div>;

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif italic text-3xl text-foreground">Music & Analysis</h2>
        {isEditing && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Add Piece
          </button>
        )}
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10 p-4 bg-card notebook-border">
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="w-full bg-transparent text-foreground font-serif text-sm placeholder:text-muted-foreground/50 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground/50 hover:text-foreground transition-colors text-xs">✕</button>
          )}
        </div>
        <div className="w-px bg-border/40 hidden sm:block" />
        <div className="flex items-center gap-2 relative">
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none absolute right-2" />
          <select
            value={composerFilter}
            onChange={e => setComposerFilter(e.target.value)}
            className="bg-transparent text-foreground font-sans text-xs uppercase tracking-widest pr-6 focus:outline-none appearance-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          >
            <option value="all">All composers</option>
            {allComposers.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {sortedComposers.length === 0 ? (
        <div className="text-center py-20 italic font-serif text-muted-foreground">
          {search || composerFilter !== "all" ? "No pieces match your search." : "No pieces logged yet."}
        </div>
      ) : (
        <div className="space-y-12">
          {sortedComposers.map(composer => (
            <section key={composer}>
              <h3 className="font-serif font-bold text-2xl text-foreground border-b-2 border-border pb-2 mb-6 inline-block pr-8">{composer}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped[composer].map(piece => (
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
