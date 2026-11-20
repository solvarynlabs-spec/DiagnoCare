/**
 * Source registry for the draft educational activities (cases and workshops).
 *
 * Each entry records what was verified, how, and when. "verified" describes the level of
 * verification honestly: most entries were checked against the publisher's or an indexing
 * page (title, organisation, date, scope), NOT against the full text. Any clinical detail
 * that depends on the full text is listed under the activity's `review.pending` items and
 * kept out of the student-facing answer key until a clinical educator confirms it.
 *
 * Licensing: citing and paraphrasing facts is fine; reproducing text, tables, algorithms,
 * posters or images is not, unless the licence allows it. DiagnoCare is a paid platform, so
 * "NonCommercial" (NC) licences do not cover reuse here without permission.
 */
import type { Bi } from "./types";

export interface SourceEntry {
  id: string;
  title: string;
  org: string;
  url: string;
  /** Publication or last-update date as stated by the publisher. */
  published: string;
  /** Date this entry was checked. */
  checked: string;
  /** What was actually verified. */
  verified: Bi;
  licence: Bi;
  /** true when adapting (not just citing) the material needs the rights holder's permission. */
  permissionNeeded: boolean;
}

const CHECKED = "2026-11-20";
const META_ONLY: Bi = {
  fr: "Vérifié : titre, organisme, date et périmètre sur la page de l'éditeur / d'indexation. Texte intégral non relu ici.",
  en: "Verified: title, organisation, date and scope on the publisher / indexing page. Full text not re-read here.",
};
const WHO_LICENCE: Bi = {
  fr: "Les publications de l'OMS sont en général sous CC BY-NC-SA 3.0 IGO : la mention « NC » ne couvre pas une plateforme payante. Ici, l'OMS est citée et paraphrasée, rien n'est reproduit. Confirmer la licence exacte du document avant toute adaptation.",
  en: "WHO publications are usually CC BY-NC-SA 3.0 IGO: the NC term does not cover a paid platform. Here WHO is cited and paraphrased only; nothing is reproduced. Confirm the exact licence of the document before any adaptation.",
};
const JOURNAL_LICENCE: Bi = {
  fr: "Article sous droits de l'éditeur : citation et paraphrase uniquement. Aucune figure, aucun tableau ni algorithme reproduit ; leur adaptation exige une autorisation.",
  en: "Publisher-copyrighted article: citation and paraphrase only. No figure, table or algorithm reproduced; adapting them requires permission.",
};

