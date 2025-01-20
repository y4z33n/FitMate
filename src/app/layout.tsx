import type { Metadata } from "next";
import "./globals.css";
import { NextAuthProvider } from "./providers";
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "FitMate - Your AI Fitness Assistant",
  description: "Get personalized fitness advice and workout plans with FitMate",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} bg-gray-900`}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
