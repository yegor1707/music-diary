import { useState } from "react";
import { Link } from "wouter";
import { useListComposers } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { ComposerForm } from "@/components/Forms";
import { Plus } from "lucide-react";

export default function ComposersPage() {
  const { data: composers, isLoading } = useListComposers();
  const { isEditing } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Gathering masters...</div>;

  // Group by first letter
  const grouped = composers?.reduce((acc, composer) => {
    const letter = composer.name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(composer);
    return acc;
  }, {} as Record<string, typeof composers>);

  const sortedLetters = Object.keys(grouped || {}).sort();

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif italic text-3xl text-foreground">Композиторы</h2>
        {isEditing && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Add Composer
          </button>
        )}
      </div>

      {!composers || composers.length === 0 ? (
        <div className="text-center py-20 italic font-serif text-muted-foreground">No composers found.</div>
      ) : (
        <div className="space-y-10">
          {sortedLetters.map(letter => (
            <div key={letter}>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="font-serif italic text-2xl text-primary">{letter}</h3>
                <div className="flex-1 h-px bg-border/50"></div>
              </div>
              <div className="space-y-3">
                {grouped![letter].map(composer => (
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
