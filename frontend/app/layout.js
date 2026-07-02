import "./globals.css";
import { AuthProvider } from "@/lib/AuthProvider";
import { CompanyProvider } from "@/lib/CompanyProvider";
import { ToastProvider } from "@/lib/toast";

export const metadata = {
  title: "SmartERP — Billing, Inventory & Accounting",
  description: "Keyboard-first, Tally-inspired billing, inventory and accounting for growing businesses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-ink text-paper">
        <ToastProvider>
          <AuthProvider>
            <CompanyProvider>{children}</CompanyProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
