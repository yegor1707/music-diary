import { Link, useLocation } from "wouter";
import { Lock, Unlock, ScrollText, Music, Users, BookOpen, GraduationCap, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef } from "react";
import { Modal } from "./ui/modal";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Chronicle", icon: ScrollText },
  { href: "/pieces", label: "Music", icon: Music },
  { href: "/composers", label: "Composers", icon: Users },
  { href: "/books", label: "Methodical Books", icon: BookOpen },
  { href: "/masterclasses", label: "Masterclasses", icon: GraduationCap },
  { href: "/notes", label: "Notes", icon: FileText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { isEditing, login, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    const code = pin.join("");
    if (code.length < 4) {
      setError("Enter all 4 digits.");
      return;
    }
    setError("");
    const success = await login(code);
    if (success) {
      setIsAuthModalOpen(false);
      setPin(["", "", "", ""]);
    } else {
      setError("Incorrect PIN.");
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  };

  const openModal = () => {
    setPin(["", "", "", ""]);
    setError("");
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary">
      <img src={`${import.meta.env.BASE_URL}images/ornament-1.png`} alt="" className="fixed top-0 left-0 w-32 opacity-20 pointer-events-none mix-blend-multiply" />
      <img src={`${import.meta.env.BASE_URL}images/ornament-1.png`} alt="" className="fixed top-0 right-0 w-32 opacity-20 pointer-events-none mix-blend-multiply scale-x-[-1]" />

      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-0">
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1" />
            <Link href="/" className="group cursor-pointer text-center flex-shrink-0">
              <h1 className="font-serif italic font-bold text-3xl text-foreground tracking-tight group-hover:text-primary transition-colors leading-tight">
                Leshukov Music Diary
              </h1>
              <p className="font-sans text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground mt-0.5">
                A Thesaurus of Musical Knowledge
              </p>
            </Link>
            <div className="flex-1 flex justify-end items-start pt-1">
              <button
                onClick={() => isEditing ? logout() : openModal()}
                className="flex items-center gap-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors group"
                title={isEditing ? "Lock Editor" : "Unlock Editor"}
              >
                {isEditing
                  ? <Unlock className="w-3.5 h-3.5" />
                  : <Lock className="w-3.5 h-3.5" />
                }
                <span className="text-[0.6rem] font-sans uppercase tracking-widest hidden sm:inline">
                  {isEditing ? "Editing" : "Edit"}
                </span>
              </button>
            </div>
          </div>

          <nav className="flex overflow-x-auto scrollbar-none gap-1 sm:justify-center">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex-shrink-0">
                  <span className={cn(
                    "flex items-center gap-1.5 px-4 py-3 text-[0.65rem] font-sans font-medium tracking-[0.12em] uppercase border-b-2 transition-all whitespace-nowrap",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}>
                    <Icon className="w-3 h-3 mb-0.5" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10 pb-32">
        {children}
      </main>

      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Unlock Editor">
        <div className="space-y-6">
          <p className="text-muted-foreground font-serif text-base italic text-center">Enter your 4-digit PIN to access editing.</p>
          <div className="flex justify-center gap-3">
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(i, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(i, e)}
                autoFocus={i === 0}
                className="w-12 h-14 bg-transparent border-b-2 border-border text-foreground font-serif text-2xl text-center focus:outline-none focus:border-primary transition-colors tracking-widest"
              />
            ))}
          </div>
          {error && <p className="text-red-700 text-sm text-center">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-primary text-primary-foreground font-sans font-semibold uppercase tracking-[0.15em] text-xs px-6 py-3 rounded-sm hover:bg-primary/90 transition-all"
          >
            Unlock
          </button>
        </div>
      </Modal>
    </div>
  );
}
