import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getOrCreateGuestUser(): Promise<string> {
  const cookieStore = await cookies();
  const guestId = cookieStore.get("dsl_guest_id")?.value;

  if (!guestId) throw new Error("No guest ID cookie found");

  await prisma.user.upsert({
    where: { id: guestId },
    update: {},
    create: { id: guestId, name: "Guest" },
  });

  return guestId;
}
