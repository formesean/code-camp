import { GoogleGenerativeAI } from "@google/generative-ai";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const adminRouter = createTRPCRouter({
  generateProblem: adminProcedure
    .input(z.object({ prompt: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const schema = z.object({
        title: z.string(),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        tags: z.array(z.string()).min(1).max(5),
        description: z.string(),
        examples: z
          .array(
            z.object({
              input: z.string(),
              output: z.string(),
              explanation: z.string(),
            }),
          )
          .min(1),
      });

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        You are a coding problem generator for programming contests.
        Respond ONLY with valid JSON matching this schema:
        {
          "title": string,
          "difficulty": "Easy" | "Medium" | "Hard",
          "tags": string[], // 1–5 items, simple words
          "description": string,
          "examples": [
            { "input": string, "output": string, "explanation": string }
          ]
        }

        Rules:
        - No markdown
        - No explanations outside JSON
        - Description must be concise
        - Examples must be short and relevant

        Prompt:
        ${input.prompt}
      `;

      let text: string;
      try {
        const result = await model.generateContent(prompt);
        text = result.response.text().trim();
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Gemini API error: ${String(err)}`,
        });
      }

      // Clean JSON before parsing
      let parsed: unknown;
      try {
        let cleaned = text.replace(/,\s*(\}|\])/g, "$1");
        cleaned = cleaned.replace(/"([^"\\]*(\\.[^"\\]*)*)"/gs, (match) =>
          match.replace(/\n/g, "\\n"),
        );

        parsed = JSON.parse(cleaned);
      } catch (err) {
        console.error("Failed to parse JSON from Gemini:", text);
        throw new TRPCError({
          code: "PARSE_ERROR",
          message: `Failed to parse Gemini response as JSON: ${String(err)}`,
        });
      }

      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid response shape from Gemini: ${validated.error.message}`,
        });
      }

      return validated.data;
    }),

  createProblem: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        tags: z.array(z.string()).min(1),
        description: z.string().min(1),
        examples: z
          .array(z.object({ input: z.string(), output: z.string(), explanation: z.string() }))
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const created = await (ctx.db as any).problem.create({
        data: {
          title: input.title,
          difficulty: input.difficulty as any,
          tags: input.tags,
          description: input.description,
          examples: input.examples as unknown as any,
        },
        select: { id: true },
      });
      return created;
    }),

  getUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
  }),

  claimFirstAdmin: protectedProcedure.mutation(async ({ ctx }) => {
    const existingAdminCount = await ctx.db.user.count({
      where: { role: "admin" as any },
    });

    if (existingAdminCount > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Admin already claimed",
      });
    }

    return ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { role: "admin" as any },
      select: { id: true, role: true },
    });
  }),
});
