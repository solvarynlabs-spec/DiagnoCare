/**
 * Display blocks for the source-traceable draft activities: draft banner, review metadata,
 * reference panel and case debrief. Hook-free so they render in server and client components.
 */
import { AlertTriangle, BookOpen, ShieldAlert } from "@/components/icons";
import type { UiLang } from "@/lib/i18n/shared";
import { SOURCES } from "@/lib/pedagogy/sources";
import { DRAFT_LABEL, REVIEW_TAG, SIM_LABEL, type Bi, type CasePedagogy, type RefUse, type ReviewMeta } from "@/lib/pedagogy/types";

const L = (b: Bi, lang: UiLang) => (lang === "en" ? b.en : b.fr);

/** "dark" = the dark simulation pages; "theme" = themed app cards (light or dark). */
type Tone = "dark" | "theme";
const TONE = {
  dark: { box: "rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm", dim: "text-white/50", soft: "text-white/55", body: "text-white/75", rule: "border-white/10", link: "decoration-white/30 hover:decoration-white" },
  theme: { box: "panel rounded-2xl p-5 text-sm", dim: "subtle", soft: "subtle", body: "muted", rule: "border-[rgb(var(--line))]", link: "decoration-current/30" },
};

export function DraftBanner({ lang, approved = false, className = "" }: { lang: UiLang; approved?: boolean; className?: string }) {
  return (
    <div role="note" className={`flex flex-wrap items-start gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-sm ${approved ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-amber-400/50 bg-amber-400/10 text-amber-100"} ${className}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">
        {!approved && <strong className="font-semibold">{L(DRAFT_LABEL, lang)}. </strong>}
        {L(SIM_LABEL, lang)}.{" "}
        {lang === "en" ? "Not a clinical decision-support tool." : "Ce n'est pas un outil d'aide à la décision clinique."}
      </p>
    </div>
  );
}

/** Small pill for cards. */
export function DraftPill({ lang }: { lang: UiLang }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-100">
      <AlertTriangle className="h-3 w-3" aria-hidden /> {lang === "en" ? "Draft · review required" : "Brouillon · relecture requise"}
    </span>
  );
}

export function ReviewPanel({ review, lang, live, tone = "dark" }: { tone?: Tone; review: ReviewMeta; lang: UiLang; live?: { status: string; version: number; reviewedBy: string | null; reviewedAt: Date | null } }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const approved = live ? live.status === "PUBLISHED" : review.status === "approved";
  const C = TONE[tone];
  return (
    <section aria-labelledby="review-h" className={C.box}>
      <h2 id="review-h" className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-5 w-5 text-amber-300" aria-hidden /> {t("Relecture et version", "Review and version")}</h2>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <div><dt className={C.dim}>{t("Statut", "Status")}</dt><dd className="font-medium">{approved ? t("Validé par un enseignant clinicien", "Approved by a clinical educator") : L(DRAFT_LABEL, lang)}</dd></div>
        <div><dt className={C.dim}>Version</dt><dd>{live ? `v${live.version} (${t("contenu", "content")} ${review.version})` : review.version}</dd></div>
        <div><dt className={C.dim}>{t("Relecteur", "Reviewer")}</dt><dd>{live?.reviewedBy && approved ? live.reviewedBy : review.reviewer ?? t("[à compléter — nom et fonction de l'enseignant]", "[to complete — educator's name and role]")}</dd></div>
        <div><dt className={C.dim}>{t("Date de relecture", "Review date")}</dt><dd>{live?.reviewedAt && approved ? live.reviewedAt.toISOString().slice(0, 10) : review.reviewDate ?? t("[à compléter]", "[to complete]")}</dd></div>
      </dl>
      {review.localProtocol && (
        <p className={`mt-4 rounded-lg border border-[#2f86ff]/30 bg-[#2f86ff]/10 px-3 py-2 ${C.body}`}>{L(review.localProtocol, lang)}</p>
      )}
      {review.pending.length > 0 && (
        <div className="mt-4">
          <p className="font-medium text-amber-600 dark:text-amber-200">{L(REVIEW_TAG, lang)} :</p>
          <ul className={`mt-1.5 space-y-1 ${C.body}`}>
            {review.pending.map((p) => <li key={p.fr}>• {L(p, lang)}</li>)}
          </ul>
          <p className={`mt-2 text-xs ${C.soft}`}>{t("Ces points sont exclus de la correction présentée aux étudiants.", "These points are excluded from the answer key shown to students.")}</p>
        </div>
      )}
    </section>
  );
}

