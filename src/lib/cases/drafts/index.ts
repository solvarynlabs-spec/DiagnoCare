/**
 * Source-traceable DRAFT cases (« Brouillon — relecture par un enseignant clinicien requise »).
 * Seeded with status IN_REVIEW, create-only, so an educator's edits and approval survive
 * re-seeding. Approval = the existing review workflow (IN_REVIEW → PUBLISHED with attestation).
 */
import { buildCase } from "./build";
import { DRAFT_CASES_A } from "./cases-a";
import { DRAFT_CASES_B } from "./cases-b";

const BUILT = [...DRAFT_CASES_A, ...DRAFT_CASES_B].map(buildCase);

export const DRAFT_CASES = BUILT.map((x) => x.demo);
export const DRAFT_CASES_EN = Object.fromEntries(BUILT.map((x) => [x.demo.slug, x.en]));
export const DRAFT_SLUGS = new Set(DRAFT_CASES.map((c) => c.slug));
