# AI Executive Pipeline

An AI-powered application that simulates a **Board Meeting** with 5 legendary CEOs (Masayoshi Son, Peter Thiel, Steve Jobs, Jeff Bezos, Warren Buffett) to refine your business ideas.

<img width="1684" alt="Screenshot 2025-01-25 at 10 09 00" src="https://github.com/user-attachments/assets/b8e05e46-1549-4115-9af2-16e6d32845c4" />

## Features
- **5-Stage Pipeline**: Transforms a seed idea into a full business strategy.
- **Real-time Streaming**: Watch each agent "speak" and generate markdown content live.
- **Premium UI**: Dark mode, glassmorphism, and smooth animations.
- **Client-side Logic**: Simple chain execution for immediate feedback.

## Setup Instructions

### Prerequisites
- Node.js 18+ installed.
- An **OpenAI API Key** (or compatible) with access to GPT-4o.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/ai-executive-pipeline.git
    cd ai-executive-pipeline
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

1.  **Configure API Key**:
    - Click the **Settings** icon (gear) in the bottom left corner.
    - Enter your OpenAI API Key. It is stored securely in your browser's local state and not sent to any server other than OpenAI's API via the proxy.

2.  **Start a Meeting**:
    - Enter your raw business idea in the text area (e.g., "A smart mirror that teaches you karate").
    - Click **Start Board Meeting**.

3.  **Review the Output**:
    - The pipeline will run sequentially.
    - **Masayoshi Son** creates the 300-year vision.
    - **Peter Thiel** identifies the contrarian monopoly strategy.
    - **Steve Jobs** designs the user experience.
    - **Jeff Bezos** creates the execution plan.
    - **Warren Buffett** provides the final investment decision.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Markdown**: react-markdown + @tailwindcss/typography
