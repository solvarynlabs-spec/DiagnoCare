import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Conditions, confidentialité et avertissement pédagogique", "Terms, privacy and educational disclaimer"),
    description: t("Conditions d'utilisation, résumé de la politique de confidentialité et avertissement d'usage pédagogique de DiagnoCare.", "DiagnoCare terms of use, privacy summary and educational-use disclaimer."),
  };
}

export default async function LegalPage() {
  const t = await getT();
  return (
    <>
      <PageHero eyebrow={t("Mentions légales", "Legal")} photo="hospitalLobby" title={t("Conditions, confidentialité et avertissement pédagogique", "Terms, privacy and educational disclaimer")} sub={t("Textes types pour cette version — à faire relire par un juriste avant le lancement (notamment au regard de la loi algérienne n° 18-07 sur la protection des données personnelles).", "Template texts for this version — to be reviewed by a lawyer before launch (in particular under Algerian law no. 18-07 on personal data protection).")} />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="prose-medsim space-y-8">
          <section id="disclaimer" className="scroll-mt-28 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
            <h2 className="mb-2 text-lg font-bold">{t("Avertissement d'usage pédagogique", "Educational-use disclaimer")}</h2>
            <p>{t("DiagnoCare est une plateforme de simulation pédagogique. Tous les patients virtuels sont fictifs. La plateforme ne pose pas de diagnostic, ne traite pas et ne conseille pas de vrais patients ; elle ne doit pas servir à une décision clinique.", "DiagnoCare is an educational simulation platform. All virtual patients are fictional. The platform does not diagnose, treat or advise real patients; it must not be used for clinical decisions.")}</p>
            <p>{t("Les notes reposent sur les grilles propres à chaque cas. Le feedback narratif produit par IA n'est pas validé médicalement de façon indépendante. Les cas destinés à une formation formelle doivent être relus par des experts cliniques qualifiés de la faculté qui les utilise.", "Scores are based on each case's own rubric. AI-generated narrative feedback is not independently medically validated. Cases intended for formal teaching must be reviewed by qualified clinical experts from the faculty using them.")}</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-bold">{t("Conditions d'utilisation", "Terms of use")}</h2>
            <p>{t("Vous ne devez saisir aucune information sur de vrais patients, aucune donnée de santé personnelle ni aucune donnée identifiante de tiers. Vous êtes responsable de la confidentialité de vos identifiants. Les facultés sont responsables des contenus qu'elles rédigent et publient.", "You must not enter any information about real patients, any personal health data or any identifying data about third parties. You are responsible for keeping your credentials confidential. Faculties are responsible for the content they write and publish.")}</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-bold">{t("Résumé de confidentialité", "Privacy summary")}</h2>
            <p>{t("Nous conservons les informations de votre compte, les transcriptions de consultation, vos actions et vos résultats afin de fournir le service et de permettre le suivi par votre faculté. Les mots de passe sont stockés sous forme chiffrée (hachage salé). Les consultations ne sont visibles que par vous, vos enseignants, les administrateurs de votre faculté et ceux de la plateforme. En mode IA, le texte des consultations est transmis, via notre serveur, au fournisseur de modèle de langage configuré afin de générer les réponses.", "We keep your account information, consultation transcripts, actions and results to provide the service and allow your faculty to follow your progress. Passwords are stored hashed (salted). Consultations are visible only to you, your teachers, your faculty's administrators and the platform administrators. In AI mode, consultation text is sent, via our server, to the configured language-model provider to generate replies.")}</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-bold">{t("Paiements", "Payments")}</h2>
            <p>{t("Les paiements par carte CIB ou Edahabia sont traités par SofizPay sur sa page sécurisée (SATIM). DiagnoCare ne voit ni ne stocke jamais vos données de carte ; seul le résultat signé du paiement nous est transmis.", "CIB and Edahabia card payments are processed by SofizPay on its secure page (SATIM). DiagnoCare never sees or stores your card details; only the signed payment result is sent to us.")}</p>
          </section>
        </div>
      </div>
    </>
  );
}
