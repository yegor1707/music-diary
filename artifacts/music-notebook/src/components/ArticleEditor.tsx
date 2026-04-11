import { useState, useRef } from "react";
import { useUploadImage } from "@workspace/api-client-react";
import { 
  Plus, Trash2, Image as ImageIcon, FileText, Quote, Type, 
  Heading2, Music2, ChevronUp, ChevronDown, Loader2, Clock, Youtube,
  LayoutTemplate, List, Bold
} from "lucide-react";

export type ImageSize = "small" | "medium" | "large" | "full";

export type Block =
  | { id: string; type: "text"; content: string }
  | { id: string; type: "heading"; content: string }
  | { id: string; type: "subheading"; content: string }
  | { id: string; type: "image"; url: string; caption: string; size?: ImageSize; float?: "left" | "right" }
  | { id: string; type: "score"; url: string; caption: string; size?: ImageSize; float?: "left" | "right" }
  | { id: string; type: "pdf"; url: string; title: string }
  | { id: string; type: "quote"; content: string }
  | { id: string; type: "timestamp"; time: string; label: string }
  | { id: string; type: "video"; url: string; caption: string }
  | { id: string; type: "image-text"; imageUrl: string; caption: string; text: string; imagePosition: "left" | "right"; size: ImageSize }
  | { id: string; type: "list"; items: string[] };

export type EditorMode = "piece" | "content" | "notes";

function genId() {
  return Math.random().toString(36).slice(2);
}

export function parseBlocks(raw: string | null | undefined): Block[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    if (raw.trim()) {
      return [{ id: genId(), type: "text", content: raw }];
    }
  }
  return [];
}

export function serializeBlocks(blocks: Block[]): string {
  return JSON.stringify(blocks);
}

const BLOCK_LABELS: Record<Block["type"], string> = {
  text: "Paragraph",
  heading: "Heading",
  subheading: "Sub-heading",
  image: "Image",
  score: "Score Fragment",
  pdf: "PDF Document",
  quote: "Musical Quote",
  timestamp: "Timestamp",
  video: "Video",
  "image-text": "Image + Text",
  list: "Bullet List",
};

const BLOCK_ICONS: Record<Block["type"], React.ReactNode> = {
  text: <Type className="w-3.5 h-3.5" />,
  heading: <Heading2 className="w-3.5 h-3.5" />,
  subheading: <Heading2 className="w-3 h-3" />,
  image: <ImageIcon className="w-3.5 h-3.5" />,
  score: <Music2 className="w-3.5 h-3.5" />,
  pdf: <FileText className="w-3.5 h-3.5" />,
  quote: <Quote className="w-3.5 h-3.5" />,
  timestamp: <Clock className="w-3.5 h-3.5" />,
  video: <Youtube className="w-3.5 h-3.5" />,
  "image-text": <LayoutTemplate className="w-3.5 h-3.5" />,
  list: <List className="w-3.5 h-3.5" />,
};

function getBlockTypes(mode: EditorMode): Block["type"][] {
  const base: Block["type"][] = ["text", "heading", "subheading", "list", "image", "image-text", "score", "pdf", "quote"];
  if (mode === "piece") return [...base, "timestamp"];
  if (mode === "content") return [...base, "video"];
  if (mode === "notes") return ["text", "heading", "list", "image", "image-text", "quote"];
  return base;
}

function FileUploadButton({ onUpload, accept = "image/*" }: { onUpload: (url: string) => void; accept?: string }) {
  const upload = useUploadImage();
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await upload.mutateAsync({ data: { file } });
      onUpload(res.url);
    } catch { /* noop */ }
    if (ref.current) ref.current.value = "";
  };

  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-sans text-primary hover:opacity-80 transition-opacity">
      {upload.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
      <span>{upload.isPending ? "Uploading..." : "Upload file"}</span>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleFile} disabled={upload.isPending} />
    </label>
  );
}

const SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
  { value: "small", label: "Small (25%)" },
  { value: "medium", label: "Medium (50%)" },
  { value: "large", label: "Large (75%)" },
  { value: "full", label: "Full width" },
];

const IMAGE_TEXT_SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
  { value: "small", label: "Image 25% / Text 75%" },
  { value: "medium", label: "Image 50% / Text 50%" },
  { value: "large", label: "Image 75% / Text 25%" },
];

