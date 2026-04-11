import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateNote, useUpdateNote, getListNotesQueryKey, getGetNoteQueryKey,
  useCreatePiece, useUpdatePiece, getListPiecesQueryKey, getGetPieceQueryKey,
  useCreateComposer, useUpdateComposer, getListComposersQueryKey, getGetComposerQueryKey,
  useCreateBook, useUpdateBook, getListBooksQueryKey, getGetBookQueryKey,
  useUploadImage, useListComposers
} from "@workspace/api-client-react";
import type { Note, Piece, Composer, Book } from "@workspace/api-client-react";
import { Loader2, Image as ImageIcon } from "lucide-react";

// --- Shared Form UI Components ---
function FormGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className="w-full bg-transparent border-b border-border/60 pb-2 text-foreground font-serif text-lg placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
      {...props} 
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea 
      className="w-full bg-transparent border border-border/60 p-3 rounded-sm text-foreground font-serif text-lg leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors min-h-[200px] resize-y"
      {...props} 
    />
  );
}

function Button({ isLoading, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) {
  return (
    <button 
      className="bg-primary text-primary-foreground font-sans font-semibold uppercase tracking-[0.15em] text-xs px-6 py-3 rounded-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

function ImageUpload({ value, onChange }: { value: string, onChange: (url: string) => void }) {
  const upload = useUploadImage();
  
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await upload.mutateAsync({ data: { file } });
      onChange(res.url);
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {value && <img src={value} alt="Preview" className="w-16 h-16 object-cover rounded-sm border border-border" />}
      <label className="cursor-pointer flex items-center gap-2 text-sm font-sans font-medium text-primary hover:text-primary/80 transition-colors">
        <ImageIcon className="w-4 h-4" />
        <span>{upload.isPending ? "Uploading..." : value ? "Change Image" : "Upload Image"}</span>
        <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={upload.isPending} />
      </label>
      {value && (
        <button type="button" onClick={() => onChange("")} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
      )}
    </div>
  );
}

// --- Specific Forms ---

export function NoteForm({ initialData, onSuccess, defaultSection = "notes" }: { initialData?: Note, onSuccess: () => void, defaultSection?: string }) {
  const queryClient = useQueryClient();
  const create = useCreateNote();
  const update = useUpdateNote();
  
  const effectiveSection = initialData?.section || defaultSection;
  const isMasterclass = effectiveSection === "masterclasses";

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    section: effectiveSection,
    chapterTitle: initialData?.chapterTitle || "",
    content: initialData?.content || "",
    imageUrl: initialData?.imageUrl || "",
    sortOrder: initialData?.sortOrder || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initialData) {
        await update.mutateAsync({ id: initialData.id, data: formData });
        queryClient.invalidateQueries({ queryKey: getGetNoteQueryKey(initialData.id) });
      } else {
        await create.mutateAsync({ data: formData });
      }
      queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      onSuccess();
    } catch (err) { console.error(err); }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormGroup label="Заголовок">
        <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Название заметки" />
      </FormGroup>
      {!isMasterclass && (
        <FormGroup label="Текст заметки">
          <textarea
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value})}
            placeholder="Напишите заметку..."
            rows={6}
            className="w-full bg-background border border-border rounded-sm px-3 py-2 font-serif text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-y"
          />
        </FormGroup>
      )}
      {isMasterclass ? (
        <FormGroup label="YouTube Video URL">
          <Input
            value={formData.imageUrl}
            onChange={e => setFormData({...formData, imageUrl: e.target.value})}
            placeholder="https://www.youtube.com/watch?v=..."
            type="url"
          />
        </FormGroup>
      ) : (
        <FormGroup label="Фото (необязательно)">
          <ImageUpload value={formData.imageUrl} onChange={url => setFormData({...formData, imageUrl: url})} />
        </FormGroup>
      )}
      <div className="flex justify-end pt-4"><Button type="submit" isLoading={isPending}>Сохранить</Button></div>
    </form>
  );
}

