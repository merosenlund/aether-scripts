# Aether Scripts

Aether Scripts is a curated, digital-first actual play fiction platform. It is designed to bridge the gap between solo TTRPG journaling and serial novel publication, providing a rich, interactive reading experience that traditional digital publishing lacks.

## 🌟 The Vision

Aether Scripts is built to solve the "static screen" problem of digital serials. It isn't just paper on a screen; it's a platform that understands reading progress, world-building, and the unique connection between gaming and storytelling.

### Key Features

- **Author's Cut Reading**: Seamlessly toggle between pure prose and the underlying TTRPG mechanics (dice rolls, GM notes, and game decisions) that shaped the story.
- **Progression-Aware Wiki**: A built-in world bible that knows exactly where you are in the story. No more spoilers from community wikis—information is revealed only after you've read the corresponding scenes.
- **Infinite Scroll Experience**: A seamless, unified reading experience where "next chapter" is as smooth as scrolling to the next paragraph.
- **Custom Reading Lists**: Don't like fight scenes? Want to skip the "slog"? Create or follow reading lists that mix full prose, summaries, and quick descriptions to curate your perfect experience.
- **Community Interaction**: Google Docs-style inline commenting and Kindle-style private notes/highlights, tied directly to specific blocks of text.

## 🛠 Tech Stack

- **Runtime**: [Deno](https://deno.com/)
- **Framework**: [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [shadcn-svelte](https://shadcn-svelte.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Rich Text Engine**: [Tiptap](https://tiptap.dev/)

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.com/) installed.
- [Docker](https://www.docker.com/) (for local Supabase development).

### Setup

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   deno install
   ```
3. **Start Supabase locally**:
   ```bash
   npx supabase start
   ```
4. **Environment Variables**:
   Ensure your `.env` file is populated with the local Supabase credentials (automatically handled if using the provided config).

### Development

Start the development server:
```bash
deno task dev
```

### Building

Build for production (using `svelte-adapter-deno`):
```bash
deno task build
```

## 🗺 Roadmap

See the [roadmap.md](./roadmap.md) for detailed project phases and upcoming features.

## 📜 Agent Rules

See [.agentrules.md](./.agentrules.md) for the rules and constraints that AI agents must follow when contributing to this project.
