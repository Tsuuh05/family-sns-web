# 家族向け SNS - 詳細デプロイメントガイド

このガイドでは、初心者の方でも理解できるように、デプロイの手順を詳しく説明します。

## 目次

1. [必要なアカウントの準備](#必要なアカウントの準備)
2. [Supabase データベースの設定](#supabase-データベースの設定)
3. [GitHub へのコードアップロード](#github-へのコードアップロード)
4. [Vercel でのデプロイ](#vercel-でのデプロイ)
5. [動作確認](#動作確認)

---

## 必要なアカウントの準備

デプロイには以下の3つのアカウントが必要です。すべて無料で作成できます。

### 1. GitHub アカウント

GitHub はソースコードを保管するサービスです。

**作成手順:**

1. https://github.com にアクセス
2. 右上の「Sign up」をクリック
3. メールアドレス、パスワード、ユーザー名を入力
4. メール認証を完了

### 2. Vercel アカウント

Vercel は Web アプリケーションを無料でホスティングするサービスです。

**作成手順:**

1. https://vercel.com にアクセス
2. 「Sign Up」をクリック
3. **「Continue with GitHub」を選択**（GitHub アカウントで登録）
4. GitHub との連携を承認

### 3. Supabase アカウント

Supabase はデータベースを提供するサービスです。既に設定済みの場合はスキップしてください。

**作成手順:**

1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. GitHub アカウントでログイン
4. 新しいプロジェクトを作成

---

## Supabase データベースの設定

### ステップ 1: データベース接続情報の取得

Supabase のデータベース接続文字列を取得します。

**手順:**

1. Supabase ダッシュボード（https://app.supabase.com）にログイン
2. 使用するプロジェクトを選択
3. 左サイドバーの **「Settings」**（歯車アイコン）をクリック
4. **「Database」** タブをクリック
5. **「Connection string」** セクションを見つける
6. **「URI」** タブを選択
7. 表示される接続文字列をコピー（`postgresql://postgres:[YOUR-PASSWORD]@...` という形式）
8. `[YOUR-PASSWORD]` の部分を、プロジェクト作成時に設定したパスワードに置き換える

**接続文字列の例:**
```
postgresql://postgres:your_password@db.abc123xyz.supabase.co:5432/postgres
```

この接続文字列は後で使用するので、メモ帳などに保存しておいてください。

### ステップ 2: データベーステーブルの作成

データベースにテーブルを作成します。既に作成済みの場合はスキップしてください。

**手順:**

1. Supabase ダッシュボードで、左サイドバーの **「SQL Editor」** をクリック
2. **「+ New query」** をクリック
3. 以下の SQL をコピーして貼り付け

```sql
-- families テーブル
CREATE TABLE IF NOT EXISTS families (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- inviteCodes テーブル
CREATE TABLE IF NOT EXISTS "inviteCodes" (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  "familyId" INTEGER NOT NULL,
  "isUsed" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- users テーブル（既存のテーブルに列を追加）
ALTER TABLE users ADD COLUMN IF NOT EXISTS "familyId" INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "fullName" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- posts テーブル
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "familyId" INTEGER NOT NULL,
  content TEXT NOT NULL,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- comments テーブル
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
```

4. **「Run」** ボタンをクリックして実行
5. 「Success. No rows returned」と表示されれば成功

### ステップ 3: 家族と招待コードの作成

家族グループと招待コードを作成します。

**手順:**

1. SQL Editor で **「+ New query」** をクリック
2. 以下の SQL をコピーして貼り付け（家族名と招待コードは自由に変更可能）

```sql
-- 堀田家を作成
WITH new_family AS (
  INSERT INTO families (name) 
  VALUES ('堀田家')
  RETURNING id
)
INSERT INTO "inviteCodes" (code, "familyId")
SELECT 'HOTTA0217', id FROM new_family;

-- 倉方家を作成
WITH new_family AS (
  INSERT INTO families (name) 
  VALUES ('倉方家')
  RETURNING id
)
INSERT INTO "inviteCodes" (code, "familyId")
SELECT 'KURAKATA2440', id FROM new_family;
```

3. **「Run」** をクリックして実行
4. 成功したら、以下の SQL で確認

```sql
SELECT ic.*, f.name as family_name 
FROM "inviteCodes" ic
LEFT JOIN families f ON ic."familyId" = f.id;
```

5. 作成した招待コードが表示されれば成功

---

## GitHub へのコードアップロード

### 方法 1: Manus の管理画面からダウンロード（推奨）

**手順:**

1. Manus の管理画面（右側のパネル）を開く
2. **「Code」** タブをクリック
3. 右上の **「Download All Files」** ボタンをクリック
4. ZIP ファイルがダウンロードされるので、解凍

### 方法 2: GitHub Desktop を使用（初心者向け）

GitHub Desktop は、コマンドを使わずに GitHub にコードをアップロードできるツールです。

**インストール手順:**

1. https://desktop.github.com にアクセス
2. 「Download for Windows/Mac」をクリックしてダウンロード
3. インストーラーを実行
4. GitHub アカウントでログイン

**コードのアップロード手順:**

1. GitHub Desktop を起動
2. **「File」** → **「Add local repository」** をクリック
3. ダウンロードして解凍したフォルダを選択
4. 「This directory does not appear to be a Git repository」と表示されたら、**「create a repository」** をクリック
5. **「Publish repository」** をクリック
6. リポジトリ名を入力（例: `family-sns-web`）
7. **「Keep this code private」** のチェックを外す（Vercel が読み取れるようにするため）
8. **「Publish Repository」** をクリック

これで GitHub にコードがアップロードされました。

---

## Vercel でのデプロイ

### ステップ 1: プロジェクトのインポート

**手順:**

1. https://vercel.com にアクセスしてログイン
2. ダッシュボードの **「Add New...」** → **「Project」** をクリック
3. **「Import Git Repository」** セクションで、先ほど作成した `family-sns-web` リポジトリを探す
4. **「Import」** ボタンをクリック

### ステップ 2: プロジェクト設定

**手順:**

1. **「Configure Project」** 画面が表示されます
2. **「Framework Preset」** が **「Vite」** になっていることを確認
3. **「Root Directory」** は **「./」**（デフォルト）のまま
4. **「Build and Output Settings」** はデフォルトのまま

### ステップ 3: 環境変数の設定

**重要:** この設定を正しく行わないと、アプリが動作しません。

**手順:**

1. **「Environment Variables」** セクションを展開
2. 以下の環境変数を1つずつ追加

| 変数名 | 値 | 説明 |
|---|---|---|
| `DATABASE_URL` | Supabase の接続文字列 | 先ほどメモした接続文字列を貼り付け |

**環境変数の追加方法:**

1. **「Key」** に変数名（例: `DATABASE_URL`）を入力
2. **「Value」** に値を入力
3. **「Add」** ボタンをクリック

### ステップ 4: デプロイの実行

**手順:**

1. すべての設定が完了したら、**「Deploy」** ボタンをクリック
2. デプロイが開始されます（1〜3分程度かかります）
3. **「Congratulations!」** と表示されたら成功

### ステップ 5: URL の確認

**手順:**

1. デプロイ完了画面で **「Continue to Dashboard」** をクリック
2. プロジェクトダッシュボードが表示されます
3. 上部に表示されている URL（例: `https://family-sns-web-abc123.vercel.app`）をクリック
4. アプリが表示されれば成功

---

## 動作確認

### ステップ 1: ログイン

**手順:**

1. デプロイした URL にアクセス
2. **「ログイン / 新規登録」** ボタンをクリック
3. Manus のログイン画面が表示されるので、ログイン

### ステップ 2: 招待コードで家族に参加

**手順:**

1. ログイン後、**「家族への参加」** 画面が表示されます
2. **「お名前」** に自分の名前を入力（例: 山田 太郎）
3. **「招待コード」** に先ほど作成したコード（例: `HOTTA0217`）を入力
4. **「確認」** ボタンをクリック
5. 「✓ 堀田家への招待コードが確認されました」と表示されれば成功
6. **「参加する」** ボタンをクリック

### ステップ 3: 投稿の作成

**手順:**

1. ホーム画面が表示されます
2. **「新しい投稿」** ボタンをクリック
3. 投稿内容を入力（例: 「テスト投稿です」）
4. **「投稿する」** ボタンをクリック
5. 投稿が表示されれば成功

### ステップ 4: コメントの追加

**手順:**

1. 投稿の **「コメント」** ボタンをクリック
2. 投稿詳細画面が表示されます
3. コメント入力欄にコメントを入力（例: 「テストコメントです」）
4. **「コメント」** ボタンをクリック
5. コメントが表示されれば成功

---

## トラブルシューティング

### デプロイが失敗する

**原因:** 環境変数の設定ミスが最も多い原因です。

**解決方法:**

1. Vercel のプロジェクトダッシュボードを開く
2. **「Settings」** タブをクリック
3. **「Environment Variables」** をクリック
4. `DATABASE_URL` が正しく設定されているか確認
5. 修正した場合は、**「Deployments」** タブから **「Redeploy」** を実行

### ログインできない

**原因:** Manus OAuth の設定が必要な場合があります。

**解決方法:**

Manus の管理画面で OAuth 設定を確認してください。通常は自動的に設定されています。

### 招待コードが機能しない

**原因:** データベースに招待コードが正しく作成されていない可能性があります。

**解決方法:**

1. Supabase の SQL Editor で以下を実行

```sql
SELECT * FROM "inviteCodes";
```

2. 招待コードが表示されない場合は、再度作成 SQL を実行

### 投稿が表示されない

**原因:** 家族 ID が正しく設定されていない可能性があります。

**解決方法:**

1. 一度ログアウトして、再度招待コードで参加してみてください

---

## 独自ドメインの設定（オプション）

Vercel の無料ドメイン（`*.vercel.app`）ではなく、独自のドメイン（例: `hotta-family.com`）を使いたい場合の設定方法です。

### ステップ 1: ドメインの取得

**推奨サービス:**

- **お名前.com**: https://www.onamae.com （年間 1円〜）
- **Google Domains**: https://domains.google （年間 1,400円〜）
- **Xserver ドメイン**: https://www.xdomain.ne.jp （年間 1円〜）

### ステップ 2: Vercel でドメインを追加

**手順:**

1. Vercel のプロジェクトダッシュボードを開く
2. **「Settings」** タブをクリック
3. **「Domains」** をクリック
4. 取得したドメイン名を入力（例: `hotta-family.com`）
5. **「Add」** をクリック
6. DNS 設定の指示が表示されます

### ステップ 3: DNS の設定

**手順:**

1. ドメイン取得サービスの管理画面を開く
2. DNS 設定画面を開く
3. Vercel で表示された DNS レコードを追加

**追加する DNS レコード（例）:**

| タイプ | 名前 | 値 |
|---|---|---|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

4. 保存して、DNS の伝播を待つ（数分〜数時間）

### ステップ 4: 確認

**手順:**

1. 独自ドメインにアクセス
2. アプリが表示されれば成功

---

## まとめ

このガイドに従うことで、家族向け SNS Web アプリを無料でデプロイできます。デプロイ後は、招待コードを家族に共有して、みんなで使い始めましょう。

ご不明な点がございましたら、お気軽にお問い合わせください。
