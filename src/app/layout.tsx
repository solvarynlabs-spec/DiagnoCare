import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/i18n/server";
import { LangProvider } from "@/lib/i18n/client";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getLang()) === "en";
  return {
    metadataBase: new URL(SITE),
    title: en
      ? { default: "DiagnoCare — Virtual patient simulation for medical students in Algeria", template: "%s · DiagnoCare" }
      : { default: "DiagnoCare — Simulation de patients virtuels pour les études de médecine en Algérie", template: "%s · DiagnoCare" },
    description: en
      ? "DiagnoCare lets medical students interview virtual patients, examine them, order tests, reason their way to a diagnosis and receive rubric-based educational feedback."
      : "DiagnoCare permet aux étudiants en médecine d'interroger des patients virtuels, de les examiner, de demander des examens, de raisonner jusqu'au diagnostic et de recevoir un feedback pédagogique fondé sur une grille d'évaluation.",
    keywords: en
      ? ["virtual patient", "medical simulation", "clinical reasoning", "medical school Algeria", "OSCE"]
      : ["patient virtuel", "simulation médicale", "raisonnement clinique", "études de médecine Algérie", "ECOS", "externat", "internat", "résidanat"],
    openGraph: { type: "website", siteName: "DiagnoCare", locale: en ? "en_GB" : "fr_DZ", title: en ? "DiagnoCare — Virtual patient simulation" : "DiagnoCare — Simulation de patients virtuels", description: en ? "Train your clinical reasoning with realistic virtual patients." : "Entraînez votre raisonnement clinique avec des patients virtuels réalistes." },
    robots: { index: true, follow: true },
    icons: { icon: "/favicon.png?v=4", apple: "/apple-touch-icon.png?v=4" }, // ?v= forces browsers to refresh the cached icon
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#070D1F" },
  ],
};

// Applies the saved/OS theme before paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('medsim-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang === "en" ? "en" : "fr-DZ"} className={`${inter.variable} ${grotesk.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans">
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
