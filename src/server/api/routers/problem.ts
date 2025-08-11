import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const problemRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const problems = await (ctx.db as any).problem.findMany({
      select: {
        id: true,
        title: true,
        difficulty: true,
        tags: true,
        description: true,
        examples: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return problems;
  }),
  byId: publicProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
    const problem = await (ctx.db as any).problem.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        title: true,
        difficulty: true,
        tags: true,
        description: true,
        examples: true,
        createdAt: true,
      },
    });
    return problem ?? null;
  }),

  submit: protectedProcedure
    .input(
      z.object({
        problemId: z.string().min(1),
        language: z.string().min(1),
        code: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const created = await (ctx.db as any).submission.create({
        data: {
          userId: ctx.session.user.id,
          problemId: input.problemId,
          language: input.language,
          code: input.code,
        },
        select: { id: true, createdAt: true },
      });
      return created;
    }),
});
