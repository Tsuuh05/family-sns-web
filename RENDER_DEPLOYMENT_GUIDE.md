# Render.com 無料デプロイメントガイド

このガイドでは、家族向け SNS Web アプリケーションを Render.com の無料プランでデプロイする方法を説明します。

## 目次

1. [Render.com について](#rendercom-について)
2. [必要なもの](#必要なもの)
3. [事前準備](#事前準備)
4. [デプロイ手順](#デプロイ手順)
5. [環境変数の設定](#環境変数の設定)
6. [動作確認](#動作確認)
7. [制限事項と注意点](#制限事項と注意点)
8. [トラブルシューティング](#トラブルシューティング)

---

## Render.com について

Render.com は、Web アプリケーションを簡単にデプロイできるクラウドプラットフォームです。無料プランでは、以下の機能が利用できます。

| 項目 | 無料プランの内容 |
|---|---|
| **料金** | 完全無料 |
| **サーバー** | 512 MB RAM、0.1 CPU |
| **制限** | 15分間アクセスがないとスリープ状態になる |
| **起動時間** | スリープ後の初回アクセスは 50秒〜1分かかる |
| **ドメイン** | `*.onrender.com` の無料ドメイン |
| **独自ドメイン** | 設定可能（ドメイン代は別途必要） |

### スリープ状態について

無料プランでは、15分間アクセスがないとサーバーが自動的にスリープ状態になります。次にアクセスがあると、サーバーが起動しますが、初回アクセスは 50秒〜1分ほど時間がかかります。家族内での使用であれば、この制限は大きな問題にはなりません。

---

## 必要なもの

デプロイを開始する前に、以下を準備してください。

1. **GitHub アカウント**: [https://github.com](https://github.com) で無料登録
2. **Render.com アカウント**: [https://render.com](https://render.com) で無料登録（GitHub アカウントでログイン可能）
3. **Supabase プロジェクト**: 既に作成済みの Supabase プロジェクト（認証とデータベース）
4. **ソースコード**: GitHub にアップロード済みのプロジェクトコード

---

## 事前準備

### 1. GitHub へのコードアップロード

まだ GitHub にコードをアップロードしていない場合は、以下の手順で行ってください。

#### GitHub Desktop を使う方法（初心者向け）

1. **GitHub Desktop のインストール**
   - [https://desktop.github.com/](https://desktop.github.com/) からダウンロード
   - インストール後、GitHub アカウントでログイン

2. **新しいリポジトリの作成**
   - GitHub Desktop で「File」→「New Repository」をクリック
   - Repository name: `family-sns-web`
   - Local path: ダウンロードしたプロジェクトフォルダを選択
   - 「Create Repository」をクリック

3. **コードのプッシュ**
   - 「Publish repository」をクリック
   - 「Keep this code private」のチェックを外す（公開リポジトリにする）
   - 「Publish Repository」をクリック

### 2. Supabase 情報の確認

Supabase の管理画面で、以下の情報を確認してください。

#### データベース接続文字列

1. Supabase にログイン: [https://supabase.com](https://supabase.com)
2. プロジェクトを選択
3. 左サイドバーの「Settings」→「Database」をクリック
4. 「Connection string」セクションで「URI」をコピー

例:
```
postgresql://postgres:[YOUR-PASSWORD]@db.najnpurkwgjacnqrlmmm.supabase.co:5432/postgres
```

#### Supabase API 情報

1. 左サイドバーの「Settings」→「API」をクリック
2. 以下の情報をコピー:
   - **Project URL**: `https://najnpurkwgjacnqrlmmm.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## デプロイ手順

### ステップ 1: Render.com にログイン

1. [https://render.com](https://render.com) にアクセス
2. 「Get Started for Free」をクリック
3. GitHub アカウントでログイン

### ステップ 2: 新しい Web Service を作成

1. ダッシュボードで「New +」ボタンをクリック
2. 「Web Service」を選択
3. 「Connect a repository」で GitHub リポジトリを選択
   - 初回の場合、GitHub との連携を許可する必要があります
   - 「family-sns-web」リポジトリを選択

### ステップ 3: サービスの設定

以下の項目を設定します。

| 項目 | 設定値 |
|---|---|
| **Name** | `family-sns-web`（任意の名前） |
| **Region** | `Singapore (Southeast Asia)` |
| **Branch** | `main` または `master` |
| **Root Directory** | 空欄のまま |
| **Runtime** | `Node` |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |
| **Plan** | `Free` |

### ステップ 4: 環境変数の設定

「Advanced」セクションを展開して、以下の環境変数を追加します。

#### 必須の環境変数

| Key | Value | 説明 |
|---|---|---|
| `NODE_ENV` | `production` | 本番環境モード |
| `DATABASE_URL` | `postgresql://postgres:...` | Supabase の接続文字列 |
| `JWT_SECRET` | `ランダムな文字列` | セッション暗号化キー |
| `SUPABASE_URL` | `https://najnpurkwgjacnqrlmmm.supabase.co` | Supabase プロジェクト URL |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase 匿名キー |
| `VITE_APP_TITLE` | `家族SNS` | アプリケーションタイトル |
| `PORT` | `10000` | Render.com のデフォルトポート |

#### JWT_SECRET の生成方法

以下のいずれかの方法でランダムな文字列を生成してください。

**方法 1: オンラインツール**
- [https://randomkeygen.com/](https://randomkeygen.com/) にアクセス
- 「Fort Knox Passwords」セクションの文字列をコピー

**方法 2: ターミナル（Mac/Linux）**
```bash
openssl rand -base64 32
```

**方法 3: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### ステップ 5: デプロイの実行

1. すべての設定を確認
2. 「Create Web Service」ボタンをクリック
3. デプロイが開始されます（5〜10分かかります）

デプロイの進行状況は、ログで確認できます。以下のようなメッセージが表示されれば成功です。

```
==> Build successful 🎉
==> Deploying...
==> Your service is live 🎉
```

---

## 環境変数の設定

デプロイ後に環境変数を追加・変更する場合は、以下の手順で行います。

1. Render.com のダッシュボードで、デプロイしたサービスをクリック
2. 左サイドバーの「Environment」をクリック
3. 「Add Environment Variable」をクリック
4. Key と Value を入力
5. 「Save Changes」をクリック
6. サービスが自動的に再デプロイされます

---

## 動作確認

デプロイが完了したら、以下の手順で動作を確認します。

### 1. URL の確認

Render.com のダッシュボードで、サービスの URL を確認します。

例: `https://family-sns-web.onrender.com`

### 2. アクセステスト

1. ブラウザで URL にアクセス
2. 初回アクセスは、サーバーが起動するまで 50秒〜1分かかります
3. 認証画面が表示されれば成功です

### 3. アカウント作成とログイン

#### 招待コードの作成（初回のみ）

Supabase の SQL エディタで以下を実行して、招待コードを作成します。

```sql
-- 家族グループを作成
INSERT INTO families (name) VALUES ('堀田家');

-- 招待コードを作成
INSERT INTO invite_codes (code, family_id, is_used) 
VALUES ('FAMILY2024', (SELECT id FROM families WHERE name = '堀田家'), false);
```

#### アカウント作成

1. Web アプリの認証画面で「新規登録」をクリック
2. 招待コード「FAMILY2024」を入力して「確認」をクリック
3. 氏名、メールアドレス、パスワードを入力
4. 「アカウント作成」をクリック
5. アカウントが作成されます

#### ログイン

1. メールアドレスとパスワードを入力
2. 「ログイン」をクリック
3. ホーム画面が表示されれば成功です

### 4. 投稿テスト

1. 「新しい投稿」ボタンをクリック
2. テキストを入力して「投稿する」をクリック
3. 投稿が表示されれば成功です

---

## 制限事項と注意点

### 無料プランの制限

Render.com の無料プランには、以下の制限があります。

1. **スリープ状態**
   - 15分間アクセスがないと自動的にスリープ
   - 次回アクセス時に起動するまで 50秒〜1分かかる
   - **対策**: 家族で頻繁に使用する場合は問題なし

2. **メモリ制限**
   - 512 MB RAM
   - 大量の画像アップロードには不向き
   - **対策**: 画像は外部 URL を使用するか、Supabase Storage を利用

3. **CPU 制限**
   - 0.1 CPU
   - 同時アクセス数が多いと遅くなる可能性
   - **対策**: 家族内での使用であれば問題なし

### セキュリティ

1. **環境変数の管理**
   - `DATABASE_URL`、`JWT_SECRET`、`SUPABASE_ANON_KEY` は絶対に公開しないでください
   - GitHub にプッシュする際は、`.env` ファイルを `.gitignore` に追加

2. **データベースのバックアップ**
   - Supabase の無料プランでは自動バックアップがありません
   - 定期的に手動でバックアップを取ることをお勧めします

---

## トラブルシューティング

### 問題 1: デプロイが失敗する

**症状**: ビルドエラーが発生してデプロイが完了しない

**原因**: 
- 環境変数が正しく設定されていない
- `pnpm` がインストールされていない

**解決方法**:
1. ログを確認してエラーメッセージを特定
2. 環境変数を再確認
3. Build Command を以下に変更:
   ```
   npm install -g pnpm && pnpm install && pnpm build
   ```

### 問題 2: アクセスしても画面が表示されない

**症状**: URL にアクセスしても白い画面が表示される

**原因**:
- サーバーがまだ起動していない
- データベース接続エラー

**解決方法**:
1. 1分ほど待ってからリロード
2. Render.com のログを確認
3. `DATABASE_URL` と `SUPABASE_URL` が正しいか確認

### 問題 3: ログインできない

**症状**: メールアドレスとパスワードを入力してもエラーが表示される

**原因**:
- Supabase Auth が正しく設定されていない
- 環境変数 `SUPABASE_URL` または `SUPABASE_ANON_KEY` が間違っている

**解決方法**:
1. Render.com の Environment 設定で環境変数を確認
2. Supabase の「Settings」→「API」で正しい値を確認
3. 環境変数を修正して再デプロイ

### 問題 4: 招待コードが無効と表示される

**症状**: 招待コードを入力してもエラーが表示される

**原因**:
- Supabase に招待コードが登録されていない
- データベーステーブルが作成されていない

**解決方法**:
1. Supabase の SQL エディタで以下を実行:
   ```sql
   SELECT * FROM invite_codes;
   ```
2. 招待コードが存在しない場合は、作成:
   ```sql
   INSERT INTO invite_codes (code, family_id, is_used) 
   VALUES ('FAMILY2024', (SELECT id FROM families LIMIT 1), false);
   ```

### 問題 5: 画像が表示されない

**症状**: 投稿に画像 URL を入力しても表示されない

**原因**:
- 画像 URL が無効
- CORS エラー

**解決方法**:
- 画像は Supabase Storage にアップロードするか、imgur などの画像ホスティングサービスを使用

---

## 独自ドメインの設定（オプション）

Render.com では、独自ドメインを設定することも可能です。

### 手順

1. ドメインを取得（お名前.com、Google Domains など）
2. Render.com のダッシュボードで「Settings」→「Custom Domain」をクリック
3. ドメイン名を入力（例: `family-sns.com`）
4. DNS レコードを設定
   - Type: `CNAME`
   - Name: `@` または `www`
   - Value: Render.com が提供する値（例: `family-sns-web.onrender.com`）
5. DNS の伝播を待つ（数分〜24時間）

---

## まとめ

Render.com と Supabase を使用することで、完全無料で家族向け SNS をデプロイできます。スリープ状態の制限はありますが、家族内での使用であれば十分に実用的です。

### 費用まとめ

| 項目 | 費用 |
|---|---|
| Render.com ホスティング | **無料** |
| Supabase データベース + 認証 | **無料** |
| 独自ドメイン（オプション） | 年間 1,000〜2,000円 |
| **合計** | **無料**（独自ドメインなしの場合） |

### 認証システムについて

このアプリケーションは **Supabase Auth** を使用しています。

- **メリット**:
  - Render.com などの外部プラットフォームでも動作
  - メール/パスワード認証をサポート
  - 招待コード制限により家族のみが参加可能

- **iOS アプリとの互換性**:
  - iOS アプリと Web アプリは同じ Supabase プロジェクトを使用
  - 同じメールアドレスとパスワードでログイン可能

### 次のステップ

1. 画像アップロード機能の追加（Supabase Storage 使用）
2. 「いいね」機能の実装
3. プロフィール編集機能の追加
4. プッシュ通知の設定

ご不明な点がございましたら、お気軽にお問い合わせください。
