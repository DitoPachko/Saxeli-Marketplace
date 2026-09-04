import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MarketplaceChrome } from '@/components/MarketplaceChrome';
import Auth from '@/pages/Auth';
import Home from '@/pages/Home';
import ItemDetail from '@/pages/ItemDetail';
import Profile from '@/pages/Profile';
import Sell from '@/pages/Sell';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/item/:id" component={ItemDetail} />
        <Route path="/sell" component={Sell} />
        <Route path="/profile" component={Profile} />
        <Route path="/login">{() => <Auth mode="login" />}</Route>
        <Route path="/register">{() => <Auth mode="register" />}</Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
           <MarketplaceChrome>
             <Router />
           </MarketplaceChrome>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
