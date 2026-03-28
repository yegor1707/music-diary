import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";

import HomePage from "@/pages/Home";
import NotesPage from "@/pages/Notes";
import NoteDetailPage from "@/pages/NoteDetail";
import ComposersPage from "@/pages/Composers";
import ComposerDetailPage from "@/pages/ComposerDetail";
import PiecesPage from "@/pages/Pieces";
import PieceDetailPage from "@/pages/PieceDetail";
import BooksPage from "@/pages/Books";
import BookDetailPage from "@/pages/BookDetail";
import MasterclassesPage from "@/pages/Masterclasses";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={PiecesPage} />

      <Route path="/pieces" component={PiecesPage} />
      <Route path="/pieces/:id" component={PieceDetailPage} />

      <Route path="/composers" component={ComposersPage} />
      <Route path="/composers/:id" component={ComposerDetailPage} />

      <Route path="/books" component={BooksPage} />
      <Route path="/books/:id" component={BookDetailPage} />

      <Route path="/masterclasses" component={MasterclassesPage} />
      <Route path="/masterclasses/:id" component={NoteDetailPage} />

      <Route path="/notes" component={NotesPage} />
      <Route path="/notes/:id" component={NoteDetailPage} />

      <Route>
        <div className="text-center py-32 font-serif text-2xl italic text-muted-foreground">
          Page not found in manuscript.
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