const textareaClass = "w-full bg-white border border-border/40 p-3 rounded-sm text-gray-900 font-serif text-base leading-relaxed placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors resize-y";
const inputClass = "w-full bg-transparent border-b border-border/50 pb-1.5 text-gray-900 font-serif focus:outline-none focus:border-primary transition-colors placeholder:text-gray-400";

function applyBoldToTextarea(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const newValue = value.slice(0, start) + `**${selected || "жирный текст"}**` + value.slice(end);
  onChange(newValue);
  setTimeout(() => {
    textarea.focus();
    const newCursor = end + (selected ? 4 : 4 + "жирный текст".length);
    textarea.setSelectionRange(newCursor, newCursor);
  }, 0);
}

function TextToolbar({ textareaRef, value, onChange }: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 mb-2">
      <button
        type="button"
        title="Bold (выделите текст и нажмите)"
        onClick={() => {
          if (textareaRef.current) applyBoldToTextarea(textareaRef.current, value, onChange);
        }}
        className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold font-sans border border-border/50 rounded-sm hover:bg-muted transition-colors text-gray-700"
      >
        <Bold className="w-3 h-3" /> Bold
      </button>
      <span className="text-[0.6rem] text-gray-400 font-sans ml-1">Выделите текст и нажмите Bold</span>
    </div>
  );
}

