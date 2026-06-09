import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? "/choose" : "/login");
}
