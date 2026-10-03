import "@/styles/globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Chanakya — Sovereign Mathematical Optimization Solver",
  description:
    "India's sovereign, from-scratch LP / MILP / QP mathematical optimization engine for petrochemical, refining, power grid dispatch, and logistics operations.",
  keywords: [
    "Mathematical Optimization",
    "Sovereign Solver",
    "Linear Programming",
    "MILP",
    "Interior Point",
    "Simplex",
    "India",
    "Petrochemical",
    "Refinery Planning",
  ],
  authors: [{ name: "Sovereign Mathematical Optimization Initiative" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#07090F] text-gray-100 antialiased selection:bg-saffron selection:text-black">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