export const SOURCES: Record<string, SourceEntry> = {
  "who-bec": {
    id: "who-bec",
    title: "WHO-ICRC Basic Emergency Care: approach to the acutely ill and injured",
    org: "World Health Organization & International Committee of the Red Cross",
    url: "https://www.who.int/publications/i/item/9789241513081",
    published: "2018",
    checked: CHECKED,
    verified: { fr: "Vérifié : publication et cours OpenWHO (modules ABCDE, difficulté respiratoire, choc, altération de la conscience, traumatisme ; module de transfert avec SBAR). Texte intégral non relu ici.", en: "Verified: publication and OpenWHO course (modules: ABCDE, difficulty in breathing, shock, altered mental status, trauma; transfer module using SBAR). Full text not re-read here." },
    licence: WHO_LICENCE,
    permissionNeeded: true,
  },
  "who-sbar": {
    id: "who-sbar",
    title: "WHO SBAR Handover Tool (WHO Emergency Care Toolkit) — and WHO Patient Safety Solution 3: Communication during patient hand-overs",
    org: "World Health Organization",
    url: "https://www.who.int/publications/i/item/9789241513081",
    published: "Patient Safety Solution 3 : mai 2007 ; outil SBAR : boîte à outils OMS des soins d'urgence (date non confirmée)",
    checked: CHECKED,
    verified: { fr: "Vérifié via sources secondaires : l'outil OMS invite à transmettre le diagnostic de travail, le motif du transfert, l'histoire, l'évolution ABCDE, les examens, la réponse aux interventions. PDF de l'outil non ouvert ici : date et contenu exacts à confirmer.", en: "Verified via secondary sources: the WHO tool prompts working diagnosis, reason for transfer, history, ABCDE changes, tests and response to interventions. Tool PDF not opened here: exact date and content to confirm." },
    licence: WHO_LICENCE,
    permissionNeeded: true,
  },
  "who-etat": {
    id: "who-etat",
    title: "Paediatric emergency triage, assessment and treatment: care of critically-ill children (updated guideline)",
    org: "World Health Organization",
    url: "https://www.who.int/publications/i/item/9789241510219",
    published: "2016",
    checked: CHECKED,
    verified: { fr: "Vérifié : mise à jour partielle 2016 (oxygène, convulsions, examens pour convulsions/altération de conscience ; liquides selon certaines notices), qui complète le manuel ETAT 2005 et le Pocket Book 2013. Les seuils exacts des signes d'urgence et de priorité restent à confirmer dans le manuel ETAT.", en: "Verified: 2016 partial update (oxygen, seizures, tests for seizures / altered consciousness; fluids per some records), complementing the 2005 ETAT manual and 2013 Pocket Book. Exact emergency- and priority-sign thresholds still to confirm in the ETAT manual." },
    licence: WHO_LICENCE,
    permissionNeeded: true,
  },
  "wses-2025": {
    id: "wses-2025",
    title: "Diagnosis and Treatment of Acute Appendicitis: 2025 Edition of the World Society of Emergency Surgery Jerusalem Guidelines",
    org: "World Society of Emergency Surgery (JAMA Surgery 2026;161(3):283–295, doi:10.1001/jamasurg.2025.6218)",
    url: "https://doi.org/10.1001/jamasurg.2025.6218",
    published: "2025 (en ligne) — numéro de mars 2026",
    checked: CHECKED,
    verified: { fr: "Vérifié via le résumé (dépôts universitaires) : 35 recommandations GRADE ; scores cliniques + imagerie améliorent le diagnostic et réduisent les appendicectomies blanches ; adaptation aux ressources locales. Publié dans JAMA Surgery (et non WJES comme les éditions 2016/2020). Texte intégral non relu.", en: "Verified via abstract (university repositories): 35 GRADE recommendations; clinical scores + imaging improve diagnosis and reduce negative appendicectomy; adapt to local resources. Published in JAMA Surgery (not WJES like the 2016/2020 editions). Full text not read." },
    licence: JOURNAL_LICENCE,
    permissionNeeded: true,
  },
  "esge-2026": {
    id: "esge-2026",
    title: "Endoscopic diagnosis and management of peptic ulcer bleeding: ESGE Guideline — Update 2026",
    org: "European Society of Gastrointestinal Endoscopy (Endoscopy)",
    url: "https://www.esge.com/esge-guidelines/",
    published: "2026",
    checked: CHECKED,
    verified: { fr: "Vérifié via sources secondaires : mise à jour 2026 de la recommandation ESGE 2021 ; endoscopie précoce dans les 24 h après réanimation hémodynamique. Texte intégral non relu : seuils de score et détails de traitement exclus de la correction.", en: "Verified via secondary sources: 2026 update of the 2021 ESGE guideline; early endoscopy within 24 h after haemodynamic resuscitation. Full text not read: score thresholds and treatment details excluded from the answer key." },
    licence: JOURNAL_LICENCE,
    permissionNeeded: true,
  },
  "who-hb-2024": {
    id: "who-hb-2024",
    title: "Guideline on haemoglobin cutoffs to define anaemia in individuals and populations",
    org: "World Health Organization",
    url: "https://www.who.int/publications/i/item/9789240088542",
    published: "2024-03-04",
    checked: CHECKED,
    verified: { fr: "Vérifié : date, ISBN 978-92-4-008854-2, ajustements altitude et tabac, seuil homme adulte < 130 g/L. Seuil femme non enceinte (< 120 g/L) et seuils de sévérité à confirmer dans le tableau du document.", en: "Verified: date, ISBN 978-92-4-008854-2, altitude and smoking adjustments, adult male cutoff < 130 g/L. Non-pregnant female cutoff (< 120 g/L) and severity cutoffs to confirm in the document's table." },
    licence: WHO_LICENCE,
    permissionNeeded: true,
  },
  "who-mhgap-ig": {
    id: "who-mhgap-ig",
    title: "mhGAP Intervention Guide for mental, neurological and substance use disorders in non-specialized health settings — Version 2.0",
    org: "World Health Organization",
    url: "https://www.who.int/publications/i/item/9789241549790",
    published: "2016",
    checked: CHECKED,
    verified: { fr: "Vérifié : modules Dépression (DEP) et Auto-agression/suicide (SUI). Texte intégral non relu ici.", en: "Verified: Depression (DEP) and Self-harm/suicide (SUI) modules. Full text not re-read here." },
    licence: WHO_LICENCE,
    permissionNeeded: true,
  },
  "who-mhgap-2023": {
    id: "who-mhgap-2023",
    title: "Mental Health Gap Action Programme (mhGAP) guideline for mental, neurological and substance use disorders (3rd edition)",
    org: "World Health Organization",
    url: "https://www.who.int/publications/i/item/9789240084278",
    published: "2023-11-20",
    checked: CHECKED,
    verified: META_ONLY,
    licence: WHO_LICENCE,
    permissionNeeded: true,
  },
  "erc-2025-bls": {
    id: "erc-2025-bls",
    title: "European Resuscitation Council Guidelines 2025: Adult Basic Life Support",
    org: "European Resuscitation Council (Resuscitation 2025;215 Suppl 1:110771) — relayé par le Resuscitation Council UK",
    url: "https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines",
    published: "2025-10-27",
    checked: CHECKED,
    verified: { fr: "Vérifié : publication et principal changement 2025 (appeler les secours pour toute personne qui ne répond pas, sans attendre de confirmer une respiration anormale). Page RCUK 2025 : compressions à 100–120/min, profondeur 5–6 cm, relâchement complet, interruptions minimales. Ratio 30:2 pour le sauveteur formé et RCP « compressions seules » pour le non-formé : vu dans une source secondaire, à confirmer dans le texte.", en: "Verified: publication and main 2025 change (call emergency services for any unresponsive person, without first confirming abnormal breathing). RCUK 2025 page: compressions at 100–120/min, depth 5–6 cm, full recoil, minimal interruptions. 30:2 ratio for trained rescuers and compression-only CPR for untrained rescuers: seen in a secondary source, to confirm in the text." },
    licence: JOURNAL_LICENCE,
    permissionNeeded: true,
  },
  "who-hand-hygiene": {
    id: "who-hand-hygiene",
    title: "WHO Guidelines on Hand Hygiene in Health Care (2009) and 'Five moments for hand hygiene'",
    org: "World Health Organization",
    url: "https://www.who.int/publications/m/item/five-moments-for-hand-hygiene",
    published: "2009 (lignes directrices) ; 2021-03-04 (page « Five moments »)",
    checked: CHECKED,
    verified: { fr: "Vérifié : les cinq moments (soins de santé, pas lavage des mains grand public). Le poster « My 5 Moments » est « © WHO 2009, all rights reserved » : il n'est pas reproduit, seule la notion est paraphrasée.", en: "Verified: the five moments (health care, not community handwashing). The 'My 5 Moments' poster is '© WHO 2009, all rights reserved': it is not reproduced; only the concept is paraphrased." },
    licence: { fr: "Poster © OMS 2009, tous droits réservés : reproduction ou adaptation soumise à autorisation de l'OMS.", en: "Poster © WHO 2009, all rights reserved: reproduction or adaptation requires WHO permission." },
    permissionNeeded: true,
  },
  "esc-syncope-2018": {
    id: "esc-syncope-2018",
    title: "2018 ESC Guidelines for the diagnosis and management of syncope",
    org: "European Society of Cardiology (Eur Heart J 2018;39:1883–1948)",
    url: "https://www.escardio.org/education/content-collections/focus/syncope/",
    published: "2018",
    checked: CHECKED,
    verified: { fr: "Vérifié : la version 2018 reste la référence ESC ; le calendrier ESC annonce une recommandation « Syncope et troubles autonomiques » pour 2027. Critères de haut risque : à confirmer dans le texte.", en: "Verified: 2018 is still the current ESC reference; the ESC schedule lists a 'Syncope and cardiovascular autonomic disorders' guideline for 2027. High-risk criteria: to confirm in the text." },
    licence: { fr: "Contenu ESC/Oxford University Press sous droits. Les tableaux, algorithmes et outils (dont l'application ESC Pocket Guidelines) ne sont ni reproduits ni adaptés en interactions : autorisation ESC requise pour le faire.", en: "ESC / Oxford University Press copyrighted content. Tables, algorithms and tools (including the ESC Pocket Guidelines app) are neither reproduced nor adapted into interactions: ESC permission is required to do so." },
    permissionNeeded: true,
  },
  "aha-stroke-2026": {
    id: "aha-stroke-2026",
    title: "2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke",
    org: "American Heart Association / American Stroke Association (Stroke, doi:10.1161/STR.0000000000000513)",
    url: "https://professional.heart.org/en/guidelines-statements/2026-guideline-for-the-early-management-of-patients-with-acute-ischemic-strokestr0000000000000513",
    published: "2026-01-26",
    checked: CHECKED,
    verified: { fr: "Vérifié via la page AHA et PubMed : remplace les recommandations 2018/2019 ; couvre de l'évaluation préhospitalière à la prévention secondaire précoce. Classes et niveaux de preuve à confirmer dans le texte.", en: "Verified via AHA page and PubMed: replaces the 2018/2019 guideline; covers prehospital evaluation to early secondary prevention. Classes and levels of evidence to confirm in the text." },
    licence: JOURNAL_LICENCE,
    permissionNeeded: true,
  },
  "ssc-2026": {
    id: "ssc-2026",
    title: "Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2026",
    org: "Society of Critical Care Medicine / European Society of Intensive Care Medicine",
    url: "https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026",
    published: "2026-03-23",
    checked: CHECKED,
    verified: { fr: "Vérifié : édition 2026 (5ᵉ mise à jour, après 2021). Utilisée ici pour la reconnaissance et l'escalade uniquement : aucun antibiotique, liquide ou objectif chiffré n'est enseigné dans ce cas.", en: "Verified: 2026 edition (5th update, after 2021). Used here for recognition and escalation only: no antibiotic, fluid or numeric target is taught in this case." },
    licence: JOURNAL_LICENCE,
    permissionNeeded: true,
  },
  "statpearls-abg": {
    id: "statpearls-abg",
    title: "Arterial Blood Gas (StatPearls)",
    org: "StatPearls Publishing — NCBI Bookshelf NBK536919",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK536919/",
    published: "2024-01-08 (dernière mise à jour)",
    checked: CHECKED,
    verified: { fr: "Vérifié : PaCO₂ 35–45 mmHg, HCO₃⁻ 22–26 mEq/L. Intervalle du pH (7,35–7,45) non vu dans l'extrait : à confirmer. Les intervalles du laboratoire local priment.", en: "Verified: PaCO₂ 35–45 mmHg, HCO₃⁻ 22–26 mEq/L. pH interval (7.35–7.45) not seen in the excerpt: to confirm. Local laboratory intervals take precedence." },
    licence: { fr: "Licence de l'article non confirmée (StatPearls indique souvent CC BY-NC-ND) : citation et paraphrase uniquement.", en: "Article licence not confirmed (StatPearls often states CC BY-NC-ND): citation and paraphrase only." },
    permissionNeeded: true,
  },
  "radiopaedia-cxr": {
    id: "radiopaedia-cxr",
    title: "Systematic chest radiograph assessment (approach)",
    org: "Radiopaedia.org",
    url: "https://radiopaedia.org/articles/systematic-chest-radiograph-assessment-approach",
    published: "Article collaboratif, révisé en continu",
    checked: CHECKED,
    verified: { fr: "Vérifié : existence d'approches systématiques (qualité de l'image, revue anatomique). Il n'existe pas d'ordre de lecture universel. Aucune image n'est reproduite.", en: "Verified: systematic approaches exist (image quality, anatomical review). There is no universally accepted reading order. No image is reproduced." },
    licence: { fr: "Licence Radiopaedia non confirmée ici (souvent CC BY-NC-SA) : la mention NC exclut une plateforme payante. Aucune image intégrée : l'enseignant doit fournir des radiographies sous licence adaptée.", en: "Radiopaedia licence not confirmed here (often CC BY-NC-SA): the NC term excludes a paid platform. No image embedded: the educator must supply suitably licensed radiographs." },
    permissionNeeded: true,
  },
  "educator-checklist": {
    id: "educator-checklist",
    title: "Grille d'examen clinique de la faculté (à fournir)",
    org: "Enseignant clinicien référent — CHU partenaire",
    url: "",
    published: "—",
    checked: "—",
    verified: { fr: "Aucune source d'examen clinique sous licence adaptée n'a été retenue : la grille utilisée est un brouillon structuré à remplacer par la grille validée par la faculté.", en: "No suitably licensed clinical-examination source was adopted: the checklist used is a structured draft, to be replaced by the faculty's approved checklist." },
    licence: { fr: "À définir par la faculté.", en: "To be defined by the faculty." },
    permissionNeeded: false,
  },
};

export const sourceById = (id: string) => SOURCES[id];
