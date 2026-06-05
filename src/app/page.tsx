import { redirect } from "next/navigation";

export default function Home() {
  // Phase 1 will redirect to /login when unauthenticated.
  redirect("/dashboard");
}
