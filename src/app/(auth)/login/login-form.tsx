"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type FormState } from "@/server/modules/auth/actions";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { t } from "@/i18n";

const initial: FormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form
      action={action}
      className="space-y-4 rounded-xl border border-black/10 p-6 dark:border-white/10"
    >
      <h1 className="text-lg font-semibold">{t.signIn}</h1>
      <FormError message={state.error} />
      <Field label={t.email} type="email" name="email" autoComplete="email" required />
      <Field
        label={t.password}
        type="password"
        name="password"
        autoComplete="current-password"
        required
      />
      <SubmitButton pending={pending}>{t.signIn}</SubmitButton>
      <p className="text-center text-sm text-foreground/60">
        {t.noAccount}{" "}
        <Link href="/signup" className="underline">
          {t.createOne}
        </Link>
      </p>
    </form>
  );
}
