import { useState } from "react";
import { useRoute } from "wouter";
import { useGetNote, useUpdateNote, useDeleteNote, getListNotesQueryKey, getGetNoteQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { NoteForm } from "@/components/Forms";
import { ArticleEditor, parseBlocks, serializeBlocks, type Block } from "@/components/ArticleEditor";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { Edit3, Trash2, Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function MasterclassDetailPage() {
  const [, params] = useRoute("/masterclasses/:id");
  const noteId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: note, isLoading } = useGetNote(noteId);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const queryClient = useQueryClient();
  const { isEditing } = useAuth();
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this masterclass entry?")) {
      await deleteNote.mutateAsync({ id: noteId });
      queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      window.history.back();
    }
  };

  const startEditing = () => {
    setBlocks(parseBlocks(note?.content));
    setIsEditingContent(true);
  };

  const cancelEditing = () => {
    setIsEditingContent(false);
    setBlocks([]);
  };

  const saveContent = async () => {
    if (!note) return;
    setIsSaving(true);
    try {
      await updateNote.mutateAsync({
        id: noteId,
        data: {
          title: note.title,
          section: note.section,
          chapterTitle: note.chapterTitle ?? undefined,
          imageUrl: note.imageUrl ?? undefined,
          content: serializeBlocks(blocks),
          sortOrder: note.sortOrder,
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetNoteQueryKey(noteId) });
      setIsEditingContent(false);
      setBlocks([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Loading masterclass...</div>;
  if (!note) return <div className="text-center py-20 font-serif italic text-muted-foreground">Entry not found.</div>;

  return (
    <article className="animate-in fade-in duration-700 max-w-4xl mx-auto">
      <header className="mb-8 relative pr-24">
        <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-primary mb-3">
          {note.createdAt ? format(new Date(note.createdAt), "MMMM d, yyyy") : "Timeless"}
        </div>
        <h1 className="font-serif font-bold text-4xl md:text-5xl text-foreground leading-tight mb-4">
          {note.title}
        </h1>
        {note.chapterTitle && (
          <h2 className="font-sans text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
            {note.chapterTitle}
          </h2>
        )}
        {isEditing && (
          <div className="absolute top-0 right-0 flex gap-2">
            <button
              onClick={() => setIsEditInfoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/40 bg-card transition-all rounded-sm shadow-sm"
            >
              <Edit3 className="w-3 h-3" /> Edit Info
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

      <section>
        {isEditing && !isEditingContent && (
          <div className="flex justify-end mb-6">
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 text-[0.65rem] font-sans uppercase tracking-widest text-primary hover:opacity-70 transition-opacity border border-primary/30 px-3 py-1.5 rounded-sm hover:bg-primary/5"
            >
              <Edit3 className="w-3 h-3" /> Edit Content
            </button>
          </div>
        )}
        {isEditing && isEditingContent && (
          <div className="flex justify-end gap-2 mb-6">
            <button
              onClick={cancelEditing}
              className="flex items-center gap-1.5 text-[0.65rem] font-sans uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border border-border/50 px-3 py-1.5 rounded-sm"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={saveContent}
              disabled={isSaving}
              className="flex items-center gap-1.5 text-[0.65rem] font-sans uppercase tracking-widest text-primary-foreground bg-primary hover:bg-primary/90 transition-colors px-3 py-1.5 rounded-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save
            </button>
          </div>
        )}
        {isEditingContent
          ? <ArticleEditor blocks={blocks} onChange={setBlocks} mode="content" />
          : <ArticleRenderer content={note.content} />
        }
      </section>

      <Modal isOpen={isEditInfoOpen} onClose={() => setIsEditInfoOpen(false)} title="Edit Masterclass Info">
        <NoteForm initialData={note} onSuccess={() => setIsEditInfoOpen(false)} />
      </Modal>
    </article>
  );
}
