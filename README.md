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
