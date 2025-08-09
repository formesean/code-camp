import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const problemRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    // @ts-expect-error Prisma client may not be generated yet; run `pnpm prisma generate` after schema changes
    const problems = await ctx.db.problem.findMany({
      select: {
        id: true,
        title: true,
        difficulty: true,
        tags: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return problems;
  }),
});
