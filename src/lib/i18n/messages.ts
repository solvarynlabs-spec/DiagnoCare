/**
 * English versions of server messages (API errors, notifications). The server stores and
 * returns French; screens translate known messages when the interface is in English.
 */
const EXACT: Record<string, string> = {
  "Authentification requise": "Sign-in required",
  "Cas introuvable": "Case not found",
  "Ce cas nécessite la formule Étudiant Pro ou un abonnement de faculté.": "This case requires the Student Pro plan or a faculty subscription.",
  "Ce devoir ne vous appartient pas": "This assignment isn't yours",
  "Ce devoir ne vous est pas destiné": "This assignment isn't for you",
  "Ce groupe ne vous appartient pas": "This group isn't yours",
  "Cette consultation a déjà été soumise": "This consultation has already been submitted",
  "Cette consultation est clôturée": "This consultation is closed",
  "Consultation clôturée": "Consultation closed",
  "Consultation introuvable": "Consultation not found",
  "Devoir introuvable": "Assignment not found",
  "Droit de validation clinique requis": "Clinical review permission required",
  "Enseignant introuvable dans votre faculté": "Teacher not found in your faculty",
  "Entrez un numéro de mobile algérien valide (ex. 0550 12 34 56).": "Enter a valid Algerian mobile number (e.g. 0550 12 34 56).",
  "Groupe introuvable": "Group not found",
  "L'adresse e-mail ne correspond pas à votre compte.": "The email address doesn't match your account.",
  "Les rapports PDF sont inclus dans les formules Étudiant Pro et Faculté.": "PDF reports are included in the Student Pro and Faculty plans.",
  "Mot de passe incorrect.": "Incorrect password.",
  "Mot de passe actuel incorrect": "Current password is incorrect",
  "Rapport introuvable": "Report not found",
  "Seul l'auteur ou un administrateur peut modifier ce cas": "Only the author or an administrator can edit this case",
  "Seuls les brouillons peuvent être soumis à validation": "Only drafts can be submitted for review",
  "Seuls les cas publiés (validés par un expert) peuvent être assignés": "Only published (expert-reviewed) cases can be assigned",
  "Soumettez d'abord le cas à validation": "Submit the case for review first",
  "Un autre cas utilise déjà cet identifiant": "Another case already uses this identifier",
  "Un enseignant ne peut créer que ses propres groupes": "A teacher can only create their own groups",
  "Un utilisateur avec cet e-mail existe déjà": "A user with this email already exists",
  "Un compte existe déjà avec cet e-mail": "An account already exists with this email",
  "Utilisateur introuvable": "User not found",
  "Votre accès est géré par votre faculté.": "Your access is managed by your faculty.",
  "Votre compte n'est rattaché à aucune faculté": "Your account isn't linked to a faculty",
  "Vous n'avez pas l'autorisation pour cette action": "You don't have permission for this action",
  "Vous ne pouvez assigner qu'à vos propres groupes": "You can only assign to your own groups",
  "Vous ne pouvez pas désactiver ou rétrograder votre propre compte": "You can't deactivate or demote your own account",
  "Examen inconnu": "Unknown examination",
  "Examen complémentaire inconnu": "Unknown investigation",
  "Numéro de téléphone requis pour le paiement SofizPay.": "A phone number is required for SofizPay payment.",
  "Envoi de l'e-mail impossible pour le moment": "The email can't be sent right now",
  "La connexion de démonstration est désactivée": "Demo sign-in is disabled",
  "Données de démonstration absentes. Lancez npm run db:seed.": "Demo data missing. Run npm run db:seed.",
  "E-mail ou mot de passe incorrect": "Incorrect email or password",
  "Trop d'inscriptions depuis cette adresse. Réessayez plus tard.": "Too many sign-ups from this address. Try again later.",
  "Lien invalide ou expiré. Refaites une demande.": "Invalid or expired link. Please request a new one.",
  "Trop de demandes, réessayez plus tard.": "Too many requests, try again later.",
  "Limite de la démo atteinte — créez un compte gratuit pour continuer.": "Demo limit reached — create a free account to continue.",
  "Vous envoyez des messages trop vite.": "You're sending messages too fast.",
  "Données invalides": "Invalid data",
  "Au moins 10 caractères": "At least 10 characters",
  "Au moins une lettre": "At least one letter",
  "Au moins un chiffre": "At least one number",
  "Vous devez accepter les conditions et l'avertissement d'usage pédagogique": "You must accept the terms and the educational-use disclaimer",
  "Indiquez le nom et la qualité de l'expert": "Enter the expert's name and title",
  "Écrivez au moins un court message": "Write at least a short message",
  "Indiquez votre diagnostic final": "Enter your final diagnosis",
  "Certaines réponses de ce cas de démonstration n'existent qu'en anglais. Le mode IA traduit toutes les réponses.": "Some answers in this demo case exist only in English. AI mode translates every answer.",
  "Erreur interne du serveur": "Internal server error",
  "Connexion au serveur impossible. Vérifiez votre connexion internet puis réessayez.": "Can't reach the server. Check your internet connection and try again.",
  "Contenu de démonstration — à faire relire par les experts cliniques de la faculté avant tout usage formel": "Demonstration content — to be reviewed by the faculty's clinical experts before any formal use",
  // Notifications
  "Bienvenue sur DiagnoCare": "Welcome to DiagnoCare",
  "Nouveau retour de votre enseignant": "New feedback from your teacher",
  "Commencez par un cas « Fondamental » pour découvrir le déroulé de la consultation.": "Start with a Foundation case to discover how the consultation works.",
  "Créez votre premier groupe et assignez un cas à vos étudiants.": "Create your first group and assign a case to your students.",
  "Votre compte Google est relié. Commencez par un cas « Fondamental ».": "Your Google account is linked. Start with a Foundation case.",
  "Vos nouvelles fonctionnalités sont disponibles.": "Your new features are available.",
  "Merci ! Vos nouvelles fonctionnalités sont disponibles.": "Thank you! Your new features are available.",
};

