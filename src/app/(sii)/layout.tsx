import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileHeader } from "@/components/mobile-header";
import { NewInquiryAlert } from "@/components/new-inquiry-alert";
import { AuthGuard } from "@/components/auth-guard";

export default function SIILayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
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
        </AuthGuard>
    );
}
