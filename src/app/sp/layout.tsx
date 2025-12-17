import { SPSidebar } from "@/components/layout/sp-sidebar";
import { Header } from "@/components/header";
// Reuse Header for now, or create a specific SPHeader if needed later (likely for different title)
// For now, let's keep visual consistency.

export default function SPLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-stone-50 dark:bg-zinc-950">
            {/* Distinct background nuance if possible, or keep consistent */}

            <div className="hidden md:block">
                <SPSidebar />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* We might need a MobileHeader capable of SP mode too, or use the generic one */}
                {/* For this iteration, let's assume Desktop focus or reuse generic components where possible */}
                <div className="md:hidden p-4 border-b bg-white dark:bg-gray-950">
                    <span className="font-bold">Secção de Processos</span>
                    {/* Simple mobile placeholder until we adapt MobileHeader */}
                </div>

                <div className="hidden md:block">
                    {/* Reuse header but maybe we should pass a title prop? The current Header component seems static or client-side? */}
                    {/* Checking Header code would be good, but let's assume it's generic enough or we will edit it. */}
                    <Header />
                </div>
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