const PATTERNS: [RegExp, (...m: string[]) => string][] = [
  [/^Votre formule inclut (\d+) simulations par mois\. Passez à une formule supérieure pour continuer\.$/, (n) => `Your plan includes ${n} simulations per month. Upgrade to continue.`],
  [/^Rendu : (.+)$/, (x) => `Submitted: ${x}`],
  [/^Trop de tentatives\. Réessayez dans (\d+) s\.$/, (n) => `Too many attempts. Try again in ${n} s.`],
  [/^Trop de demandes\. Réessayez dans (\d+) s\.$/, (n) => `Too many requests. Try again in ${n} s.`],
  [/^Nouveau devoir : (.+)$/, (x) => `New assignment: ${x}`],
  [/^Paiement reçu — formule (.+) activée$/, (x) => `Payment received — ${x === "Étudiant Pro" ? "Student Pro" : x} plan activated`],
  [/^Ajouté\(e\) au groupe (.+)$/, (x) => `Added to group ${x}`],
  [/^Vous êtes passé\(e\) à la formule (.+)$/, (x) => `You switched to the ${x === "Étudiant Pro" ? "Student Pro" : x === "Gratuit" ? "Free" : x} plan`],
  [/^(.+) a terminé le devoir \((\d+)\/100\)\.$/, (who, s) => `${who} completed the assignment (${s}/100).`],
  [/^Votre compte a été créé par (.+)\. Changez votre mot de passe temporaire\.$/, (who) => `Your account was created by ${who}. Change your temporary password.`],
  [/^La requête a échoué \((\d+)\)$/, (n) => `The request failed (${n})`],
  [/^(.+) a assigné « (.+) » au groupe (.+)\.$/, (who, c, g) => `${who} assigned "${c}" to group ${g}.`],
  [/^(.+) a commenté votre consultation « (.+) »\.$/, (who, c) => `${who} commented on your consultation "${c}".`],
  [/^(.+) vous a ajouté\(e\) à un groupe\.$/, (who) => `${who} added you to a group.`],
];

/** English version of a known French server message (unknown text is returned unchanged). */
export function translateMessage(msg: string, lang: "fr" | "en"): string {
  if (lang !== "en" || !msg) return msg;
  if (EXACT[msg]) return EXACT[msg];
  for (const [re, fn] of PATTERNS) {
    const m = msg.match(re);
    if (m) return fn(...m.slice(1));
  }
  return msg;
}
