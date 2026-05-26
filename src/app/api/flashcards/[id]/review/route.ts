import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { calculateNextReview, type Rating } from "@/lib/sm2";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get("dsl_guest_id")?.value;

  if (!userId) return Response.json({ error: "No session" }, { status: 401 });

  const { rating } = (await request.json()) as { rating: Rating };
  if (!["again", "hard", "good", "easy"].includes(rating)) {
    return Response.json({ error: "Invalid rating" }, { status: 400 });
  }

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, name: "Guest" },
  });

  const existing = await prisma.userFlashcardProgress.findUnique({
    where: { userId_flashcardId: { userId, flashcardId: id } },
  });

  const currentState = {
    repetitions: existing?.repetitions ?? 0,
    easeFactor: existing?.easeFactor ?? 2.5,
    interval: existing?.interval ?? 1,
  };

  const next = calculateNextReview(currentState, rating);

  const progress = await prisma.userFlashcardProgress.upsert({
    where: { userId_flashcardId: { userId, flashcardId: id } },
    update: {
      repetitions: next.repetitions,
      easeFactor: next.easeFactor,
      interval: next.interval,
      nextReviewAt: next.nextReviewAt,
      lastRating: rating,
    },
    create: {
      userId,
      flashcardId: id,
      repetitions: next.repetitions,
      easeFactor: next.easeFactor,
      interval: next.interval,
      nextReviewAt: next.nextReviewAt,
      lastRating: rating,
    },
  });

  return Response.json({ progress, nextReviewAt: next.nextReviewAt });
}
