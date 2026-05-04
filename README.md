# 🤖 AI Page Summarizer Chrome Extension

A Chrome Extension (Manifest V3) that extracts content from any webpage, sends it to an AI backend, and returns a clean, structured summary with optional in-page highlighting.

---

## 🚀 Features

* 📄 Extracts meaningful content from web pages
* 🤖 AI-powered summarization (via backend API)
* 🧠 Bullet-point summaries (3 or 5 bullets)
* ✨ Highlights key points directly on the page
* ⚡ Caches summaries per URL (no duplicate API calls)
* 🌙 Dark mode support
* 📋 Copy-to-clipboard with feedback
* ⏱️ Reading time + word count
* ♿ Keyboard accessible + screen reader support (aria-live)

---

## 🏗️ Project Structure

```
AI-summarizer/
│
├── frontend/                 # Chrome Extension (React + Vite)
│   ├── src/
│   │   └── popup/            # Popup UI (App.jsx)
│   ├── content.js            # Content script (extract + highlight)
│   ├── background.js         # Service worker (handles AI calls)
│   ├── manifest.json         # Chrome extension config (MV3)
│
├── backend/                  # Node.js API server
│   ├── server.js             # Express server
│   ├── package.json
│   └── .env                  # API keys (NOT committed)
│
└── .gitignore
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```
git clone https://github.com/YOUR_USERNAME/AI-Page-Summarizer-Chrome-Extension.git
cd AI-Page-Summarizer-Chrome-Extension
```

---

### 2. Backend Setup

```
cd backend
npm install
```

Create a `.env` file:

```
OPENAI_API_KEY=your_api_key_here
PORT=3000
```

Start backend server:

```
npm start
```

Server will run on:

```
http://localhost:3000
```

---

### 3. Frontend (Chrome Extension) Setup

```
cd ../frontend
npm install
npm run build
```

---

### 4. Load Extension in Chrome

1. Open Chrome
2. Go to:

   ```
   chrome://extensions/
   ```
3. Enable **Developer Mode**
4. Click **Load unpacked**
5. Select:

   ```
   frontend/dist
   ```

---

## 🧠 Architecture Explanation

### 🔄 Flow

1. User clicks **“Summarize”** in popup
2. Popup sends message → **content script**
3. Content script extracts clean page content
4. Content is sent → **background service worker**
5. Background sends request → **backend API**
6. Backend calls **AI provider**
7. AI response → background → popup
8. Popup displays summary + triggers highlighting

---

### 📡 Messaging Layers

* `popup → content.js` → get page content
* `popup → background.js` → request AI summary
* `background.js → backend` → secure API call

---

## 🤖 AI Integration

* AI calls are handled **only in the backend**
* Endpoint:

  ```
  POST /summarize
  ```
* Request:

  ```json
  {
    "content": "page text",
    "mode": "3 or 5"
  }
  ```
* Response:

  ```json
  {
    "summary": "bullet points"
  }
  ```

### Why backend?

* Prevents exposing API keys in frontend
* Allows control over request formatting
* Enables scaling and rate limiting

---

## 🔒 Security Decisions

* ✅ API keys stored in `.env` (not committed)
* ✅ No secrets in frontend or content script
* ✅ All AI calls routed through backend
* ✅ Minimal Chrome permissions used
* ✅ No `dangerouslySetInnerHTML` (prevents XSS)
* ✅ Message passing validated before use
* ✅ Content highlighting avoids unsafe injection

---

## ⚖️ Trade-offs

### 1. Simplicity vs Accuracy

* Used heuristic content extraction (faster)
* Could be improved with readability libraries

### 2. Local Backend vs Cloud Deployment

* Uses `localhost:3000` for development
* Easier setup but requires backend running

### 3. Caching Strategy

* Used `chrome.storage.local`
* Improves speed but may store stale summaries

### 4. Highlighting Logic

* Simple text matching
* Not 100% accurate for all pages

---

## 🧪 Testing

* Works on most article/blog pages
* Tested with:

  * News sites
  * Blogs
  * Documentation pages

---

## 📦 Technical Stack

* Frontend: React + Vite
* Extension: Chrome Manifest V3
* Backend: Node.js + Express
* AI: OpenAI API (via backend)

---

## 🎯 Future Improvements

* Better content extraction (Readability.js)
* Deploy backend (Vercel / Render)
* Add user settings panel
* Improve highlight accuracy
* Add multi-language support

---


---

## 👩‍💻 Author

Georgina617

---

## 📜 License

MIT License
