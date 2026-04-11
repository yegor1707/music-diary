import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import {
  getListPiecesQueryOptions,
  getListComposersQueryOptions,
  getListNotesQueryOptions,
  getListBooksQueryOptions,
} from "@workspace/api-client-react";

// Lazy-load every page so each becomes its own JS chunk.
// The initial bundle only contains the home page code.
const HomePage           = lazy(() => import("@/pages/Home"));
const NotesPage          = lazy(() => import("@/pages/Notes"));
const NoteDetailPage     = lazy(() => import("@/pages/NoteDetail"));
const ComposersPage      = lazy(() => import("@/pages/Composers"));
const ComposerDetailPage = lazy(() => import("@/pages/ComposerDetail"));
const PiecesPage         = lazy(() => import("@/pages/Pieces"));
const PieceDetailPage    = lazy(() => import("@/pages/PieceDetail"));
const BooksPage          = lazy(() => import("@/pages/Books"));
const BookDetailPage     = lazy(() => import("@/pages/BookDetail"));
const MasterclassesPage  = lazy(() => import("@/pages/Masterclasses"));
const MasterclassDetailPage = lazy(() => import("@/pages/MasterclassDetail"));
const ChroniclePage      = lazy(() => import("@/pages/Chronicle"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10, // 10 min — fresh for longer
      gcTime:    1000 * 60 * 30, // 30 min — keep in memory after inactive
    }
  }
});

// While the user reads the home page, silently load all list data in the
// background so every tab opens instantly on first click.
function usePrefetchLists() {
  useEffect(() => {
    const timer = setTimeout(() => {
      queryClient.prefetchQuery(getListPiecesQueryOptions());
      queryClient.prefetchQuery(getListComposersQueryOptions());
      queryClient.prefetchQuery(getListNotesQueryOptions());
      queryClient.prefetchQuery(getListBooksQueryOptions());
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
}

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  usePrefetchLists();

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomePage} />

        <Route path="/pieces" component={PiecesPage} />
        <Route path="/pieces/:id" component={PieceDetailPage} />

        <Route path="/composers" component={ComposersPage} />
        <Route path="/composers/:id" component={ComposerDetailPage} />

        <Route path="/books" component={BooksPage} />
        <Route path="/books/:id" component={BookDetailPage} />

        <Route path="/masterclasses" component={MasterclassesPage} />
        <Route path="/masterclasses/:id" component={MasterclassDetailPage} />

        <Route path="/notes" component={NotesPage} />
        <Route path="/notes/:id" component={NoteDetailPage} />

        <Route path="/chronicle" component={ChroniclePage} />

        <Route>
          <div className="text-center py-32 font-serif text-2xl italic text-muted-foreground">
            Page not found in manuscript.
          </div>
        </Route>
      </Switch>
    </Suspense>
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
