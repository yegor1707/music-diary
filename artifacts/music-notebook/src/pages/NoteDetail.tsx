import { useState } from "react";
import { useRoute } from "wouter";
import { useGetNote, useUpdateNote, useDeleteNote, getListNotesQueryKey, getGetNoteQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { NoteForm } from "@/components/Forms";
import { Edit3, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function NoteDetailPage() {
  const [, params] = useRoute("/notes/:id");
  const noteId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: note, isLoading } = useGetNote(noteId);
  const deleteNote = useDeleteNote();
  const queryClient = useQueryClient();
  const { isEditing } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteNote.mutateAsync({ id: noteId });
      queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      window.history.back();
    }
  };

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Reading manuscript...</div>;
  if (!note) return <div className="text-center py-20 font-serif italic text-muted-foreground">Entry not found.</div>;

  return (
    <article className="animate-in fade-in duration-700 max-w-2xl mx-auto">
      <header className="text-center mb-10 relative">
        <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-primary mb-5">
          {note.createdAt ? format(new Date(note.createdAt), 'MMMM d, yyyy') : 'Timeless'}
        </div>
        <h1 className="font-serif font-bold text-4xl md:text-5xl text-foreground leading-tight mb-4 text-balance">
          {note.title}
        </h1>
        {note.chapterTitle && (
          <h2 className="font-sans text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {note.chapterTitle}
          </h2>
        )}
        
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
      </header>

      {note.imageUrl && (
        <figure className="mb-10 rounded-sm overflow-hidden notebook-border p-2 bg-card">
          <img src={note.imageUrl} alt={note.title} className="w-full h-auto rounded-sm object-cover max-h-[500px]" />
        </figure>
      )}

      <div className="space-y-4">
        {note.content ? note.content.split('\n').filter(Boolean).map((paragraph, idx) => (
          <p key={idx} className="font-serif text-foreground/90 text-lg leading-[1.85]">
            {paragraph}
          </p>
        )) : (
          <p className="font-serif italic text-muted-foreground text-center py-10">This entry remains blank.</p>
        )}
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Note">
        <NoteForm initialData={note} onSuccess={() => setIsEditModalOpen(false)} />
      </Modal>
    </article>
  );
}
