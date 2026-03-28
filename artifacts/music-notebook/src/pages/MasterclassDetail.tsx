import { useRoute } from "wouter";
import { useGetNote } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function MasterclassDetailPage() {
  const [, params] = useRoute("/masterclasses/:id");
  const noteId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: note, isLoading } = useGetNote(noteId);

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Loading masterclass...</div>;
  if (!note) return <div className="text-center py-20 font-serif italic text-muted-foreground">Entry not found.</div>;

  return (
    <article className="animate-in fade-in duration-700 max-w-3xl mx-auto">
      <header className="text-center mb-12">
        <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-primary mb-6">
          {note.createdAt ? format(new Date(note.createdAt), "MMMM d, yyyy") : "Timeless"}
        </div>
        <h1 className="font-serif font-bold text-5xl text-foreground leading-tight mb-4 text-balance mx-auto">
          {note.title}
        </h1>
        {note.chapterTitle && (
          <h2 className="font-sans text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {note.chapterTitle}
          </h2>
        )}
      </header>

      {note.imageUrl && (
        <figure className="mb-12 rounded-sm overflow-hidden notebook-border p-2 bg-card">
          <img src={note.imageUrl} alt={note.title} className="w-full h-auto rounded-sm object-cover max-h-[500px]" />
        </figure>
      )}

      <div className="editor-content max-w-2xl mx-auto">
        {note.content ? note.content.split("\n").map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        )) : (
          <p className="italic text-muted-foreground text-center py-10">This entry remains blank.</p>
        )}
      </div>

    </article>
  );
}
