import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListBooks } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { BookForm } from "@/components/Forms";
import { Plus, Book as BookIcon, Search } from "lucide-react";

export default function BooksPage() {
  const { data: books, isLoading } = useListBooks();
  const { isEditing } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!books) return [];
    if (!search.trim()) return books;
    return books.filter(b =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.author || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [books, search]);

  if (isLoading) return <div className="text-center py-20 font-serif italic text-muted-foreground">Dusting off covers...</div>;

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif italic text-3xl text-foreground">Methodical Books</h2>
        {isEditing && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Add Book
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-8 p-4 bg-card notebook-border">
        <Search className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full bg-transparent text-foreground font-serif text-sm placeholder:text-muted-foreground/50 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-muted-foreground/50 hover:text-foreground transition-colors text-xs">✕</button>
        )}
      </div>

      {!filtered || filtered.length === 0 ? (
        <div className="text-center py-20 italic font-serif text-muted-foreground">
          {search ? "No books match your search." : "No books in the library."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`} className="group block">
              <article className="h-full flex flex-col">
                <div className="aspect-[3/4] w-full mb-4 bg-card notebook-border shadow-md overflow-hidden relative">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-muted/20 border-8 border-card">
                      <BookIcon className="w-12 h-12 text-primary/20 mb-4" />
                      <h3 className="font-serif font-bold text-xl text-primary/40">{book.title}</h3>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="text-white font-sans text-xs uppercase tracking-widest">Read Notes →</span>
                  </div>
                </div>
                <h3 className="font-serif font-bold text-xl text-foreground leading-tight mb-1 group-hover:text-primary transition-colors">
                  {book.title}
                </h3>
                <p className="font-sans text-xs tracking-widest text-muted-foreground uppercase">
                  {book.author} {book.year ? `· ${book.year}` : ''}
                </p>
              </article>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Methodical Book">
        <BookForm onSuccess={() => setIsAddModalOpen(false)} />
      </Modal>
    </div>
  );
}
