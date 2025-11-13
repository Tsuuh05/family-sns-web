import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
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
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "fullName", "avatarUrl"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.familyId !== undefined) {
      values.familyId = user.familyId;
      updateSet.familyId = user.familyId;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
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

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserProfile(user: {
  openId: string;
  email: string;
  fullName: string;
  familyId: number;
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

export async function markInviteCodeAsUsed(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(inviteCodes).set({ isUsed: true }).where(eq(inviteCodes.id, id));
}

// Family helpers
export async function getFamilyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(families).where(eq(families.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFamilyMembers(familyId: number) {
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

export async function getPostsByFamilyId(familyId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: posts.id,
    userId: posts.userId,
    familyId: posts.familyId,
    content: posts.content,
    imageUrl: posts.imageUrl,
    createdAt: posts.createdAt,
    author: {
      id: users.id,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    },
  })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.familyId, familyId))
    .orderBy(desc(posts.createdAt));
  return result;
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    id: posts.id,
    userId: posts.userId,
    familyId: posts.familyId,
    content: posts.content,
    imageUrl: posts.imageUrl,
    createdAt: posts.createdAt,
    author: {
      id: users.id,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    },
  })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deletePost(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(posts).where(and(eq(posts.id, id), eq(posts.userId, userId)));
}

// Comment helpers
export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(comment);
  return result;
}

export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: comments.id,
    postId: comments.postId,
    userId: comments.userId,
    content: comments.content,
    createdAt: comments.createdAt,
    author: {
      id: users.id,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    },
  })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));
  return result;
}

export async function deleteComment(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(comments).where(and(eq(comments.id, id), eq(comments.userId, userId)));
}
