import { SGSidebar } from "@/components/layout/sg-sidebar";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";

export default function SGLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="flex h-screen overflow-hidden bg-stone-50 dark:bg-zinc-950">
                <div className="hidden md:block">
                    <SGSidebar />
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="md:hidden p-4 border-b bg-amber-50 dark:bg-amber-950/30">
                        <span className="font-bold text-amber-900 dark:text-amber-100">Secção de Sargentos</span>
                    </div>

                    <div className="hidden md:block">
                        <Header />
                    </div>
                    <main className="flex-1 overflow-auto p-4 md:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
