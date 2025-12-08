import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileHeader } from "@/components/mobile-header";
import { createClient } from "@/lib/supabase/server";
import { NewInquiryAlert } from "@/components/new-inquiry-alert";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestão de Inquéritos",
  description: "Aplicação para gestão de inquéritos policiais",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If we are on the login page (or public page), we want to render it without the sidebar shell typically.
  // Ideally, we'd use route groups (e.g. (auth) and (dashboard)) to separate layouts.
  // But for simplicity in this structure, we can check if user is present.
  // Since middleware enforces auth for everything except /login,
  // IF user is null, it means we are likely on /login or being redirected there.

  // NOTE: This is a simpler approach. If the user hits /login, the middleware allows it.
  // But if we are in this layout, we want to know if we should show the shell.
  // A cleaner way is using Route Groups, but let's stick to the plan of minimal changes first.

  // Actually, Route Groups are cleaner. Let's do it properly?
  // User asked for "Guardar sessão no layout root através de server components."
  // And "Bloquear todo o site excepto /login."

  // Let's assume if there is NO user, we render children (login page handles its own layout essentially via CSS full page).
  // BUT the children are wrapped in body.

  // Let's do this: check auth. If auth, show Sidebar+Header. If not, just show children.
  // This works because Middleware protects non-login routes.

  const isAuthenticated = !!user;

  return (
    <html lang="pt">
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900`}>
        {isAuthenticated ? (
          <div className="flex h-screen overflow-hidden">
            {/* Desktop Sidebar - hidden on mobile */}
            <div className="hidden md:block">
              <Sidebar />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Mobile Header - shown on mobile */}
              <MobileHeader />
              {/* Desktop Header - hidden on mobile */}
              <div className="hidden md:block">
                <Header />
              </div>
              <main className="flex-1 overflow-auto p-4 md:p-6">
                {children}
                <NewInquiryAlert />
              </main>
            </div>
          </div>
        ) : (
          <main className="min-h-screen">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