export function PieceForm({ initialData, onSuccess }: { initialData?: Piece, onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const create = useCreatePiece();
  const update = useUpdatePiece();
  const { data: composers } = useListComposers();
  
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    composer: initialData?.composer || "",
    composerId: initialData?.composerId ?? null as number | null,
    year: initialData?.year || "",
    youtubeUrl: initialData?.youtubeUrl || "",
    sheetMusicUrl: initialData?.sheetMusicUrl || "",
    content: initialData?.content || "",
    tags: initialData?.tags.join(", ") || ""
  });

  const handleComposerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "") {
      setFormData({...formData, composerId: null, composer: ""});
    } else {
      const found = composers?.find(c => c.id === Number(val));
      setFormData({...formData, composerId: Number(val), composer: found?.name || ""});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean)
    };
    try {
      if (initialData) {
        await update.mutateAsync({ id: initialData.id, data });
        queryClient.invalidateQueries({ queryKey: getGetPieceQueryKey(initialData.id) });
      } else {
        await create.mutateAsync({ data });
      }
      queryClient.invalidateQueries({ queryKey: getListPiecesQueryKey() });
      onSuccess();
    } catch (err) { console.error(err); }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormGroup label="Title"><Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Ballade No. 1 in G minor" /></FormGroup>
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Linked Composer">
          <select
            value={formData.composerId ?? ""}
            onChange={handleComposerSelect}
            className="w-full bg-transparent border-b border-border/60 pb-2 text-foreground font-serif text-lg focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">— select or type below —</option>
            {composers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Composer (manual)"><Input value={formData.composer} onChange={e => setFormData({...formData, composer: e.target.value})} placeholder="e.g. Chopin" /></FormGroup>
      </div>
      <FormGroup label="Year"><Input value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="e.g. 1835" /></FormGroup>
      <div className="p-4 bg-background/50 border border-border/40 rounded-sm space-y-4">
        <p className="text-[0.6rem] font-sans uppercase tracking-[0.2em] text-muted-foreground font-semibold">Media & Sheet Music</p>
        <FormGroup label="YouTube Recording URL">
          <Input value={formData.youtubeUrl} onChange={e => setFormData({...formData, youtubeUrl: e.target.value})} placeholder="https://www.youtube.com/watch?v=..." />
        </FormGroup>
        <FormGroup label="Sheet Music PDF (URL or upload path)">
          <Input value={formData.sheetMusicUrl} onChange={e => setFormData({...formData, sheetMusicUrl: e.target.value})} placeholder="https://... or /api/uploads/..." />
        </FormGroup>
      </div>
      <FormGroup label="Style (comma separated)"><Input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="e.g. Romantic, Étude, Nocturne" /></FormGroup>
      <div className="flex justify-end pt-2"><Button type="submit" isLoading={isPending}>Save Piece</Button></div>
    </form>
  );
}

export function ComposerForm({ initialData, onSuccess }: { initialData?: Composer, onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const create = useCreateComposer();
  const update = useUpdateComposer();
  
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    born: initialData?.born || "",
    died: initialData?.died || "",
    nationality: initialData?.nationality || "",
    imageUrl: initialData?.imageUrl || "",
    biography: initialData?.biography || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initialData) {
        await update.mutateAsync({ id: initialData.id, data: formData });
        queryClient.invalidateQueries({ queryKey: getGetComposerQueryKey(initialData.id) });
      } else {
        await create.mutateAsync({ data: formData });
      }
      queryClient.invalidateQueries({ queryKey: getListComposersQueryKey() });
      onSuccess();
    } catch (err) { console.error(err); }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormGroup label="Name"><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Frédéric Chopin" /></FormGroup>
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Born"><Input value={formData.born} onChange={e => setFormData({...formData, born: e.target.value})} placeholder="e.g. 1810" /></FormGroup>
        <FormGroup label="Died"><Input value={formData.died} onChange={e => setFormData({...formData, died: e.target.value})} placeholder="e.g. 1849" /></FormGroup>
      </div>
      <FormGroup label="Portrait"><ImageUpload value={formData.imageUrl} onChange={url => setFormData({...formData, imageUrl: url})} /></FormGroup>
      <div className="flex justify-end pt-4"><Button type="submit" isLoading={isPending}>Save Composer</Button></div>
    </form>
  );
}

export function BookForm({ initialData, onSuccess }: { initialData?: Book, onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const create = useCreateBook();
  const update = useUpdateBook();
  
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    author: initialData?.author || "",
    year: initialData?.year || "",
    coverUrl: initialData?.coverUrl || "",
    synopsis: initialData?.synopsis || "",
    content: initialData?.content || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initialData) {
        await update.mutateAsync({ id: initialData.id, data: formData });
        queryClient.invalidateQueries({ queryKey: getGetBookQueryKey(initialData.id) });
      } else {
        await create.mutateAsync({ data: formData });
      }
      queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      onSuccess();
    } catch (err) { console.error(err); }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormGroup label="Title"><Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Book title" /></FormGroup>
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Author"><Input value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} placeholder="Author name" /></FormGroup>
        <FormGroup label="Year"><Input value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="Publication year" /></FormGroup>
      </div>
      <FormGroup label="Cover Image"><ImageUpload value={formData.coverUrl} onChange={url => setFormData({...formData, coverUrl: url})} /></FormGroup>
      <FormGroup label="Synopsis"><Input value={formData.synopsis} onChange={e => setFormData({...formData, synopsis: e.target.value})} placeholder="Brief description" /></FormGroup>
      <div className="flex justify-end pt-4"><Button type="submit" isLoading={isPending}>Save Book</Button></div>
    </form>
  );
}
