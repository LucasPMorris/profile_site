<div align="center">
  <p>🔥 Started with an original design from ----, upgraded from Next.js 13 / React 18 -> Next.js 15 / React 19 - Stack includes: Next.js, TypeScript, Tailwind CSS, SWR, and Prisma with PostgreSQL</p>

</div>
<br />

## Tech Stack

This website is built using:

- ◼️ Next.js 15.5.0
- ⚛️ React 19
- 🔰 TypeScript
- 💠 Tailwind CSS 3
- 🗂 Prisma Client
- 〰️ SWR
- ➰ Framer Motion
- 💢 React Icons
- 🛢 Jest
- 🧿 Absolute Import and Path Alias
- 📏 ESLint
- ✨ Prettier
- 📌 Conventional Commit Lint

<br />

## Features

On this website there are several features that will continue to be updated and added in the future.

- ### 🤖 ChatGPT AI (Unavailable)

You can access this feature by opening the command palette [cmd+k], then typing whatever you want to search/ask for. (Currently not available, but you can configure it on your machine with your own OpenAI api key)

- ### 💻 JavaScript Playground

A no-fuss pure JavaScript playground with a live feedback loop.

- ### 🎧 Spotify Status

Displays song information being played on spotify in real time using the Spotify API and SWR.

- ### 🕗 Wakatime Statistics

Data is retrieved using the Wakatime API and then displayed on the dashboard, built with Next.js API routes deployed as serverless functions.

- ### 📝 Blogs

The content on this blog is meticulously managed and sourced from a self-hosted headless CMS powered by WordPress, exemplifying our commitment to a streamlined and efficient content delivery system. The data fetching technique used to retrieve articles from WordPress CMS API involves using Client-Side Rendering (CSR) for the blog list and Server-Side Rendering (SSR) for the blog details.

- ### 🗳 Projects

The data projects on this blog are taken from the PostgreSQL database connected through the Prisma Client. The database for this application is hosted on Supabase DB.The data fetching method used to retrieve data projects is Incremental Static Regeneration (ISR) with 1 second revalidation and Server-Side Rendering (SSR) for the project details..
<br /><br />

## Getting Started

If you are interested in running this project on your local machine, you can do so in just 3 easy steps below. Additionally, remember to update the ".env.example" file to ".env" and replace the variables with your own in the ".env" file.

### 1. Clone this template using one of the three ways:

1. Clone using git

   ```bash
   git clone https://github.com/LucasPMorris/profile_site.git
   ```

2. Using `create-next-app`

   ```bash
   npx create-next-app -e https://github.com/LucasPMorris/profile_site.git project-name
   ```

### 3. Config .env

This repository uses several environment variables. Please copy .env.example into .env, then fill in the values with your own. For third-party environment variables such as Spotify, Wakatime, Firebase, and others, please refer to the official documentation provided by each provider.

```
BUNDLE_ANALYZER=false
SITE_URL=https://lucas.untethered4life.com

# Blog
BLOG_API_URL=

# OpenAI
OPENAI_API_KEY=

# DEV.to
DEVTO_KEY=

# Spotify
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=

# WakaTime
WAKATIME_API_KEY=

# GitHub
GITHUB_READ_USER_TOKEN_PERSONAL=
GITHUB_READ_USER_TOKEN_WORK=

# Prisma Database
DATABASE_URL='postgres://USER:PASSWORD@HOST:5432/postgres'

# Contact Form
CONTACT_FORM_API_KEY=

# Next-Auth SSO
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 4. Run the development server

You can start the server using this command:git 

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can start editing the page by modifying `src/pages/index.tsx`.
<br /><br />

## License

Licensed under the [GPL-3.0 license](https://github.com/LucasPMorris/profile_site/blob/master/LICENSE).