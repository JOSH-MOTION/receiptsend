import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export const metadata: Metadata = {
  title: "SENDORA | Digital Receipt Management",
  description:
    "Generate and send professional digital receipts instantly via Email & SMS. Built for modern businesses in Ghana and beyond.",
  keywords: [
    "digital receipts ghana",
    "sendora",
    "receipt management",
    "send receipts ghana",
    "sms receipts",
    "email receipts",
    "business receipts accra",
    "digital invoicing ghana",
    "receipt app ghana",
    "small business tools ghana",
  ],

  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },

  openGraph: {
    title: "SENDORA | Digital Receipt Management",
    description:
      "Send professional digital receipts via Email & SMS instantly. Manage your transactions, contacts, and business branding — all in one place.",
    url: "https://receiptsend.vercel.app/",
    siteName: "Sendora",
    images: [
      {
        url: "https://receiptsend.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sendora - Digital Receipt Management",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "SENDORA | Digital Receipts via Email & SMS",
    description:
      "Ditch paper receipts. Send professional digital receipts to your customers in seconds.",
    images: ["https://receiptsend.vercel.app/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}