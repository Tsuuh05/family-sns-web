# 家族向け SNS - 技術仕様書

このドキュメントでは、コードのどの部分を修正すると、どのような変更が反映されるかを詳しく説明します。

## 目次

1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [データベーススキーマ](#データベーススキーマ)
3. [バックエンド API](#バックエンド-api)
4. [フロントエンド UI](#フロントエンド-ui)
5. [カスタマイズガイド](#カスタマイズガイド)
6. [新機能の追加方法](#新機能の追加方法)

---

## アーキテクチャ概要

このアプリケーションは、以下の技術スタックで構築されています。

### 技術スタック

| レイヤー | 技術 | 説明 |
|---|---|---|
| **フロントエンド** | React 19 + TypeScript | ユーザーインターフェース |
| **スタイリング** | Tailwind CSS 4 | デザインとレイアウト |
| **UI コンポーネント** | shadcn/ui | 再利用可能な UI 部品 |
| **バックエンド** | Express 4 + tRPC 11 | API サーバー |
| **データベース** | Supabase (PostgreSQL) | データ保存 |
| **認証** | Manus OAuth | ユーザー認証 |
| **ホスティング** | Vercel | Web アプリのホスティング |

### データフロー

```
ユーザー（ブラウザ）
    ↓
フロントエンド（React）
    ↓
tRPC クライアント
    ↓
バックエンド（Express + tRPC）
    ↓
データベース（Supabase）
```

フロントエンドとバックエンドは、tRPC を通じて型安全に通信します。これにより、API の型が自動的に推論され、開発効率が向上します。

---

## データベーススキーマ

データベースには、以下の5つのテーブルがあります。

### テーブル一覧

| テーブル名 | 説明 | 主要な列 |
|---|---|---|
| `users` | ユーザー情報 | id, openId, name, email, familyId, fullName |
| `families` | 家族グループ | id, name, createdAt |
| `inviteCodes` | 招待コード | id, code, familyId, isUsed |
| `posts` | 投稿 | id, userId, familyId, content, imageUrl |
| `comments` | コメント | id, postId, userId, content |

### テーブル詳細

#### users テーブル

ユーザーの基本情報を保存します。

| 列名 | 型 | 説明 | 編集すると |
|---|---|---|---|
| `id` | INTEGER | ユーザー ID（自動採番） | 編集不可 |
| `openId` | VARCHAR(64) | Manus OAuth の識別子 | 編集不可 |
| `name` | TEXT | OAuth から取得した名前 | 表示名が変わる |
| `email` | VARCHAR(320) | メールアドレス | 通知先が変わる |
| `familyId` | INTEGER | 所属する家族の ID | 閲覧できる投稿が変わる |
| `fullName` | TEXT | フルネーム（日本語） | 投稿者名として表示される |
| `avatarUrl` | TEXT | アバター画像の URL | プロフィール画像が変わる |
| `role` | ENUM | ユーザーの役割（user/admin） | 管理者権限が変わる |

**編集例:**

```sql
-- ユーザーの名前を変更
UPDATE users SET "fullName" = '山田 花子' WHERE id = 1;

-- ユーザーを別の家族に移動
UPDATE users SET "familyId" = 2 WHERE id = 1;
```

#### families テーブル

家族グループの情報を保存します。

| 列名 | 型 | 説明 | 編集すると |
|---|---|---|---|
| `id` | INTEGER | 家族 ID（自動採番） | 編集不可 |
| `name` | TEXT | 家族の名前 | ヘッダーに表示される名前が変わる |
| `createdAt` | TIMESTAMP | 作成日時 | 編集不要 |

**編集例:**

```sql
-- 家族名を変更
UPDATE families SET name = '山田ファミリー' WHERE id = 1;
```

#### inviteCodes テーブル

招待コードを管理します。

| 列名 | 型 | 説明 | 編集すると |
|---|---|---|---|
| `id` | INTEGER | 招待コード ID（自動採番） | 編集不可 |
| `code` | VARCHAR(64) | 招待コード | 新規登録時に入力するコードが変わる |
| `familyId` | INTEGER | 紐づく家族の ID | どの家族に参加するかが変わる |
| `isUsed` | BOOLEAN | 使用済みフラグ | 再利用可否が変わる |

**編集例:**

```sql
-- 新しい招待コードを追加
INSERT INTO "inviteCodes" (code, "familyId") VALUES ('NEWCODE2024', 1);

-- 招待コードを再利用可能にする
UPDATE "inviteCodes" SET "isUsed" = FALSE WHERE code = 'HOTTA0217';
```

#### posts テーブル

投稿を保存します。

| 列名 | 型 | 説明 | 編集すると |
|---|---|---|---|
| `id` | INTEGER | 投稿 ID（自動採番） | 編集不可 |
| `userId` | INTEGER | 投稿者の ID | 投稿者が変わる |
| `familyId` | INTEGER | 家族 ID | 閲覧できる家族が変わる |
| `content` | TEXT | 投稿内容 | 表示されるテキストが変わる |
| `imageUrl` | TEXT | 画像の URL | 表示される画像が変わる |
| `createdAt` | TIMESTAMP | 投稿日時 | 投稿の順序が変わる |

**編集例:**

```sql
-- 投稿内容を修正
UPDATE posts SET content = '修正後の内容' WHERE id = 1;

-- 投稿を別の家族に移動
UPDATE posts SET "familyId" = 2 WHERE id = 1;

-- 投稿を削除
DELETE FROM posts WHERE id = 1;
```

#### comments テーブル

コメントを保存します。

| 列名 | 型 | 説明 | 編集すると |
|---|---|---|---|
| `id` | INTEGER | コメント ID（自動採番） | 編集不可 |
| `postId` | INTEGER | 投稿 ID | どの投稿へのコメントかが変わる |
| `userId` | INTEGER | コメント投稿者の ID | コメント投稿者が変わる |
| `content` | TEXT | コメント内容 | 表示されるテキストが変わる |
| `createdAt` | TIMESTAMP | コメント日時 | コメントの順序が変わる |

**編集例:**

```sql
-- コメント内容を修正
UPDATE comments SET content = '修正後のコメント' WHERE id = 1;

-- コメントを削除
DELETE FROM comments WHERE id = 1;
```

### テーブル間の関係

```
families (家族)
  ├── inviteCodes (招待コード) - familyId で紐づく
  ├── users (ユーザー) - familyId で紐づく
  └── posts (投稿) - familyId で紐づく
       └── comments (コメント) - postId で紐づく
```

---

## バックエンド API

バックエンドの API は、`server/routers.ts` で定義されています。

### API エンドポイント一覧

| エンドポイント | 説明 | 入力 | 出力 |
|---|---|---|---|
| `auth.me` | 現在のユーザー情報を取得 | なし | ユーザー情報 |
| `auth.logout` | ログアウト | なし | 成功フラグ |
| `auth.validateInviteCode` | 招待コードを検証 | code | 家族情報 |
| `auth.updateProfile` | プロフィールを更新 | fullName, familyId | 成功フラグ |
| `families.getMyFamily` | 自分の家族情報を取得 | なし | 家族情報 |
| `families.getMembers` | 家族メンバー一覧を取得 | なし | ユーザー一覧 |
| `posts.create` | 投稿を作成 | content, imageUrl | 成功フラグ |
| `posts.list` | 投稿一覧を取得 | なし | 投稿一覧 |
| `posts.getById` | 投稿詳細を取得 | id | 投稿詳細 |
| `posts.delete` | 投稿を削除 | id | 成功フラグ |
| `comments.create` | コメントを作成 | postId, content | 成功フラグ |
| `comments.listByPostId` | コメント一覧を取得 | postId | コメント一覧 |
| `comments.delete` | コメントを削除 | id | 成功フラグ |

### API の編集方法

**ファイル:** `server/routers.ts`

**編集例 1: 投稿の文字数制限を変更**

```typescript
// 変更前
posts: router({
  create: protectedProcedure
    .input(z.object({
      content: z.string().min(1),  // 最小1文字
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // ...
    }),
}),

// 変更後
posts: router({
  create: protectedProcedure
    .input(z.object({
      content: z.string().min(1).max(500),  // 最大500文字に制限
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // ...
    }),
}),
```

**結果:** 投稿が500文字を超えるとエラーになります。

**編集例 2: 新しい API エンドポイントを追加**

```typescript
// posts ルーターに「いいね」機能を追加
posts: router({
  // 既存のエンドポイント...
  
  // 新規追加
  like: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      
      // likes テーブルに追加（事前にテーブル作成が必要）
      await db.createLike({
        postId: input.postId,
        userId: user.id,
      });
      
      return { success: true };
    }),
}),
```

**結果:** フロントエンドから `trpc.posts.like.useMutation()` で「いいね」を追加できるようになります。

---

## フロントエンド UI

フロントエンドの UI は、`client/src/pages/` フォルダ内のファイルで定義されています。

### ページ一覧

| ファイル | ページ | 説明 | 編集すると |
|---|---|---|---|
| `Auth.tsx` | 認証画面 | ログイン・招待コード入力 | 認証フローが変わる |
| `Home.tsx` | ホーム画面 | 投稿一覧表示 | 投稿の表示方法が変わる |
| `PostDetail.tsx` | 投稿詳細画面 | 投稿とコメントを表示 | コメント表示方法が変わる |

### ページごとの編集ガイド

#### Auth.tsx（認証画面）

**ファイル:** `client/src/pages/Auth.tsx`

**主な機能:**

- ログインボタンの表示
- 招待コード入力フォーム
- 名前入力フォーム

**編集例 1: 招待コード入力欄のプレースホルダーを変更**

```typescript
// 変更前
<Input
  id="inviteCode"
  placeholder="FAMILY2024"
  value={inviteCode}
  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
/>

// 変更後
<Input
  id="inviteCode"
  placeholder="招待コードを入力してください"
  value={inviteCode}
  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
/>
```

**結果:** 入力欄のプレースホルダーテキストが変わります。

**編集例 2: 認証画面の背景色を変更**

```typescript
// 変更前
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">

// 変更後
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
```

**結果:** 背景色が青系から緑系に変わります。

#### Home.tsx（ホーム画面）

**ファイル:** `client/src/pages/Home.tsx`

**主な機能:**

- ヘッダー（家族名、ログアウトボタン）
- 新規投稿ボタン
- 投稿一覧の表示

**編集例 1: 投稿の表示順序を変更**

現在は新しい投稿が上に表示されますが、古い投稿を上に表示するには、バックエンドの `server/db.ts` を編集します。

```typescript
// ファイル: server/db.ts

// 変更前
export async function getPostsByFamilyId(familyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(posts)
    .where(eq(posts.familyId, familyId))
    .orderBy(desc(posts.createdAt));  // 新しい順
}

// 変更後
import { asc } from "drizzle-orm";

export async function getPostsByFamilyId(familyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(posts)
    .where(eq(posts.familyId, familyId))
    .orderBy(asc(posts.createdAt));  // 古い順
}
```

**結果:** 投稿が古い順に表示されます。

**編集例 2: 投稿カードのデザインを変更**

```typescript
// 変更前
<Card key={post.id} className="hover:shadow-md transition-shadow">

// 変更後
<Card key={post.id} className="hover:shadow-lg transition-all border-2 border-blue-200">
```

**結果:** 投稿カードに青い枠線が追加され、ホバー時の影が大きくなります。

**編集例 3: 投稿者のアバターを画像に変更**

```typescript
// 変更前
<div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
  {post.author.fullName.charAt(0)}
</div>

// 変更後
{post.author.avatarUrl ? (
  <img 
    src={post.author.avatarUrl} 
    alt={post.author.fullName}
    className="h-10 w-10 rounded-full object-cover"
  />
) : (
  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
    {post.author.fullName.charAt(0)}
  </div>
)}
```

**結果:** アバター画像が設定されている場合は画像を表示し、なければイニシャルを表示します。

#### PostDetail.tsx（投稿詳細画面）

**ファイル:** `client/src/pages/PostDetail.tsx`

**主な機能:**

- 投稿の詳細表示
- コメント入力フォーム
- コメント一覧の表示

**編集例 1: コメントの表示順序を変更**

```typescript
// ファイル: server/db.ts

// 変更前
export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));  // 新しい順
}

// 変更後
export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt));  // 古い順
}
```

**結果:** コメントが古い順に表示されます。

**編集例 2: コメント入力欄の行数を変更**

```typescript
// 変更前
<Textarea
  placeholder="コメントを入力..."
  value={newComment}
  onChange={(e) => setNewComment(e.target.value)}
  rows={3}
  className="resize-none"
/>

// 変更後
<Textarea
  placeholder="コメントを入力..."
  value={newComment}
  onChange={(e) => setNewComment(e.target.value)}
  rows={5}  // 3行から5行に変更
  className="resize-none"
/>
```

**結果:** コメント入力欄が大きくなります。

---

## カスタマイズガイド

よくあるカスタマイズ要望と、その実装方法を説明します。

### 1. アプリ名とロゴを変更

**ファイル:** `client/src/const.ts`

```typescript
// 変更前
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "家族向け SNS";
export const APP_LOGO = import.meta.env.VITE_APP_LOGO || "";

// 変更後
export const APP_TITLE = "山田ファミリー";
export const APP_LOGO = "/logo.png";  // client/public/logo.png に画像を配置
```

**結果:** アプリ名が「山田ファミリー」に変わり、ロゴが表示されます。

### 2. 色テーマを変更

**ファイル:** `client/src/index.css`

```css
/* 変更前 */
:root {
  --primary: 221.2 83.2% 53.3%;  /* 青色 */
  --primary-foreground: 210 40% 98%;
}

/* 変更後 */
:root {
  --primary: 142.1 76.2% 36.3%;  /* 緑色 */
  --primary-foreground: 355.7 100% 97.3%;
}
```

**結果:** ボタンやリンクの色が青から緑に変わります。

### 3. 背景色を変更

**ファイル:** `client/src/pages/Home.tsx`（および他のページ）

```typescript
// 変更前
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

// 変更後
<div className="min-h-screen bg-white">  // シンプルな白背景
```

**結果:** グラデーション背景が白一色に変わります。

### 4. 投稿に「いいね」機能を追加

**ステップ 1: データベースに likes テーブルを追加**

```sql
-- Supabase SQL Editor で実行
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("postId", "userId")  -- 同じユーザーが同じ投稿に複数回いいねできないようにする
);
```

**ステップ 2: スキーマファイルを更新**

**ファイル:** `drizzle/schema.ts`

```typescript
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

**ステップ 3: データベース操作関数を追加**

**ファイル:** `server/db.ts`

```typescript
export async function createLike(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(likes).values({ postId, userId });
}

export async function deleteLike(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(likes).where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
}

export async function getLikeCountByPostId(postId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(likes)
    .where(eq(likes.postId, postId));
  return result[0]?.count || 0;
}
```

**ステップ 4: API エンドポイントを追加**

**ファイル:** `server/routers.ts`

```typescript
posts: router({
  // 既存のエンドポイント...
  
  like: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      await db.createLike(input.postId, user.id);
      return { success: true };
    }),
  
  unlike: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      await db.deleteLike(input.postId, user.id);
      return { success: true };
    }),
}),
```

**ステップ 5: フロントエンドに「いいね」ボタンを追加**

**ファイル:** `client/src/pages/Home.tsx`

```typescript
// CardFooter 内に追加
<CardFooter className="flex gap-4 pt-0">
  <Button 
    variant="ghost" 
    size="sm"
    onClick={() => likeMutation.mutate({ postId: post.id })}
  >
    <Heart className="mr-2 h-4 w-4" />
    いいね
  </Button>
  <Link href={`/post/${post.id}`}>
    <Button variant="ghost" size="sm">
      <MessageCircle className="mr-2 h-4 w-4" />
      コメント
    </Button>
  </Link>
</CardFooter>
```

**結果:** 投稿に「いいね」ボタンが表示され、クリックするといいねが追加されます。

### 5. プロフィール編集機能を追加

**ステップ 1: API エンドポイントを追加**

**ファイル:** `server/routers.ts`

```typescript
auth: router({
  // 既存のエンドポイント...
  
  updateUserProfile: protectedProcedure
    .input(z.object({
      fullName: z.string().optional(),
      avatarUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.upsertUser({
        openId: ctx.user.openId,
        fullName: input.fullName,
        avatarUrl: input.avatarUrl,
      });
      return { success: true };
    }),
}),
```

**ステップ 2: プロフィール編集ページを作成**

**ファイル:** `client/src/pages/Profile.tsx`（新規作成）

```typescript
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  const updateMutation = trpc.auth.updateUserProfile.useMutation({
    onSuccess: () => {
      toast.success("プロフィールを更新しました");
    },
  });

  const handleSubmit = () => {
    updateMutation.mutate({ fullName, avatarUrl });
  };

  return (
    <div className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">プロフィール編集</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">名前</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="avatarUrl">アバター URL</Label>
          <Input
            id="avatarUrl"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
        </div>
        <Button onClick={handleSubmit}>保存</Button>
      </div>
    </div>
  );
}
```

**ステップ 3: ルーティングに追加**

**ファイル:** `client/src/App.tsx`

```typescript
import Profile from "./pages/Profile";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/profile" component={Profile} />  // 追加
      <Route path="/post/:id" component={PostDetail} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

**結果:** `/profile` にアクセスすると、プロフィール編集画面が表示されます。

---

## 新機能の追加方法

新しい機能を追加する際の一般的な手順を説明します。

### 基本的な流れ

1. **データベーススキーマの更新**（必要な場合）
   - `drizzle/schema.ts` にテーブルを追加
   - Supabase SQL Editor で CREATE TABLE を実行

2. **データベース操作関数の追加**
   - `server/db.ts` にクエリ関数を追加

3. **API エンドポイントの追加**
   - `server/routers.ts` に tRPC プロシージャを追加

4. **フロントエンド UI の実装**
   - `client/src/pages/` に新しいページを作成
   - または既存のページにコンポーネントを追加

5. **ルーティングの設定**（新しいページの場合）
   - `client/src/App.tsx` にルートを追加

6. **テストとデプロイ**
   - ローカルで動作確認
   - GitHub にプッシュして Vercel にデプロイ

### 例: 通知機能の追加

**ステップ 1: データベーススキーマ**

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  type VARCHAR(64) NOT NULL,  -- 'new_post', 'new_comment' など
  "relatedId" INTEGER,
  message TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**ステップ 2: データベース操作関数**

```typescript
// server/db.ts
export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values(notification);
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}
```

**ステップ 3: API エンドポイント**

```typescript
// server/routers.ts
notifications: router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserByOpenId(ctx.user.openId);
    if (!user) return [];
    return await db.getNotificationsByUserId(user.id);
  }),
  
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationAsRead(input.id);
      return { success: true };
    }),
}),
```

**ステップ 4: フロントエンド UI**

```typescript
// client/src/pages/Notifications.tsx
export default function Notifications() {
  const { data: notifications } = trpc.notifications.list.useQuery();
  
  return (
    <div>
      <h1>通知</h1>
      {notifications?.map((notification) => (
        <div key={notification.id}>
          {notification.message}
        </div>
      ))}
    </div>
  );
}
```

---

## まとめ

このドキュメントでは、コードのどの部分を修正すると、どのような変更が反映されるかを詳しく説明しました。

**重要なポイント:**

- **データベース** の変更は `drizzle/schema.ts` と Supabase SQL Editor で行う
- **バックエンド API** の変更は `server/routers.ts` と `server/db.ts` で行う
- **フロントエンド UI** の変更は `client/src/pages/` 内のファイルで行う
- **デザイン** の変更は `client/src/index.css` と各コンポーネントの className で行う

新しい機能を追加する際は、この流れに沿って実装することで、型安全で保守しやすいコードを保つことができます。
