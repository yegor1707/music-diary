import { Link, useLocation } from "wouter";
import { Lock, Unlock, PenSquare, Music, Users, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Modal } from "./ui/modal";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Конспекты", icon: PenSquare },
  { href: "/pieces", label: "Музыка", icon: Music },
  { href: "/composers", label: "Композиторы", icon: Users },
  { href: "/books", label: "Книги", icon: BookOpen },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { isEditing, login, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await login(password);
    if (success) {
      setIsAuthModalOpen(false);
      setPassword("");
    } else {
      setError("Incorrect password.");
    }
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* Decorative corners */}
      <img src={`${import.meta.env.BASE_URL}images/ornament-1.png`} alt="" className="fixed top-0 left-0 w-32 opacity-20 pointer-events-none mix-blend-multiply" />
      <img src={`${import.meta.env.BASE_URL}images/ornament-1.png`} alt="" className="fixed top-0 right-0 w-32 opacity-20 pointer-events-none mix-blend-multiply scale-x-[-1]" />

      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-0">
          <div className="flex flex-col items-center mb-6">
            <Link href="/" className="group cursor-pointer">
              <h1 className="font-serif italic font-bold text-4xl text-foreground text-center tracking-tight group-hover:text-primary transition-colors">
                Музыкальный Дневник
              </h1>
            </Link>
          </div>
          
          <nav className="flex overflow-x-auto scrollbar-none gap-2 sm:justify-center">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex-shrink-0">
                  <span className={cn(
                    "flex items-center gap-2 px-5 py-3 text-xs font-sans font-medium tracking-[0.15em] uppercase border-b-2 transition-all whitespace-nowrap",
                    isActive 
                      ? "border-primary text-foreground" 
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}>
                    <Icon className="w-3.5 h-3.5 mb-0.5" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10 pb-32">
        {children}
      </main>

      {/* Floating Auth Toggle */}
      <button
        onClick={() => isEditing ? logout() : setIsAuthModalOpen(true)}
        className="fixed bottom-8 right-8 w-12 h-12 bg-card notebook-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all z-50 group shadow-lg"
        title={isEditing ? "Lock Editor" : "Unlock Editor"}
      >
        {isEditing ? <Unlock className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />}
      </button>

      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Unlock Editor">
        <form onSubmit={handleLogin} className="space-y-6">
          <p className="text-muted-foreground font-serif text-lg italic">Enter the passphrase to access editing capabilities.</p>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passphrase..."
              className="w-full bg-transparent border-b border-border/60 pb-2 text-foreground font-serif text-xl placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors text-center tracking-widest"
              autoFocus
            />
            {error && <p className="text-red-700 text-sm mt-2 text-center">{error}</p>}
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground font-sans font-semibold uppercase tracking-[0.15em] text-xs px-6 py-3 rounded-sm hover:bg-primary/90 transition-all">
            Unlock
          </button>
        </form>
      </Modal>
    </div>
  );
}
