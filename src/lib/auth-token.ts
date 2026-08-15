import { auth } from "@/lib/firebase/config";

export async function getRequiredIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  return user.getIdToken();
}
