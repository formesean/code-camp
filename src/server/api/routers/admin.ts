import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const adminRouter = createTRPCRouter({
  claimFirstAdmin: protectedProcedure.mutation(async ({ ctx }) => {
    // If an admin already exists, block claiming
    const existingAdminCount = await ctx.db.user.count({
      where: { role: "admin" as any },
    });

    if (existingAdminCount > 0) {
      throw new TRPCError({ code: "CONFLICT", message: "Admin already claimed" });
    }

    // Promote current user to admin
    const updated = await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { role: "admin" as any },
      select: { id: true, role: true },
    });

    return updated;
  }),
});
