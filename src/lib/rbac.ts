/** Role-based access control. The DB `Role.permissions` column is seeded from this matrix. */

export const ROLES = ["STUDENT", "TEACHER", "UNIVERSITY_ADMIN", "PLATFORM_ADMIN"] as const;
export type RoleKey = (typeof ROLES)[number];

export const PERMISSIONS = {
  "simulation:run": "Réaliser des simulations cliniques",
  "report:view_own": "Consulter ses rapports d'évaluation",
  "case:read": "Parcourir la bibliothèque de cas",
  "case:write": "Créer et modifier des cas cliniques",
  "case:review": "Valider (expertise clinique) et publier des cas",
  "assignment:manage": "Créer et gérer des devoirs",
  "student:review": "Relire les consultations des étudiants et commenter",
  "group:manage": "Gérer les groupes d'étudiants",
  "institution:manage": "Gérer enseignants, étudiants et programmes de la faculté",
  "institution:analytics": "Statistiques de la faculté",
  "platform:users": "Gérer tous les utilisateurs",
  "platform:subscriptions": "Gérer les abonnements",
  "platform:settings": "Gérer les réglages IA et plateforme",
  "platform:analytics": "Statistiques de la plateforme",
  "audit:read": "Consulter le journal d'audit",
} as const;
export type Permission = keyof typeof PERMISSIONS;

export const PERMISSIONS_EN: Record<Permission, string> = {
  "simulation:run": "Run clinical simulations",
  "report:view_own": "View your own evaluation reports",
  "case:read": "Browse the case library",
  "case:write": "Create and edit clinical cases",
  "case:review": "Review (clinical expertise) and publish cases",
  "assignment:manage": "Create and manage assignments",
  "student:review": "Review students' consultations and comment",
  "group:manage": "Manage student groups",
  "institution:manage": "Manage the faculty's teachers, students and programs",
  "institution:analytics": "Faculty statistics",
  "platform:users": "Manage all users",
  "platform:subscriptions": "Manage subscriptions",
  "platform:settings": "Manage AI and platform settings",
  "platform:analytics": "Platform statistics",
  "audit:read": "View the audit log",
};

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  STUDENT: ["simulation:run", "report:view_own", "case:read"],
  TEACHER: ["simulation:run", "report:view_own", "case:read", "case:write", "case:review", "assignment:manage", "student:review", "group:manage"],
  UNIVERSITY_ADMIN: ["case:read", "case:write", "case:review", "assignment:manage", "student:review", "group:manage", "institution:manage", "institution:analytics", "audit:read"],
  PLATFORM_ADMIN: Object.keys(PERMISSIONS) as Permission[],
};

export const ROLE_META: Record<RoleKey, { label: string; labelEn: string; home: string; description: string; descriptionEn: string }> = {
  STUDENT: { label: "Étudiant", labelEn: "Student", home: "/app", description: "Réaliser des simulations, consulter ses évaluations et suivre sa progression.", descriptionEn: "Run simulations, view evaluations and track progress." },
  TEACHER: { label: "Enseignant", labelEn: "Teacher", home: "/teach", description: "Rédiger des cas, assigner des simulations et suivre les étudiants.", descriptionEn: "Write cases, assign simulations and follow students." },
  UNIVERSITY_ADMIN: { label: "Administrateur de faculté", labelEn: "Faculty administrator", home: "/institution", description: "Gérer enseignants, étudiants, groupes et programmes.", descriptionEn: "Manage teachers, students, groups and programs." },
  PLATFORM_ADMIN: { label: "Administrateur plateforme", labelEn: "Platform administrator", home: "/admin", description: "Gérer utilisateurs, abonnements, contenus et réglages IA.", descriptionEn: "Manage users, subscriptions, content and AI settings." },
};

export function can(role: string, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role as RoleKey] ?? []).includes(permission);
}

export function isRole(value: string): value is RoleKey {
  return (ROLES as readonly string[]).includes(value);
}