function BlockEditor({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: {
  block: Block;
  onChange: (b: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="group relative bg-card notebook-border p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground">
          {BLOCK_ICONS[block.type]}
          {BLOCK_LABELS[block.type]}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="p-1 hover:text-primary text-muted-foreground disabled:opacity-20 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="p-1 hover:text-primary text-muted-foreground disabled:opacity-20 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={onDelete} className="p-1 hover:text-red-700 text-muted-foreground transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {block.type === "text" && (
        <div>
          <TextToolbar
            textareaRef={textareaRef}
            value={block.content}
            onChange={v => onChange({ ...block, content: v })}
          />
          <textarea
            ref={textareaRef}
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
            placeholder="Напишите абзац..."
            className={`${textareaClass} min-h-[100px]`}
          />
        </div>
      )}

      {(block.type === "heading" || block.type === "subheading") && (
        <input
          type="text"
          value={block.content}
          onChange={e => onChange({ ...block, content: e.target.value })}
          placeholder={block.type === "heading" ? "Заголовок раздела..." : "Подзаголовок..."}
          className={`${inputClass} ${block.type === "heading" ? "text-2xl font-bold" : "text-xl"}`}
        />
      )}

      {block.type === "quote" && (
        <textarea
          value={block.content}
          onChange={e => onChange({ ...block, content: e.target.value })}
          placeholder="Цитата или музыкальный фрагмент..."
          className="w-full bg-white border-l-2 border-primary/40 pl-4 text-gray-900 font-serif text-base italic leading-relaxed placeholder:text-gray-400 focus:outline-none min-h-[80px] resize-y p-2"
        />
      )}

      {block.type === "list" && (
        <div className="space-y-2">
          {block.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <input
                type="text"
                value={item}
                onChange={e => {
                  const items = [...block.items];
                  items[i] = e.target.value;
                  onChange({ ...block, items });
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const items = [...block.items];
                    items.splice(i + 1, 0, "");
                    onChange({ ...block, items });
                  }
                  if (e.key === "Backspace" && item === "" && block.items.length > 1) {
                    e.preventDefault();
                    const items = block.items.filter((_, j) => j !== i);
                    onChange({ ...block, items });
                  }
                }}
                placeholder="Пункт списка..."
                className="flex-1 bg-white border border-border/40 px-3 py-1.5 rounded-sm text-gray-900 font-serif text-base placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors"
              />
              {block.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                  className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
            className="flex items-center gap-1.5 text-xs font-sans text-primary hover:opacity-80 transition-opacity mt-1"
          >
            <Plus className="w-3 h-3" /> Добавить пункт
          </button>
          <p className="text-[0.6rem] font-sans text-gray-400 uppercase tracking-widest">Enter — новый пункт, Backspace на пустом — удалить</p>
        </div>
      )}

      {(block.type === "image" || block.type === "score") && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FileUploadButton onUpload={url => onChange({ ...block, url })} accept="image/*" />
            <span className="text-muted-foreground/40 text-xs">or</span>
            <input
              type="text"
              value={block.url}
              onChange={e => onChange({ ...block, url: e.target.value })}
              placeholder="Вставьте URL изображения..."
              className="flex-1 bg-transparent border-b border-border/50 pb-1 text-sm text-gray-900 font-serif focus:outline-none focus:border-primary transition-colors placeholder:text-gray-400"
            />
          </div>
          {block.url && (
            <img src={block.url} alt="" className="max-h-48 w-auto rounded-sm border border-border/30 object-contain" />
          )}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground">Size:</label>
              <select
                value={block.size || "full"}
                onChange={e => onChange({ ...block, size: e.target.value as ImageSize })}
                className="bg-card border border-border/40 text-foreground font-sans text-xs px-2 py-1 rounded-sm focus:outline-none focus:border-primary"
              >
                {SIZE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {(block.size || "full") !== "full" && (
              <div className="flex items-center gap-2">
                <label className="text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground">Side:</label>
                <select
                  value={block.float || "left"}
                  onChange={e => onChange({ ...block, float: e.target.value as "left" | "right" })}
                  className="bg-card border border-border/40 text-foreground font-sans text-xs px-2 py-1 rounded-sm focus:outline-none focus:border-primary"
                >
                  <option value="left">Left (text wraps right)</option>
                  <option value="right">Right (text wraps left)</option>
                </select>
              </div>
            )}
            <input
              type="text"
              value={block.caption}
              onChange={e => onChange({ ...block, caption: e.target.value })}
              placeholder="Подпись (необязательно)..."
              className="flex-1 bg-transparent border-b border-border/50 pb-1 text-sm text-gray-900 font-serif focus:outline-none focus:border-primary transition-colors placeholder:text-gray-400 min-w-[120px]"
            />
          </div>
        </div>
      )}

      {block.type === "image-text" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground">Layout:</label>
              <select
                value={block.size}
                onChange={e => onChange({ ...block, size: e.target.value as ImageSize })}
                className="bg-card border border-border/40 text-foreground font-sans text-xs px-2 py-1 rounded-sm focus:outline-none focus:border-primary"
              >
                {IMAGE_TEXT_SIZE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground">Image:</label>
              <select
                value={block.imagePosition}
                onChange={e => onChange({ ...block, imagePosition: e.target.value as "left" | "right" })}
                className="bg-card border border-border/40 text-foreground font-sans text-xs px-2 py-1 rounded-sm focus:outline-none focus:border-primary"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground">Image</p>
              <div className="flex items-center gap-2">
                <FileUploadButton onUpload={url => onChange({ ...block, imageUrl: url })} accept="image/*" />
                <span className="text-muted-foreground/40 text-xs">or</span>
              </div>
              <input
                type="text"
                value={block.imageUrl}
                onChange={e => onChange({ ...block, imageUrl: e.target.value })}
                placeholder="Вставьте URL изображения..."
                className="w-full bg-transparent border-b border-border/50 pb-1 text-sm text-gray-900 font-serif focus:outline-none focus:border-primary transition-colors placeholder:text-gray-400"
              />
              {block.imageUrl && (
                <img src={block.imageUrl} alt="" className="max-h-32 w-auto rounded-sm border border-border/30 object-contain mt-2" />
              )}
              <input
                type="text"
                value={block.caption}
                onChange={e => onChange({ ...block, caption: e.target.value })}
                placeholder="Подпись (необязательно)..."
                className="w-full bg-transparent border-b border-border/50 pb-1 text-xs text-muted-foreground font-serif focus:outline-none focus:border-primary transition-colors placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[0.6rem] font-sans uppercase tracking-widest text-muted-foreground">Text</p>
              <textarea
                value={block.text}
                onChange={e => onChange({ ...block, text: e.target.value })}
                placeholder="Напишите текст рядом с изображением..."
                className={`${textareaClass} min-h-[120px] text-sm`}
              />
            </div>
          </div>
        </div>
      )}

      {block.type === "pdf" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FileUploadButton onUpload={url => onChange({ ...block, url })} accept=".pdf,application/pdf" />
            <span className="text-muted-foreground/40 text-xs">or</span>
            <input
              type="text"
              value={block.url}
              onChange={e => onChange({ ...block, url: e.target.value })}
              placeholder="Вставьте URL PDF..."
              className="flex-1 bg-transparent border-b border-border/50 pb-1 text-sm text-gray-900 font-serif focus:outline-none focus:border-primary transition-colors placeholder:text-gray-400"
            />
          </div>
          <input
            type="text"
            value={block.title}
            onChange={e => onChange({ ...block, title: e.target.value })}
            placeholder="Название документа..."
            className={`${inputClass} text-sm`}
          />
        </div>
      )}

      {block.type === "timestamp" && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary/60 flex-shrink-0" />
              <input
                type="text"
                value={block.time}
                onChange={e => onChange({ ...block, time: e.target.value })}
                placeholder="1:23 or 12:34"
                className="w-24 bg-transparent border-b border-border/50 pb-1 text-gray-900 font-serif text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-gray-400"
              />
            </div>
            <input
              type="text"
              value={block.label}
              onChange={e => onChange({ ...block, label: e.target.value })}
              placeholder="Описание (напр. Начало разработки)"
              className="flex-1 bg-transparent border-b border-border/50 pb-1 text-gray-900 font-serif text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-gray-400"
            />
          </div>
          <p className="text-[0.6rem] font-sans text-muted-foreground/60 uppercase tracking-widest">
            Нажатие на метку перемотает запись до этого момента.
          </p>
        </div>
      )}

      {block.type === "video" && (
        <div className="space-y-3">
          <input
            type="text"
            value={block.url}
            onChange={e => onChange({ ...block, url: e.target.value })}
            placeholder="YouTube URL (https://www.youtube.com/watch?v=...)"
            className="w-full bg-transparent border-b border-border/50 pb-1.5 text-gray-900 font-serif text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-gray-400"
          />
          <input
            type="text"
            value={block.caption}
            onChange={e => onChange({ ...block, caption: e.target.value })}
            placeholder="Подпись (необязательно)..."
            className={`${inputClass} text-sm text-muted-foreground`}
          />
        </div>
      )}
    </div>
  );
}

