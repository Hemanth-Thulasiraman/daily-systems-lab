import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a Socratic engineering tutor for Daily Systems Lab, a platform that teaches System Design, Cloud Engineering, DevOps, AI/ML, and LLM concepts.

Your teaching style:
- Start with questions to probe understanding before giving explanations
- Use concrete, real-world analogies and production examples
- When a user seems confused, simplify and build from first principles
- Give hints instead of direct answers when the user is trying to solve a problem
- Connect concepts to each other (e.g., how caching relates to CAP theorem)
- Reference specific AWS/GCP/Azure services when discussing cloud concepts
- Keep responses focused and scannable — use bullet points and short paragraphs
- If asked about a concept outside the platform's scope, briefly answer but redirect to related platform topics

Format guidelines:
- Use **bold** for key terms on first use
- Use \`code\` for specific commands, values, service names
- Use numbered lists for step-by-step processes
- Keep responses under 400 words unless a deep explanation is explicitly requested`;

async function buildConceptContext(conceptId: string): Promise<string> {
  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: {
      title: true,
      simpleExplanation: true,
      deepDive: true,
      commonTradeoffs: true,
      commonMistakes: true,
      practicalUsage: true,
    },
  });
  if (!concept) return "";
  return `\n\nThe user is currently studying: **${concept.title}**\n\nConcept summary:\n${concept.simpleExplanation}\n\nKey details:\n${concept.deepDive.slice(0, 800)}\n\nTradeoffs: ${concept.commonTradeoffs.join("; ")}\n\nFocus your answers on this concept and its connections to related topics.`;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("dsl_guest_id")?.value;
  if (!userId) return Response.json({ error: "No session" }, { status: 401 });

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, name: "Guest" },
  });

  const { message, conceptId } = (await request.json()) as {
    message: string;
    conceptId?: string;
  };

  if (!message?.trim()) return Response.json({ error: "Empty message" }, { status: 400 });

  // Load recent history (last 10 messages)
  const history = await prisma.chatMessage.findMany({
    where: { userId, ...(conceptId ? { conceptId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  history.reverse();

  // Save user message
  await prisma.chatMessage.create({
    data: { userId, conceptId, role: "user", content: message },
  });

  const conceptContext = conceptId ? await buildConceptContext(conceptId) : "";
  const systemPrompt = SYSTEM_PROMPT + conceptContext;

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  // Stream response
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        // Save assistant response
        await prisma.chatMessage.create({
          data: { userId, conceptId, role: "assistant", content: fullResponse },
        });

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("dsl_guest_id")?.value;
  if (!userId) return Response.json({ messages: [] });

  const { searchParams } = new URL(request.url);
  const conceptId = searchParams.get("conceptId") ?? undefined;

  const messages = await prisma.chatMessage.findMany({
    where: { userId, ...(conceptId ? { conceptId } : {}) },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return Response.json({ messages });
}
