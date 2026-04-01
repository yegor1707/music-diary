import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListNotes } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { NoteForm } from "@/components/Forms";
import { Plus, GraduationCap, Search, PlayCircle } from "lucide-react";
import { format } from "date-fns";

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {}
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

function YouTubeThumbnail({ url }: { url: string }) {
  const videoId = getYouTubeId(url);
  if (!videoId) return null;
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return (
    <div className="relative w-full aspect-video bg-black overflow-hidden rounded-sm">
      <img
        src={thumbUrl}
        alt="Video thumbnail"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
        <PlayCircle className="w-12 h-12 text-white drop-shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
      </div>
    </div>
  );
}

export default function MasterclassesPage() {
  const { data: allNotes, isLoading } = useListNotes();
  const { isEditing } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const masterclasses = useMemo(() => {
    const all = allNotes?.filter(n => n.section === "masterclasses") ?? [];
    if (!search.trim()) return all;
    return all.filter(m =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.chapterTitle || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [allNotes, search]);

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Loading masterclasses...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif italic text-3xl text-foreground">Masterclasses</h2>
        {isEditing && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Add Masterclass
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-8 p-4 bg-card notebook-border">
        <Search className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search masterclasses by title..."
          className="w-full bg-transparent text-foreground font-serif text-sm placeholder:text-muted-foreground/50 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-muted-foreground/50 hover:text-foreground transition-colors text-xs">✕</button>
        )}
      </div>

      {masterclasses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm bg-card/50">
          <GraduationCap className="w-8 h-8 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="font-serif italic text-muted-foreground text-lg">
            {search ? "No masterclasses match your search." : "No masterclasses recorded yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {masterclasses.map((mc) => {
            const videoId = mc.imageUrl ? getYouTubeId(mc.imageUrl) : null;
            return (
              <Link key={mc.id} href={`/masterclasses/${mc.id}`} className="group block">
                <article className="h-full bg-card notebook-border overflow-hidden hover:shadow-md transition-all">
                  {videoId ? (
                    <YouTubeThumbnail url={mc.imageUrl!} />
                  ) : mc.imageUrl ? (
                    <div className="w-full aspect-video overflow-hidden">
                      <img src={mc.imageUrl} alt={mc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-muted/30 flex items-center justify-center">
                      <GraduationCap className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-primary mb-2">
                      {mc.createdAt ? format(new Date(mc.createdAt), "MMMM d, yyyy") : "Timeless"}
                    </div>
                    <h3 className="font-serif font-bold text-xl text-foreground leading-tight mb-1 group-hover:text-primary transition-colors">
                      {mc.title}
                    </h3>
                    {mc.chapterTitle && (
                      <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-3">
                        {mc.chapterTitle}
                      </p>
                    )}
                    <p className="font-serif italic text-muted-foreground line-clamp-2 leading-relaxed text-sm">
                      {mc.content?.replace(/<[^>]*>?/gm, "").replace(/[\[\]{}'"]/g, "").substring(0, 150) || "No notes written yet."}
                    </p>
                    <div className="mt-4 flex items-center text-xs font-sans uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                      Open notes <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Masterclass Entry">
        <NoteForm defaultSection="masterclasses" onSuccess={() => setIsAddModalOpen(false)} />
      </Modal>
    </div>
  );
}
