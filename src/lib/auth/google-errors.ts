/** Google sign-in error messages shown on the login page: [French, English]. */
export const GOOGLE_ERRORS: Record<string, [string, string]> = {
  google_config: ["La connexion avec Google n'est pas encore configurée sur ce serveur. Utilisez votre e-mail.", "Google sign-in isn't configured on this server yet. Use your email."],
  google_cancelled: ["Connexion Google annulée.", "Google sign-in cancelled."],
  google_state: ["La session de connexion Google a expiré. Réessayez.", "The Google sign-in session expired. Try again."],
  google_failed: ["La connexion avec Google a échoué. Réessayez ou utilisez votre e-mail.", "Google sign-in failed. Try again or use your email."],
  account_disabled: ["Ce compte est désactivé. Contactez votre faculté.", "This account is disabled. Contact your faculty."],
};
