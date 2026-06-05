import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/lib/auth";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <SignupForm />;
}
