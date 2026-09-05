import { type ReactNode, useEffect, useRef } from "react";
import {
  ClerkProvider,
  Show,
  useClerk,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MarketplaceChrome } from "@/components/MarketplaceChrome";
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";
import ItemDetail from "@/pages/ItemDetail";
import EditItem from "@/pages/EditItem";
import Profile from "@/pages/Profile";
import SellerProfile from "@/pages/SellerProfile";
import Sell from "@/pages/Sell";
import NotFound from "@/pages/not-found";
import {
  Redirect,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from "wouter";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top" as const,
  },
  variables: {
    colorPrimary: "#f5a900",
    colorForeground: "#302438",
    colorMutedForeground: "#756b78",
    colorDanger: "#b42318",
    colorBackground: "#fffdf9",
    colorInput: "#f7f2eb",
    colorInputForeground: "#302438",
    colorNeutral: "#d9d0c8",
    fontFamily: '"Noto Sans Georgian", "DM Sans", sans-serif',
    borderRadius: "0.9rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-[hsl(var(--card))] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[hsl(var(--border))]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[hsl(var(--foreground))] font-display",
    headerSubtitle: "text-[hsl(var(--muted-foreground))]",
    socialButtonsBlockButtonText: "text-[hsl(var(--foreground))]",
    formFieldLabel: "text-[hsl(var(--foreground))]",
    footerActionLink: "text-[hsl(var(--foreground))] font-semibold",
    footerActionText: "text-[hsl(var(--muted-foreground))]",
    dividerText: "text-[hsl(var(--muted-foreground))]",
    formButtonPrimary: "btn-primary",
    formFieldInput:
      "bg-[hsl(var(--input))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    return addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        previousUserId.current !== undefined &&
        previousUserId.current !== userId
      ) {
        client.clear();
      }
      previousUserId.current = userId;
    });
  }, [addListener, client]);

  return null;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function HomeRoute() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/marketplace" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomeRoute} />
        <Route path="/login">
          <Redirect to="/sign-in" />
        </Route>
        <Route path="/register">
          <Redirect to="/sign-up" />
        </Route>
        <Route path="/sign-in/*?">
          <Auth mode="login" basePath={basePath} />
        </Route>
        <Route path="/sign-up/*?">
          <Auth mode="register" basePath={basePath} />
        </Route>
        <Route path="/marketplace">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>
        <Route path="/item/:id">
          <ProtectedRoute>
            <ItemDetail />
          </ProtectedRoute>
        </Route>
        <Route path="/sell">
          <ProtectedRoute>
            <Sell />
          </ProtectedRoute>
        </Route>
        <Route path="/seller/:id">
          <SellerProfile />
        </Route>
        <Route path="/edit/:id">
          <ProtectedRoute>
            <EditItem />
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "კეთილი დაბრუნება",
            subtitle: "შედი Saxeli-ის ანგარიშში",
          },
        },
        signUp: {
          start: {
            title: "შექმენი ანგარიში",
            subtitle: "დაიწყე ყიდვა და გაყიდვა უსაფრთხოდ",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <MarketplaceChrome>
            <Router />
          </MarketplaceChrome>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}