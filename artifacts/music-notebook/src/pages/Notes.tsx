import { useState, useMemo } from "react";
import { useListNotes, useUpdateNote, useDeleteNote, getListNotesQueryKey, getGetNoteQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { NoteForm } from "@/components/Forms";
import { Plus, Feather, Search, Calendar, X as XIcon, Edit3, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import type { Note } from "@workspace/api-client-react";

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-30 bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-1 text-sm font-sans"
        >
          <XIcon className="w-5 h-5" /> Закрыть
        </button>
        <img src={src} alt={alt} className="w-full h-auto max-h-[85vh] object-contain rounded-sm" />
      </div>
    </div>
  );
}

function DiaryEntry({ note, isEditing }: { note: Note; isEditing: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const deleteNote = useDeleteNote();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Удалить эту запись?")) {
      await deleteNote.mutateAsync({ id: note.id });
      queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
    }
  };

  const paragraphs = (note.content || "").split("\n").filter(Boolean);
  const previewText = paragraphs[0]?.slice(0, 120) || "";

  return (
    <>
      <div className="bg-card notebook-border overflow-hidden">
        {/* Collapsed header — always visible, click to toggle */}
        <div
          className="px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 mb-0.5">
                <h3 className="font-serif font-bold text-lg text-foreground leading-tight">
                  {note.title}
                </h3>
                <span className="text-[0.6rem] font-sans text-muted-foreground/60 flex-shrink-0">
                  {note.createdAt ? format(new Date(note.createdAt), "d MMM yyyy") : ""}
                </span>
              </div>
              {!expanded && (
                <p className="font-serif text-muted-foreground text-sm leading-snug line-clamp-1 mt-0.5">
                  {previewText || <span className="italic">Нет текста</span>}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              {isEditing && (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); setIsEditOpen(true); }}
                    className="p-1.5 text-muted-foreground/50 hover:text-primary transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 text-muted-foreground/50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <span className="text-muted-foreground/40 ml-1">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="px-5 pb-6 border-t border-border/20">
            {note.imageUrl && (
              <div
                className="float-right ml-5 mb-3 mt-4 w-2/5 max-w-[220px] cursor-pointer rounded-sm overflow-hidden border border-border/40 shadow-sm hover:shadow-md hover:border-border/70 transition-all"
                onClick={() => setLightboxSrc(note.imageUrl!)}
                title="Нажмите для просмотра"
              >
                <img
                  src={note.imageUrl}
                  alt={note.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
            <div className="mt-4 space-y-3">
              {paragraphs.length > 0 ? paragraphs.map((para, i) => (
                <p key={i} className="font-serif text-foreground/90 text-base leading-[1.85]">
                  {para}
                </p>
              )) : (
                <p className="font-serif italic text-muted-foreground py-4">
                  Запись пуста.
                </p>
              )}
            </div>
            <div className="clear-both" />
            <button
              onClick={() => setExpanded(false)}
              className="mt-5 text-[0.6rem] font-sans uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
            >
              <ChevronUp className="w-3 h-3" /> Свернуть
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Редактировать запись">
        <NoteForm initialData={note} onSuccess={() => setIsEditOpen(false)} />
      </Modal>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={note.title}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}

export default function NotesPage() {
  const { data: allNotes, isLoading } = useListNotes();
  const { isEditing } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const notes = useMemo(() => {
    const all = allNotes?.filter(n => n.section !== "chronicle" && n.section !== "masterclasses") ?? [];
    return all.filter(n => {
      const matchesText = !search.trim() ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        (n.content || "").toLowerCase().includes(search.toLowerCase());
      const matchesDate = !dateFilter ||
        (n.createdAt && isSameDay(parseISO(n.createdAt), parseISO(dateFilter)));
      return matchesText && matchesDate;
    });
  }, [allNotes, search, dateFilter]);

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Листаю страницы...</div>;

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif italic text-3xl text-foreground">Заметки</h2>
        {isEditing && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Новая запись
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex items-center gap-2 flex-1 p-4 bg-card notebook-border">
          <Search className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по заметкам..."
            className="w-full bg-transparent text-foreground font-serif text-sm placeholder:text-muted-foreground/50 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground/50 hover:text-foreground transition-colors text-xs">✕</button>
          )}
        </div>
        <div className="flex items-center gap-2 p-4 bg-card notebook-border">
          <Calendar className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-transparent text-foreground font-serif text-sm focus:outline-none text-muted-foreground"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter("")} className="text-muted-foreground/50 hover:text-foreground transition-colors text-xs">✕</button>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm bg-card/50">
          <Feather className="w-8 h-8 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="font-serif italic text-muted-foreground text-lg">
            {search || dateFilter ? "Записей не найдено." : "Дневник пуст."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <DiaryEntry key={note.id} note={note} isEditing={isEditing} />
          ))}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Новая запись">
        <NoteForm defaultSection="notes" onSuccess={() => setIsAddModalOpen(false)} />
      </Modal>
    </div>
  );
}
