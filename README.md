# 🪶 Daily Quill
**A daily creative-writing web app built with Nuxt 3 + Supabase**  
Write short stories, keep your streak alive, and sharpen your imagination—one prompt at a time.

## ✨ Overview
Daily Quill is a lightweight writing platform designed for authors and hobbyists who want to practice creative writing every day.  
Each day, the app serves a randomized story prompt drawn from a curated library of genres and themes.  
Writers can log in, craft a short story, save it, and track their writing streak—similar to GitHub’s contribution chart, but for words instead of commits.

## 🧱 Tech Stack
- **Nuxt 3** – Front-end framework for fast, reactive pages  
- **Supabase** – Authentication + Postgres backend (user profiles, stories, prompts)  
- **PostgreSQL RLS (Row-Level Security)** – Ensures users only access their own stories  
- **HTML / CSS / JS** – Clean UI; script logic separated in `/public/js/story.js`

## 📁 Core Features
- **Daily Prompt Generator** – Randomly selects a genre and 2–3 elements (e.g. “Fantasy • princess • AI • ancient library”)  
- **User Authentication** – Sign up / login via Supabase Auth  
- **Story Storage** – Saves each day’s writing to the `stories` table (one per day per user)  
- **Writing Streak Tracker** – Calculates consecutive-day submissions  
- **Responsive UI** – Clean, minimalist writing space for distraction-free journaling

## 🗂 Project Structure

- /app/
-   app.vue -> stores main app that runs contains css style sheet as well. 

-   pages/
-       index.vue -> landing page that shows streak and current prompt
-       login.vue -> login and signup page
-       profile.vue -> view/edit profile contents (bio, pic) (stored via supabase)
-       write.html → write story and otpionally view current prompt

-   composables/
-       useProfiles.js -> dictates behavior of a profile object and functionality
-       userPrompts.js -> grabs prompts from supabase prompts table 
-       useStores.js -> dictates writing functionality and context (prompt/profile)


## 🧩 Database Schema
| Table | Purpose |
| ------- | --------- |
| `profiles` | User profiles (auth ID, display name) |
| `prompts` | List of genres + elements for daily rotation |
| `stories` | User submissions (one per day per user) |

Row-Level Security policies ensure users can **read and write only their own records.**

## 🚀 Getting Started
**Clone**
```bash
git clone https://github.com/yourusername/daily-quill.git
```
**Install dependencies**
```npm install```

***Set environment variables in .env***
```SUPABASE_URL=```
```SUPABASE_ANON_KEY=```

***Run dev server***
```npm run dev```
```Visit http://localhost:3000```

***🧠 Future Plans***
- 🖋 Markdown editor with rich text preview
- 🎯 User preferences (genre bias, word-count goals)
- 🔔 Email reminders for daily prompts via Supabase cron
- 🗣 Public prompt submissions and community leaderboard
- 📊 Data visualization of streak history

__***👤 Author***__
***Adam Lenarduzzi***
CS Student | Software Developer | Creator of Jarlang & Airport Escape
