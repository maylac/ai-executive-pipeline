# AI Executive Pipeline

5人の伝説的CEO（孫正義、ピーター・ティール、スティーブ・ジョブズ、ジェフ・ベゾス、ウォーレン・バフェット）との**取締役会**をシミュレートし、ビジネスアイデアを洗練させるAI搭載アプリケーションです。

<img width="1684" alt="Screenshot 2025-01-25 at 10 09 00" src="https://github.com/user-attachments/assets/b8e05e46-1549-4115-9af2-16e6d32845c4" />

## 特徴
- **5段階のパイプライン**: シードアイデアを完全なビジネス戦略に変革します。
- **リアルタイムストリーミング**: 各エージェントが「発言」し、Markdownコンテンツをライブ生成する様子を観察できます。
- **Decision Docket UI**: 5席の進捗、現在の審議、最終判断を取締役会の記録として追えます。
- **クライアントサイドロジック**: 即時フィードバックのためのシンプルなチェーン実行。

## セットアップ手順

### 前提条件
- Node.js 18以上がインストールされていること。
- GPT-4oにアクセス可能な**OpenAI APIキー**（または互換性のあるキー）。

### インストール

1.  リポジトリをクローンします:
    ```bash
    git clone https://github.com/your-username/ai-executive-pipeline.git
    cd ai-executive-pipeline
    ```

2.  依存関係をインストールします:
    ```bash
    npm install
    # または
    yarn install
    # または
    pnpm install
    ```

3.  開発サーバーを起動します:
    ```bash
    npm run dev
    ```

4.  ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 使い方

1.  **APIキーの設定**:
    - 画面右上の**Settings**（歯車）をクリックします。
    - OpenAI APIキーを入力します。キーはこのページのメモリ内だけに保持され、ページを離れると消去されます。各席の審議時に、このアプリの`/api/chat`ルートへ送信されます。

2.  **ミーティングの開始**:
    - テキストエリアにビジネスアイデアの原案を入力します（例：「空手を教えるスマートミラー」）。
    - **Start Board Meeting**（取締役会を開始）をクリックします。

3.  **出力の確認**:
    - パイプラインが順次実行されます。
    - **孫正義**が300年構想を作成します。
    - **ピーター・ティール**が逆張りの独占戦略を特定します。
    - **スティーブ・ジョブズ**がユーザー体験を設計します。
    - **ジェフ・ベゾス**が実行計画を作成します。
    - **ウォーレン・バフェット**が最終的な投資判断を下します。

## 技術スタック
- **フレームワーク**: Next.js 14+ (App Router)
- **スタイリング**: Tailwind CSS
- **アニメーション**: Framer Motion
- **アイコン**: Lucide React
- **Markdown**: react-markdown + @tailwindcss/typography
