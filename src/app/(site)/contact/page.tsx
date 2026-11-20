import type { Metadata } from "next";
import { Building2, Mail, MessageSquare } from "@/components/icons";
import { PageHero } from "@/components/site/page-hero";
import { ContactForm } from "./contact-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Contact et demande de démo", "Contact and demo request"), description: t("Contactez l'équipe DiagnoCare ou demandez une démonstration pour votre faculté.", "Contact the DiagnoCare team or request a demo for your faculty.") };
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const t = await getT();
  return (
    <>
      <PageHero eyebrow="Contact" photo="hallwayDoctors" title={<>{t("Parlons", "Let's talk")} <span className="text-gradient">{t("simulation.", "simulation.")}</span></>} sub={t("Questions, partenariats ou démonstration pour votre faculté ou votre CHU — nous répondons généralement sous deux jours ouvrés.", "Questions, partnerships or a demo for your faculty or teaching hospital — we usually reply within two working days.")} />
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <h2 className="mb-6 text-2xl font-bold">{t("Comment pouvons-nous vous aider ?", "How can we help?")}</h2>
        <ul className="space-y-4 text-sm">
          <li className="flex gap-3">
            <Building2 className="h-5 w-5 text-teal-500" />
            <span>
              <strong>{t("Démo pour une faculté", "Faculty demo")}</strong>
              <br />
              <span className="muted">{t("Une présentation guidée de la rédaction de cas, des devoirs et des statistiques pour votre équipe pédagogique.", "A guided tour of case authoring, assignments and statistics for your teaching team.")}</span>
            </span>
          </li>
          <li className="flex gap-3">
            <MessageSquare className="h-5 w-5 text-teal-500" />
            <span>
              <strong>{t("Étudiants", "Students")}</strong>
              <br />
              <span className="muted">{t("Consultez d'abord la FAQ : la plupart des questions sur les comptes y trouvent une réponse.", "Check the FAQ first: most account questions are answered there.")}</span>
            </span>
          </li>
          <li className="flex gap-3">
            <Mail className="h-5 w-5 text-teal-500" />
            <span>
              <strong>{t("Messages conservés en toute sécurité", "Messages stored securely")}</strong>
              <br />
              <span className="muted">{t("et traités par l'équipe depuis la console d'administration.", "and handled by the team from the admin console.")}</span>
            </span>
          </li>
        </ul>
      </div>
      <ContactForm initialKind={type === "demo" ? "DEMO" : "CONTACT"} />
    </div>
    </>
  );
}
