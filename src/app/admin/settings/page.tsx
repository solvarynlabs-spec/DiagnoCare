import { requireUser } from "@/lib/auth/session";
import { aiMode } from "@/lib/sim/engines";
import { groqModel } from "@/lib/sim/engines/groq";
import { anthropicModel } from "@/lib/sim/engines/anthropic";
import { getSetting } from "@/lib/settings";
import { Badge, Card, CardTitle, PageHeader } from "@/components/ui";
import { SettingSelect } from "./setting-select";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Réglages IA et plateforme", "AI & platform settings") };
}

export default async function AdminSettings() {
  await requireUser({ permission: "platform:settings" });
  const t = makeT(await getLang());
  const mode = aiMode();
  const [patientEffort, feedbackEffort, voice, drafts] = await Promise.all([getSetting("ai.patientEffort"), getSetting("ai.feedbackEffort"), getSetting("voice.enabled"), getSetting("drafts.studentAccess")]);
  return (
    <>
      <PageHeader eyebrow="Configuration" title={t("Réglages IA et plateforme", "AI & platform settings")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle sub={t("Configuré par les variables d'environnement du serveur", "Configured by server environment variables")}>{t("Moteur IA", "AI engine")}</CardTitle>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="muted">Mode</dt><dd>{mode === "anthropic" ? <Badge tone="green">{t("En direct (Anthropic)", "Live (Anthropic)")}</Badge> : mode === "groq" ? <Badge tone="green">{t("En direct (Groq)", "Live (Groq)")}</Badge> : <Badge tone="amber">{t("Démo — moteur hors ligne", "Demo — offline engine")}</Badge>}</dd></div>
            <div className="flex justify-between"><dt className="muted">{t("Modèle", "Model")}</dt><dd className="font-mono text-xs">{mode === "anthropic" ? anthropicModel() : mode === "groq" ? groqModel() : "—"}</dd></div>
            <div className="flex justify-between"><dt className="muted">{t("Repli de sécurité", "Safety fallback")}</dt><dd className="text-xs">{t("Modèle de repli côté serveur + moteur hors ligne en cas d'échec", "Server-side fallback model + offline engine on failure")}</dd></div>
          </dl>
          {mode === "demo" && <p className="subtle mt-4 text-xs">{t("Pour activer le patient IA, définissez", "To enable the AI patient, set")} <code className="font-mono">ANTHROPIC_API_KEY</code> ({t("et éventuellement", "and optionally")} <code className="font-mono">AI_PROVIDER=anthropic</code>) {t("dans l'environnement du serveur, puis redémarrez. Les clés ne sont jamais exposées au navigateur.", "in the server environment, then restart. Keys are never exposed to the browser.")}</p>}
        </Card>
        <Card>
          <CardTitle sub={t("Appliqué immédiatement aux nouvelles requêtes", "Applied immediately to new requests")}>{t("Comportement", "Behaviour")}</CardTitle>
          <div className="space-y-4">
            <SettingSelect k="ai.patientEffort" label={t("Effort des réponses du patient", "Patient reply effort")} value={patientEffort} options={["low", "medium", "high"]} hint={t("Plus élevé = jeu de rôle plus nuancé, réponses plus lentes.", "Higher = more nuanced role-play, slower replies.")} />
            <SettingSelect k="ai.feedbackEffort" label={t("Effort du feedback narratif", "Narrative feedback effort")} value={feedbackEffort} options={["low", "medium", "high"]} hint={t("Effort utilisé pour rédiger le commentaire après la consultation.", "Effort used to write the comment after the consultation.")} />
            <SettingSelect k="voice.enabled" label={t("Consultations vocales", "Voice consultations")} value={voice} options={["true", "false"]} hint={t("Reconnaissance et synthèse vocales du navigateur pour Pro et Faculté.", "Browser speech recognition and synthesis for Pro and Faculty.")} />
            <SettingSelect k="drafts.studentAccess" label={t("Accès des étudiants aux brouillons", "Student access to drafts")} value={drafts} options={["false", "true"]} hint={t("Ouvre aux étudiants les cas et ateliers sourcés encore en relecture clinique (toujours affichés « Brouillon »). Activé par défaut ; enseignants et administrateurs y ont toujours accès.", "Opens source-traceable cases and workshops still under clinical review to students (always labelled 'Draft'). On by default; teachers and admins always have access.")} />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle>{t("Garde-fous (toujours actifs)", "Safeguards (always on)")}</CardTitle>
          <ul className="muted grid gap-2 text-sm md:grid-cols-2">
            <li>• {t("Le moteur patient ne reçoit jamais le diagnostic, la grille ni les résultats.", "The patient engine never receives the diagnosis, rubric or results.")}</li>
            <li>• {t("La note est calculée de façon déterministe ; l'IA ne fait qu'expliquer.", "Scoring is deterministic; the AI only explains.")}</li>
            <li>• {t("Le contenu est figé par consultation ; toute modification exige une nouvelle validation.", "Content is frozen per consultation; any edit requires a new review.")}</li>
            <li>• {t("Avertissement pédagogique sur chaque rapport et chaque consultation.", "Educational disclaimer on every report and consultation.")}</li>
            <li>• {t("Contrôle d'accès par rôle sur chaque API, avec journal d'audit.", "Role-based access control on every API, with an audit log.")}</li>
            <li>• {t("Limitation du nombre de requêtes (connexion, conversation, démo publique).", "Rate limiting (sign-in, conversation, public demo).")}</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
