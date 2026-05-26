# Engineering Notes Library 📚🎓

A premium, highly creative web application combining a futuristic educational dashboard with a modern library aesthetic (**"Netflix + Modern Library + Student Dashboard"** theme) built for engineering students to organize, preview, share, and review semester study materials.

---

## 🎨 Theme & Visual Design
* **Academic Textures**: Pages styled with ruled school notebook lines, cream margins, and leather textures.
* **3D Animated Textbook Cards**: Courses are represented as physical books with customized leather textures, golden edges, and ribbed spines. Hovering over a card activates an opening page-turn 3D tilt animation to reveal note stats.
* **Glassmorphism & Neon Shadows**: Transparent panels, clean micro-animations, custom cursor glow tracking, and floating canvas neon star backdrops.
* **Responsive & Light/Dark Reading Mode**: Designed mobile-first for student reviewing on the go, with eye-comfort dark reading mode toggles.

---

## 🚀 Key Features

* **8 Semesters & 80 Courses**: Pre-seeded with exactly 10 subjects per semester (Semesters 1-8).
* **Multi-File Subject Index**: Students can upload and append multiple study guide sheets (PDFs, images, slide decks) under any single subject module.
* **Gmail-Only Secure Authentication**: Registration and login credentials are restricted to secure Google Mail accounts. Features emulation buttons for one-click Google SSO login.
* **On-Site Document Previewing & Download**: Dual-mode note viewer featuring:
  1. **Document Preview (Default)**: Renders the actual PDF/image document inside the website container using an `<iframe>` viewport.
  2. **Notebook Summary**: Ruled notebook binder displaying tags, contributors, and detailed course summaries.
  * Direct downloads count tracker.
* **Always-Visible Conditional Deletions**: Deletion options (trash-can icons and buttons) are always visible to maintain clear index transparency. However, they are programmatically disabled (`disabled`, `opacity-40`, `cursor-not-allowed`) for non-owners with tooltip warnings. Only the original uploader (or administrator) can click to delete files.
* **Discussion Forums & Ratings**: Subject sheets comments boards and 5-star student review ratings.
* **Analytical Admin Dashboard**: Custom SVG metric charts, server health checks, user rosters, and course creation forms.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide React (Icons).
* **Backend**: Node.js, Express.js, JWT, BcryptJS, Multer (File Uploads).
* **Database**: MongoDB (Mongoose) with an automatic **Failsafe Local JSON database fallback** (stores data to local files if no MongoDB connection is configured, allowing immediate running without database setup).

---

## 📥 Installation & Setup

Ensure you have [Node.js](https://nodejs.org) installed on your system.

### Step 1: Install Dependencies
Install packages for the root, frontend, and backend folders concurrently:
```bash
npm run install:all
```

### Step 2: Start Development Servers
Start both the React dev server (Port 3000) and Express server (Port 5000) concurrently with hot-reloading:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Step 3: Run the Single-Port Production Build
To host the frontend and backend together on a single port (Port 5000) for optimized loading:
1. Compile the React assets:
   ```bash
   npm run build --prefix client
   ```
2. Start the unified production server:
   ```bash
   npm run start:server
   ```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

---

## 🌐 Public Sharing via ngrok

To share your local production server with others around the world:
1. Ensure the production server is running on port 5000 (`npm run start:server`).
2. Start your ngrok tunnel:
   ```bash
   ngrok http 5000
   ```
3. Copy the generated public URL (e.g., `https://xxxx.ngrok-free.dev`) and share it. 
*(Note: Visitors simply click the blue **"Visit Site"** warning page shown by ngrok to enter the website).*

---

## 🔑 Demo Administrator Credentials
To log in as the default Administrator:
* **Email**: `admin@notes.edu`
* **Password**: `admin123`
