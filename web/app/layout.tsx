import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apple Music MCP",
  description: "Remote control your Apple Music from anywhere",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground font-sans min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