export function ReferencePanel({ refs, lang, tone = "dark" }: { refs: RefUse[]; lang: UiLang; tone?: Tone }) {
  const C = TONE[tone];
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  return (
    <section aria-labelledby="refs-h" className={C.box}>
      <h2 id="refs-h" className="flex items-center gap-2 font-semibold"><BookOpen className="h-5 w-5 text-[#6fb1ff]" aria-hidden /> {t("Références", "References")}</h2>
      <ol className="mt-3 space-y-4">
        {refs.map((r, k) => {
          const s = SOURCES[r.id];
          if (!s) return null;
          return (
            <li key={`${r.id}-${k}`} className={`border-l-2 pl-3 ${C.rule}`}>
              <p className="font-medium leading-snug">
                {s.url ? <a href={s.url} target="_blank" rel="noreferrer noopener" className={`underline underline-offset-2 ${C.link} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6fb1ff]`}>{s.title}</a> : s.title}
              </p>
              <p className={C.soft}>{s.org} · {t("publié / mis à jour", "published / updated")} : {s.published}</p>
              <p className={`mt-1 ${C.body}`}><span className={C.dim}>{t("Section utilisée", "Section used")} :</span> {L(r.section, lang)}</p>
              <p className={`mt-1 text-xs ${C.soft}`}>{L(s.verified, lang)} {t("Vérifié le", "Checked on")} {s.checked}.</p>
              <p className={`mt-1 text-xs ${C.soft}`}>
                {s.permissionNeeded && <span className="mr-1 rounded border border-amber-400/50 px-1 py-px font-semibold text-amber-600 dark:text-amber-200">{t("Autorisation requise pour adapter", "Permission needed to adapt")}</span>}
                {L(s.licence, lang)}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Debrief from a case's pedagogy block (report page; themed panels). */
export function CaseDebrief({ p, lang }: { p: CasePedagogy; lang: UiLang }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const List = ({ items }: { items: Bi[] }) => <ul className="muted mt-2 space-y-1.5 text-sm">{items.map((x) => <li key={x.fr}>• {L(x, lang)}</li>)}</ul>;
  return (
    <div className="space-y-5">
      {p.support && <p className="rounded-xl border border-teal-400/40 bg-teal-400/10 px-4 py-3 text-sm">{L(p.support, lang)}</p>}
      <div>
        <h3 className="font-semibold">{t("Raisonnement attendu", "Expected reasoning")}</h3>
        <ol className="muted mt-2 list-decimal space-y-1.5 pl-5 text-sm">{p.reasoning.map((x) => <li key={x.fr}>{L(x, lang)}</li>)}</ol>
      </div>
      <div>
        <h3 className="font-semibold">{t("À ne pas manquer", "Must not miss")}</h3>
        <List items={p.mustNotMiss} />
      </div>
      <div>
        <h3 className="font-semibold">{t("Incertitude", "Uncertainty")}</h3>
        <p className="muted mt-2 text-sm">{L(p.uncertainty, lang)}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {([["correct", t("Démarche correcte", "Correct approach")], ["incomplete", t("Démarche incomplète", "Incomplete approach")], ["unsafe", t("Choix dangereux", "Unsafe choices")]] as const).map(([k, label]) => (
          <div key={k} className="rounded-xl border border-[rgb(var(--line))] p-3 text-sm">
            <p className="font-semibold">{k === "correct" ? "✓ " : k === "incomplete" ? "◐ " : "⚠ "}{label}</p>
            <p className="muted mt-1">{L(p.feedback[k], lang)}</p>
          </div>
        ))}
      </div>
      <div>
        <h3 className="font-semibold">{t("Comment la grille est construite", "How the rubric works")}</h3>
        <ul className="muted mt-2 space-y-1.5 text-sm">{p.rubricMap.map((r) => <li key={r.domain + r.how.fr}>• {L(r.how, lang)}</li>)}</ul>
      </div>
      <div>
        <h3 className="font-semibold">{t("Questions de réflexion", "Reflection questions")}</h3>
        <List items={p.reflection} />
      </div>
    </div>
  );
}
