import { prisma } from "@/lib/prisma";

export async function GET() {
  const concepts = await prisma.concept.findMany({
    select: { id: true, slug: true, title: true, category: true },
    orderBy: { publishedAt: "asc" },
  });
  return Response.json({ concepts });
}
