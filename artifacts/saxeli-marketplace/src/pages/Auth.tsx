import { SignIn, SignUp } from "@clerk/react";
import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function Auth({
  mode,
  basePath,
}: {
  mode: "login" | "register";
  basePath: string;
}) {
  const isLogin = mode === "login";
  
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const returnTo = searchParams.get('returnTo') || `${basePath}/`;
  
  // We attach the returnTo param so the other auth page can pick it up if they switch between sign-in and sign-up
  const signUpUrl = `${basePath}/sign-up${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const signInUrl = `${basePath}/sign-in${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[.88fr_1.12fr]">
      <aside className="relative hidden overflow-hidden bg-[hsl(var(--secondary))] p-10 text-[hsl(var(--secondary-foreground))] lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="saxeli-wordmark text-4xl hover:opacity-90 transition-opacity">
          saxeli
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.24em] text-[hsl(var(--primary))]">
            ნივთებს შორის, ადამიანებს შორის
          </p>
          <h1 className="font-display mt-5 text-6xl font-semibold leading-[1.05] tracking-[-.07em]">
            შენი ადგილი
            <br />
            კარგი ნივთებისთვის.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-[hsl(var(--secondary-foreground)/.63)]">
            დაცული ანგარიში გაძლევს გაყიდვის, შეტყობინებებისა და შენახული
            ნივთების მართვის საშუალებას.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[hsl(var(--secondary-foreground)/.5)]">
          <ShieldCheck size={16} /> უსაფრთხო სივრცე, ნამდვილი ადამიანები
        </div>
        <div
          className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full border-[28px] border-[hsl(var(--primary)/.9)]"
          aria-hidden="true"
        />
      </aside>

      <main className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] px-5 py-10 relative">
        <div className="absolute top-6 left-6 lg:hidden">
           <Link href="/" className="saxeli-wordmark text-2xl hover:opacity-90 transition-opacity text-[hsl(var(--foreground))]">
            saxeli
          </Link>
        </div>
        
        {isLogin ? (
          <SignIn
            routing="path"
            path={`${basePath}/sign-in`}
            signUpUrl={signUpUrl}
            fallbackRedirectUrl={returnTo}
            forceRedirectUrl={returnTo}
          />
        ) : (
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={signInUrl}
            fallbackRedirectUrl={returnTo}
            forceRedirectUrl={returnTo}
          />
        )}
      </main>
    </div>
  );
}
