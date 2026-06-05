"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type FormState } from "@/server/modules/auth/actions";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { t } from "@/i18n";

const initial: FormState = {};

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initial);

  return (
    <form
      action={action}
      className="space-y-4 rounded-xl border border-black/10 p-6 dark:border-white/10"
    >
      <h1 className="text-lg font-semibold">{t.createAccount}</h1>
      <FormError message={state.error} />
      <Field label={t.companyName} name="companyName" required />
      <Field label={t.yourName} name="name" autoComplete="name" required />
      <Field label={t.email} type="email" name="email" autoComplete="email" required />
      <Field
        label={t.password}
        type="password"
        name="password"
        autoComplete="new-password"
        required
      />
      <SubmitButton pending={pending}>{t.createAccount}</SubmitButton>
      <p className="text-center text-sm text-foreground/60">
        {t.haveAccount}{" "}
        <Link href="/login" className="underline">
          {t.signIn}
        </Link>
      </p>
    </form>
  );
}
