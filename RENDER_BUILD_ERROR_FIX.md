# Render.com ビルドエラーの修正方法

## エラー内容

```
bash: -c: line 1: unexpected EOF while looking for matching ``'
```

このエラーは、Build Command に余分なバッククォート（`）が含まれているために発生しています。

## 原因

Render.com の設定画面で Build Command を入力する際に、以下のように**余分なバッククォートが含まれている**可能性があります。

```
❌ 間違い: pnpm install && pnpm build`
✅ 正しい: pnpm install && pnpm build
```

## 修正方法

### ステップ 1: Render.com の設定画面を開く

1. [Render.com のダッシュボード](https://dashboard.render.com/) にアクセス
2. デプロイしたサービス（`family-sns-web`）をクリック
3. 左サイドバーの「Settings」をクリック

### ステップ 2: Build Command を修正

1. 「Build & Deploy」セクションまでスクロール
2. 「Build Command」の入力欄を確認
3. 以下のように修正してください

**正しい Build Command:**
```
pnpm install && pnpm build
```

**注意点:**
- 最後にバッククォート（`）が**ない**ことを確認してください
- 余分なスペースや改行がないことを確認してください

### ステップ 3: 保存して再デプロイ

1. ページ下部の「Save Changes」ボタンをクリック
2. 「Manual Deploy」→「Clear build cache & deploy」をクリック
3. デプロイが開始されます（5〜10分かかります）

## その他の設定の確認

Build Command を修正する際に、以下の設定も確認してください。

| 項目 | 正しい設定値 |
|---|---|
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |
| **Node Version** | 自動（22.x が推奨） |

## 環境変数の確認

Build Command を修正しても問題が解決しない場合は、環境変数が正しく設定されているか確認してください。

### 必須の環境変数

1. 左サイドバーの「Environment」をクリック
2. 以下の環境変数が設定されているか確認

| Key | Value | 説明 |
|---|---|---|
| `NODE_ENV` | `production` | 本番環境モード |
| `DATABASE_URL` | `postgresql://...` | Supabase の接続文字列 |
| `JWT_SECRET` | `ランダムな文字列` | セッション暗号化キー |
| `PORT` | `10000` | Render.com のデフォルトポート |

## デプロイの進行状況を確認

1. 左サイドバーの「Events」をクリック
2. 最新のデプロイのステータスを確認
3. ログを確認して、エラーがないか確認

成功すると、以下のようなメッセージが表示されます。

```
==> Build successful 🎉
==> Deploying...
==> Your service is live 🎉
```

## トラブルシューティング

### 問題 1: pnpm が見つからない

**エラーメッセージ:**
```
pnpm: command not found
```

**解決方法:**

Build Command を以下に変更してください。

```
npm install -g pnpm && pnpm install && pnpm build
```

### 問題 2: ビルドは成功するが、起動時にエラーが発生する

**原因:**
- 環境変数が設定されていない
- データベース接続エラー

**解決方法:**

1. 「Logs」タブでエラーメッセージを確認
2. `DATABASE_URL` が正しいか確認
3. Supabase のデータベースが起動しているか確認

### 問題 3: デプロイに時間がかかりすぎる

**原因:**
- 無料プランでは、ビルドリソースが限られている

**解決方法:**
- 通常 5〜10分かかります
- 15分以上かかる場合は、ログを確認してエラーがないか確認

## まとめ

Build Command の余分なバッククォート（`）を削除することで、エラーが解決します。

**修正前:**
```
pnpm install && pnpm build`
```

**修正後:**
```
pnpm install && pnpm build
```

修正後、「Save Changes」をクリックして、再デプロイを実行してください。

ご不明な点がございましたら、お気軽にお問い合わせください。
