import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { supabase } from "./supabaseClient";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    // Get current user
    me: publicProcedure.query(opts => opts.ctx.user),
    
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
        // 1. Validate invite code
        const inviteCodeData = await db.getInviteCodeByCode(input.inviteCode);
        if (!inviteCodeData) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '招待コードが見つかりません' });
        }
        if (inviteCodeData.isUsed) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'この招待コードは既に使用されています' });
        }

        // 2. Create Supabase auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
        });

        if (authError || !authData.user) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: authError?.message || 'ユーザー作成に失敗しました' 
          });
        }

        // 3. Create user profile in database
        await db.createUserProfile({
          openId: authData.user.id,
          email: input.email,
          fullName: input.fullName,
          familyId: inviteCodeData.familyId,
        });

        // 4. Mark invite code as used
        await db.markInviteCodeAsUsed(inviteCodeData.id);

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
          throw new TRPCError({ 
            code: 'UNAUTHORIZED', 
            message: error?.message || 'ログインに失敗しました' 
          });
        }

        return {
          success: true,
          user: data.user,
          session: data.session,
        };
      }),
    
    // Sign out
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    // Validate invite code and get family info
    validateInviteCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const inviteCode = await db.getInviteCodeByCode(input.code);
        if (!inviteCode) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '招待コードが見つかりません' });
        }
        if (inviteCode.isUsed) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'この招待コードは既に使用されています' });
        }
        const family = await db.getFamilyById(inviteCode.familyId);
        return {
          valid: true,
          familyName: family?.name || '不明な家族',
        };
      }),
  }),

  // Family management
  families: router({
    // Get current user's family
    getMyFamily: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.familyId) {
        return null;
      }
      return await db.getFamilyById(ctx.user.familyId);
    }),

    // Get family members
    getMembers: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.familyId) {
        return [];
      }
      return await db.getFamilyMembers(ctx.user.familyId);
    }),
  }),

  // Posts management
  posts: router({
    // Get posts for current user's family
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.familyId) {
        return [];
      }
      return await db.getPostsByFamilyId(ctx.user.familyId);
    }),

    // Create a new post
    create: protectedProcedure
      .input(
        z.object({
          content: z.string().min(1),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.familyId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '家族に参加していません' });
        }

        const postId = await db.createPost({
          userId: ctx.user.id,
          familyId: ctx.user.familyId,
          content: input.content,
          imageUrl: input.imageUrl,
        });

        return { success: true, postId };
      }),

    // Get post by ID with comments
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const post = await db.getPostById(input.id);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '投稿が見つかりません' });
        }
        
        // Check if user has access to this post (same family)
        if (post.familyId !== ctx.user.familyId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'この投稿にアクセスする権限がありません' });
        }

        return post;
      }),

    // Delete a post
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.getPostById(input.id);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '投稿が見つかりません' });
        }
        
        // Only post owner can delete
        if (post.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'この投稿を削除する権限がありません' });
        }

        await db.deletePost(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Comments management
  comments: router({
    // Get comments for a post
    list: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify user has access to the post
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '投稿が見つかりません' });
        }
        if (post.familyId !== ctx.user.familyId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'この投稿にアクセスする権限がありません' });
        }

        return await db.getCommentsByPostId(input.postId);
      }),

    // Create a comment
    create: protectedProcedure
      .input(
        z.object({
          postId: z.number(),
          content: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify user has access to the post
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '投稿が見つかりません' });
        }
        if (post.familyId !== ctx.user.familyId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'この投稿にアクセスする権限がありません' });
        }

        const commentId = await db.createComment({
          postId: input.postId,
          userId: ctx.user.id,
          content: input.content,
        });

        return { success: true, commentId };
      }),

    // Delete a comment
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const comments = await db.getCommentsByPostId(input.id);
        const comment = comments.find(c => c.id === input.id);
        if (!comment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'コメントが見つかりません' });
        }
        
        // Only comment owner can delete
        if (comment.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'このコメントを削除する権限がありません' });
        }

        await db.deleteComment(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
