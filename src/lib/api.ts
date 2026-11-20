import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/auth/session";

/** Wrap a route handler with uniform error handling. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: "Données invalides", issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 422 });
      console.error(e);
      return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
    }
  };
}