function createBlock(type: Block["type"]): Block {
  const id = genId();
  switch (type) {
    case "text": return { id, type: "text", content: "" };
    case "heading": return { id, type: "heading", content: "" };
    case "subheading": return { id, type: "subheading", content: "" };
    case "image": return { id, type: "image", url: "", caption: "", size: "full" };
    case "score": return { id, type: "score", url: "", caption: "", size: "full" };
    case "pdf": return { id, type: "pdf", url: "", title: "" };
    case "quote": return { id, type: "quote", content: "" };
    case "timestamp": return { id, type: "timestamp", time: "", label: "" };
    case "video": return { id, type: "video", url: "", caption: "" };
    case "image-text": return { id, type: "image-text", imageUrl: "", caption: "", text: "", imagePosition: "left", size: "medium" };
    case "list": return { id, type: "list", items: [""] };
  }
}

export function ArticleEditor({ blocks, onChange, mode = "content" }: { 
  blocks: Block[]; 
  onChange: (b: Block[]) => void;
  mode?: EditorMode;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const addBlockTypes = getBlockTypes(mode);

  const updateBlock = (idx: number, b: Block) => {
    const next = [...blocks];
    next[idx] = b;
    onChange(next);
  };

  const deleteBlock = (idx: number) => {
    onChange(blocks.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const next = [...blocks];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const addBlock = (type: Block["type"]) => {
    onChange([...blocks, createBlock(type)]);
    setShowMenu(false);
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => (
        <BlockEditor
          key={block.id}
          block={block}
          onChange={b => updateBlock(idx, b)}
          onDelete={() => deleteBlock(idx)}
          onMoveUp={() => moveBlock(idx, -1)}
          onMoveDown={() => moveBlock(idx, 1)}
          isFirst={idx === 0}
          isLast={idx === blocks.length - 1}
        />
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors text-xs font-sans uppercase tracking-widest rounded-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add Block
        </button>
        {showMenu && (
          <div className="absolute bottom-full mb-1 left-0 right-0 bg-card notebook-border rounded-sm shadow-xl z-20 p-2 grid grid-cols-2 gap-1">
            {addBlockTypes.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-sans text-foreground hover:bg-primary/5 hover:text-primary transition-colors rounded-sm text-left"
              >
                {BLOCK_ICONS[type]}
                {BLOCK_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
