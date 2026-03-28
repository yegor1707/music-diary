import { useState } from "react";
import { useRoute } from "wouter";
import { useGetBook, useDeleteBook, getListBooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { BookForm } from "@/components/Forms";
import { Edit3, Trash2 } from "lucide-react";

export default function BookDetailPage() {
  const [, params] = useRoute("/books/:id");
  const bookId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: book, isLoading } = useGetBook(bookId);
  const deleteBook = useDeleteBook();
  const queryClient = useQueryClient();
  const { isEditing } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to remove this book?")) {
      await deleteBook.mutateAsync({ id: bookId });
      queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      window.history.back();
    }
  };

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Opening book...</div>;
  if (!book) return <div className="text-center py-20 font-serif italic text-muted-foreground">Book not found.</div>;

  return (
    <article className="animate-in fade-in duration-700 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-10 mb-16 relative">
        <div className="w-full md:w-1/3 flex-shrink-0">
          <div className="aspect-[3/4] w-full bg-card notebook-border shadow-xl overflow-hidden rounded-r-md rounded-l-sm border-l-8 border-l-primary/80">
             {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6 text-center bg-muted/20">
                  <h3 className="font-serif font-bold text-2xl text-primary/40">{book.title}</h3>
                </div>
              )}
          </div>
        </div>

        <div className="flex-1 pt-4 md:pt-10">
          <div className="text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-primary mb-3">
            {book.author || "Unknown Author"} {book.year ? `· ${book.year}` : ''}
          </div>
          <h1 className="font-serif font-bold text-4xl md:text-5xl text-foreground leading-tight mb-6">
            {book.title}
          </h1>
          
          {book.synopsis && (
            <div className="pl-4 border-l-2 border-primary/30">
              <p className="font-serif italic text-lg text-muted-foreground leading-relaxed">
                {book.synopsis}
              </p>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="absolute top-0 right-0 flex gap-3">
            <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-muted-foreground hover:text-primary transition-colors bg-card notebook-border rounded-full shadow-sm"><Edit3 className="w-4 h-4" /></button>
            <button onClick={handleDelete} className="p-2 text-muted-foreground hover:text-red-700 transition-colors bg-card notebook-border rounded-full shadow-sm"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      <div className="editor-content bg-card notebook-border p-8 md:p-12 relative max-w-3xl mx-auto">
        <div className="absolute -top-4 left-8 bg-background px-4 font-sans font-semibold text-xs tracking-widest text-muted-foreground uppercase">
          Reading Notes
        </div>
        {book.content ? book.content.split('\n').map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        )) : (
          <p className="italic text-muted-foreground text-center py-10">No reading notes captured yet.</p>
        )}
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Book Details">
        <BookForm initialData={book} onSuccess={() => setIsEditModalOpen(false)} />
      </Modal>
    </article>
  );
}
