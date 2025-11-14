import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, users, 
  families, InsertFamily,
  inviteCodes, InsertInviteCode,
  posts, InsertPost,
  comments, InsertComment
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, {
        ssl: { rejectUnauthorized: false },
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      _db = drizzle(client);
      console.log('[Database] Connected successfully');
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const existing = await getUserByOpenId(user.openId);
    
    if (existing) {
      // Update existing user
      const updateData: Partial<InsertUser> = {};
      
      if (user.name !== undefined) updateData.name = user.name;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
      if (user.fullName !== undefined) updateData.fullName = user.fullName;
      if (user.avatarUrl !== undefined) updateData.avatarUrl = user.avatarUrl;
      if (user.familyId !== undefined) updateData.familyId = user.familyId;
      if (user.role !== undefined) updateData.role = user.role;
      if (user.lastSignedIn !== undefined) updateData.lastSignedIn = user.lastSignedIn;
      
      updateData.updatedAt = new Date();
      
      if (Object.keys(updateData).length > 0) {
        await db.update(users)
          .set(updateData)
          .where(eq(users.openId, user.openId));
      }
    } else {
      // Insert new user
      const insertData: InsertUser = {
        openId: user.openId,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        familyId: user.familyId,
        role: user.role || (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
        lastSignedIn: user.lastSignedIn || new Date(),
      };
      
      await db.insert(users).values(insertData);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserProfile(user: {
  openId: string;
  email: string;
  fullName: string;
  familyId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(users).values({
    openId: user.openId,
    email: user.email,
    fullName: user.fullName,
    familyId: user.familyId,
    role: 'user',
    lastSignedIn: new Date(),
  });
}

// Invite code helpers
export async function getInviteCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markInviteCodeAsUsed(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(inviteCodes).set({ isUsed: true }).where(eq(inviteCodes.id, id));
}

// Family helpers
export async function getFamilyById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(families).where(eq(families.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFamilyMembers(familyId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.familyId, familyId));
}

// Post helpers
export async function createPost(post: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(posts).values(post);
  return result;
}

export async function getPostsByFamilyId(familyId: string) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: posts.id,
    authorId: posts.authorId,
    familyId: posts.familyId,
    content: posts.content,
    imageUrl: posts.imageUrl,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    author: {
      id: users.id,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    },
  })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.familyId, familyId))
    .orderBy(desc(posts.createdAt));
  return result;
}

export async function getPostById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    id: posts.id,
    authorId: posts.authorId,
    familyId: posts.familyId,
    content: posts.content,
    imageUrl: posts.imageUrl,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    author: {
      id: users.id,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    },
  })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deletePost(id: string, userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(posts).where(and(eq(posts.id, id), eq(posts.authorId, userId)));
}

// Comment helpers
export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(comment);
  return result;
}

export async function getCommentsByPostId(postId: string) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: comments.id,
    postId: comments.postId,
    authorId: comments.authorId,
    content: comments.content,
    createdAt: comments.createdAt,
    updatedAt: comments.updatedAt,
    author: {
      id: users.id,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    },
  })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));
  return result;
}

export async function deleteComment(id: string, userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(comments).where(and(eq(comments.id, id), eq(comments.authorId, userId)));
}
