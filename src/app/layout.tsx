import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Sef'Ori Juris — High Chief Jurist",
    description: "Tactical Interface for the Knight Paladin of Amaunator",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@400;700&display=swap" rel="stylesheet" />
            </head>
            <body style={{ margin: 0, padding: 0 }}>
                {children}
            </body>
        </html>
    );
}
