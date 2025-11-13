import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { supabase } from "./supabaseClient";
import { getDb, upsertUser, getUserByOpenId } from "./db";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";

export const authRouter = router({
  // Sign up with email and password
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(1),
        inviteCode: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 1. Validate invite code
      const { inviteCodes, families } = await import("../drizzle/schema");
      const inviteResult = await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, input.inviteCode))
        .limit(1);

      if (inviteResult.length === 0) {
        throw new Error("Invalid invite code");
      }

      const invite = inviteResult[0];
      if (invite.isUsed) {
        throw new Error("Invite code already used");
      }

      // 2. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || "Failed to create user");
      }

      // 3. Create user profile in database
      await db.insert(users).values({
        openId: authData.user.id,
        email: input.email,
        fullName: input.fullName,
        familyId: invite.familyId,
        loginMethod: "email",
      });

      // 4. Mark invite code as used
      await db
        .update(inviteCodes)
        .set({ isUsed: true })
        .where(eq(inviteCodes.id, invite.id));

      return {
        success: true,
        user: authData.user,
      };
    }),

  // Sign in with email and password
  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error || !data.user) {
        throw new Error(error?.message || "Failed to sign in");
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    }),

  // Get current user
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return ctx.user;
  }),

  // Sign out
  signOut: publicProcedure.mutation(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    return { success: true };
  }),
});
