# 家族向け SNS Web アプリ - デプロイメントガイド

このガイドでは、Vercel を使って無料で Web アプリをデプロイする方法を説明します。

## 前提条件

以下のアカウントが必要です。

- **GitHub アカウント**: コードをホストするため
- **Vercel アカウント**: Web アプリをデプロイするため（GitHub アカウントで無料登録可能）
- **Supabase プロジェクト**: 既に設定済み

## デプロイ手順

### ステップ 1: GitHub にコードをプッシュ

プロジェクトのコードを GitHub リポジトリにプッシュします。

```bash
cd /home/ubuntu/family-sns-web
git init
git add .
git commit -m "Initial commit: Family SNS web app"
git branch -M main
git remote add origin https://github.com/your-username/family-sns-web.git
git push -u origin main
```

### ステップ 2: Vercel にデプロイ

Vercel の Web サイト（https://vercel.com）にアクセスし、以下の手順を実行します。

1. **GitHub アカウントでログイン**
2. **New Project** をクリック
3. **Import Git Repository** で先ほど作成した GitHub リポジトリを選択
4. **Framework Preset**: Vite を選択（自動検出されるはず）
5. **Environment Variables** を設定（次のセクションを参照）
6. **Deploy** をクリック

### ステップ 3: 環境変数の設定

Vercel のプロジェクト設定で、以下の環境変数を追加します。

| 変数名 | 値 | 説明 |
|---|---|---|
| `DATABASE_URL` | Supabase の接続文字列 | データベース接続用 |
| `VITE_APP_TITLE` | 家族向け SNS | アプリのタイトル |
| `VITE_APP_LOGO` | ロゴの URL | アプリのロゴ（オプション） |

**Supabase の接続文字列の取得方法:**

1. Supabase ダッシュボードにログイン
2. プロジェクトを選択
3. **Settings** → **Database** → **Connection string** → **URI**
4. パスワードを入力して接続文字列をコピー

### ステップ 4: デプロイの確認

デプロイが完了すると、Vercel から以下のような URL が提供されます。

```
https://family-sns-web.vercel.app
```

この URL にアクセスして、アプリが正常に動作することを確認してください。

## データベースの初期設定

### 家族と招待コードの作成

Supabase の SQL エディタで以下の SQL を実行して、家族と招待コードを作成します。

```sql
-- 堀田家を作成
WITH new_family AS (
  INSERT INTO families (name) 
  VALUES ('堀田家')
  RETURNING id
)
INSERT INTO inviteCodes (code, family_id)
SELECT 'HOTTA0217', id FROM new_family;

-- 倉方家を作成
WITH new_family AS (
  INSERT INTO families (name) 
  VALUES ('倉方家')
  RETURNING id
)
INSERT INTO inviteCodes (code, family_id)
SELECT 'KURAKATA2440', id FROM new_family;
```

### 確認

```sql
-- 作成された家族を確認
SELECT * FROM families;

-- 作成された招待コードを確認
SELECT ic.*, f.name as family_name 
FROM inviteCodes ic
LEFT JOIN families f ON ic.family_id = f.id;
```

## プライバシー設定

このアプリは、検索エンジンにインデックスされないように以下の設定が施されています。

### robots.txt

`client/public/robots.txt` に以下の内容が設定されています。

```
User-agent: *
Disallow: /
```

### Meta タグ

`client/index.html` に以下の meta タグが追加されています。

```html
<meta name="robots" content="noindex, nofollow" />
<meta name="googlebot" content="noindex, nofollow" />
```

これにより、Google などの検索エンジンがこのサイトをインデックスしないようになっています。

## 独自ドメインの設定（オプション）

Vercel の無料ドメイン（`*.vercel.app`）ではなく、独自のドメイン（例: `hotta-family.com`）を使いたい場合は、以下の手順を実行します。

### ステップ 1: ドメインを取得

お名前.com や Google Domains などでドメインを取得します（年間 1,000円〜3,000円程度）。

### ステップ 2: Vercel でドメインを追加

1. Vercel のプロジェクト設定を開く
2. **Domains** タブをクリック
3. 取得したドメインを入力して **Add** をクリック
4. 表示される DNS 設定を、ドメイン登録サービスの DNS 設定に追加

### ステップ 3: DNS の伝播を待つ

DNS の設定が反映されるまで、数分〜数時間かかる場合があります。

## トラブルシューティング

### ビルドエラーが発生する

Vercel のビルドログを確認して、エラーメッセージを確認してください。多くの場合、環境変数の設定ミスが原因です。

### データベースに接続できない

`DATABASE_URL` が正しく設定されているか確認してください。Supabase の接続文字列には、パスワードが含まれている必要があります。

### 招待コードが機能しない

Supabase の SQL エディタで、`inviteCodes` テーブルにデータが正しく挿入されているか確認してください。

```sql
SELECT * FROM inviteCodes;
```

## 費用について

このアプリは、以下のサービスの無料プランで運用できます。

| サービス | 無料プランの制限 | 費用 |
|---|---|---|
| **Vercel** | 100 GB 帯域幅/月 | **¥0** |
| **Supabase** | 500 MB データベース、1 GB ストレージ | **¥0** |
| **合計** | - | **¥0/月** |

独自ドメインを使用する場合のみ、年間 1,000円〜3,000円程度の費用がかかります。

## まとめ

このガイドに従うことで、無料で家族向け SNS Web アプリをデプロイできます。検索エンジンにインデックスされない設定も施されているため、家族だけで安心して使用できます。

ご不明な点がございましたら、お気軽にお問い合わせください。
