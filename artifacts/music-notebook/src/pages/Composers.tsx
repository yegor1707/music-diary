import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListComposers } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { ComposerForm } from "@/components/Forms";
import { Plus, Search } from "lucide-react";

export default function ComposersPage() {
  const { data: composers, isLoading } = useListComposers();
  const { isEditing } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!composers) return [];
    if (!search.trim()) return composers;
    return composers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.nationality || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [composers, search]);

  const grouped = filtered.reduce((acc, composer) => {
    const letter = composer.name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(composer);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const sortedLetters = Object.keys(grouped).sort();

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Gathering masters...</div>;

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif italic text-3xl text-foreground">Composers</h2>
        {isEditing && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Add Composer
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-8 p-4 bg-card notebook-border">
        <Search className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search composers by name or nationality..."
          className="w-full bg-transparent text-foreground font-serif text-sm placeholder:text-muted-foreground/50 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-muted-foreground/50 hover:text-foreground transition-colors text-xs">✕</button>
        )}
      </div>

      {!filtered || filtered.length === 0 ? (
        <div className="text-center py-20 italic font-serif text-muted-foreground">
          {search ? "No composers match your search." : "No composers found."}
        </div>
      ) : (
        <div className="space-y-10">
          {sortedLetters.map(letter => (
            <div key={letter}>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="font-serif italic text-2xl text-primary">{letter}</h3>
                <div className="flex-1 h-px bg-border/50"></div>
              </div>
              <div className="space-y-3">
                {grouped[letter].map(composer => (
                  <Link key={composer.id} href={`/composers/${composer.id}`} className="block group">
                    <div className="flex items-center gap-5 p-4 bg-card notebook-border hover:bg-muted/30 transition-colors">
                      {composer.imageUrl ? (
                        <img src={composer.imageUrl} alt={composer.name} className="w-14 h-14 rounded-full object-cover border border-border sepia-[0.3]" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center font-serif italic text-xl text-primary">
                          {composer.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-serif font-bold text-xl text-foreground group-hover:text-primary transition-colors">{composer.name}</h4>
                        <p className="font-sans text-xs tracking-widest text-muted-foreground uppercase mt-1">
                          {[composer.born && composer.died ? `${composer.born} - ${composer.died}` : null, composer.nationality].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Composer">
        <ComposerForm onSuccess={() => setIsAddModalOpen(false)} />
      </Modal>
    </div>
  );
}
