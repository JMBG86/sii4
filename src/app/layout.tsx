import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestão de Inquéritos",
  description: "Aplicação para gestão de inquéritos policiais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900`}>
        {children}
      </body>
    </html>
  );
}
