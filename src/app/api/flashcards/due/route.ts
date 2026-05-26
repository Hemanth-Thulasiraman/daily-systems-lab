import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("dsl_guest_id")?.value ?? null;
}

async function ensureUser(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, name: "Guest" },
  });
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return Response.json({ cards: [] });

  await ensureUser(userId);

  const now = new Date();

  // Get all flashcards
  const allCards = await prisma.flashcard.findMany({
    include: {
      concept: { select: { title: true, slug: true, category: true } },
      userProgress: { where: { userId } },
    },
  });

  // A card is due if: no progress (new) OR nextReviewAt <= now
  const dueCards = allCards.filter((card) => {
    const progress = card.userProgress[0];
    if (!progress) return true;
    return progress.nextReviewAt <= now;
  });

  const result = dueCards.map((card) => {
    const progress = card.userProgress[0];
    return {
      id: card.id,
      front: card.front,
      back: card.back,
      tag: card.tag,
      difficulty: card.difficulty,
      concept: card.concept,
      isNew: !progress,
      repetitions: progress?.repetitions ?? 0,
      easeFactor: progress?.easeFactor ?? 2.5,
      interval: progress?.interval ?? 1,
    };
  });

  return Response.json({ cards: result, total: allCards.length });
}
