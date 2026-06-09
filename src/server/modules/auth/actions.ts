"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { setSessionCookie, clearSessionCookie } from "@/server/lib/session";
import { signupSchema, loginSchema } from "./auth.schema";
import { signup, login, AuthError } from "./auth.service";

export interface FormState {
  error?: string;
}

export async function signupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).formErrors[0] ?? "Invalid input" };
  }

  try {
    const session = await signup(parsed.data);
    await setSessionCookie(session);
  } catch (err) {
    // Unique email collision surfaces as a Prisma error.
    if (err instanceof AuthError) return { error: err.message };
    return { error: "Could not create account. That email may already be in use." };
  }

  redirect("/choose");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).formErrors[0] ?? "Invalid input" };
  }

  try {
    const session = await login(parsed.data);
    await setSessionCookie(session);
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }

  // Let the user pick desktop (office) or mobile (field) after each sign-in.
  redirect("/choose");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
