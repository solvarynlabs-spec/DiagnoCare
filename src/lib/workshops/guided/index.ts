import type { GuidedWorkshop } from "./types";
import { GUIDED_A } from "./workshops-a";
import { GUIDED_B } from "./workshops-b";

/** Source-traceable guided workshops (drafts until a clinical educator sets `review.status` to "approved"). */
export const GUIDED_WORKSHOPS: GuidedWorkshop[] = [...GUIDED_A, ...GUIDED_B];
export const guidedBySlug = (slug: string) => GUIDED_WORKSHOPS.find((w) => w.slug === slug);
