# How to Get API Keys (Step-by-Step)

Quick guide to get your FREE API keys for transcript cleanup.

---

## 🚀 Groq API Key (Recommended)

**Why Groq:** Fast, generous free tier (6,000 requests/day), easy setup.

### Step-by-Step

1. **Go to Groq Console**

   - Visit: https://console.groq.com/
   - Click "Sign Up" (or "Log In" if you have an account)

2. **Sign Up**

   - You can sign up with:
     - Google account (easiest)
     - GitHub account
     - Email + password
   - Accept terms and conditions

3. **Verify Email** (if using email signup)

   - Check your inbox
   - Click verification link

4. **Create API Key**

   - Once logged in, you'll see the dashboard
   - Look for "API Keys" in the left sidebar (or top menu)
   - Click "Create API Key"
   - Give it a name like "Podcast Transcription"
   - Click "Create"

5. **Copy Your Key**
   - You'll see your API key: `gsk_...`
   - **IMPORTANT:** Copy it immediately - you won't see it again!
   - Store it safely (you'll need it for GitHub Secrets)

### What You Get (FREE)

- ✅ 6,000 requests per day
- ✅ 30 requests per minute
- ✅ Access to Llama 3.1 70B and other models
- ✅ No credit card required

---

## 🌐 Google Gemini API Key (Alternative)

**Why Gemini:** Google's AI, reliable, also has free tier.

### Step-by-Step

1. **Go to Google AI Studio**

   - Visit: https://makersuite.google.com/app/apikey
   - Or: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Accept Terms**

   - Read and accept Google's terms of service
   - You may need to agree to some additional policies

3. **Create API Key**

   - Click "Get API Key" or "Create API Key"
   - Choose "Create API key in new project" (recommended)
   - Or select an existing Google Cloud project if you have one

4. **Copy Your Key**

   - You'll see your API key: `AIza...`
   - Click the copy button
   - Store it safely

5. **Enable the API** (if needed)
   - Sometimes you need to enable "Generative Language API"
   - If prompted, click "Enable API"
   - Wait a few seconds for activation

### What You Get (FREE)

- ✅ 1,500 requests per day
- ✅ 15 requests per minute
- ✅ Access to Gemini 1.5 Flash
- ✅ No credit card required

---

## 🔐 Add Keys to GitHub

Once you have your API keys:

### 1. Go to Repository Settings

```
Your Repository → Settings → Secrets and variables → Actions
```

### 2. Click "New repository secret"

### 3. Add Groq Key

- **Name:** `GROQ_API_KEY`
- **Value:** Paste your Groq key (starts with `gsk_`)
- Click "Add secret"

### 4. Add Gemini Key (Optional)

- **Name:** `GEMINI_API_KEY`
- **Value:** Paste your Gemini key (starts with `AIza`)
- Click "Add secret"

**Note:** You only need ONE of them (Groq OR Gemini), but having both gives you a backup option!

---

## ✅ Verify Setup

After adding secrets, verify they're set:

1. Go to your repository
2. Settings → Secrets and variables → Actions
3. You should see:
   - ✅ `ASSEMBLYAI_API_KEY`
   - ✅ `GROQ_API_KEY` (or `GEMINI_API_KEY`)

---

## 🎯 Quick Comparison

| Feature               | Groq                | Gemini           |
| --------------------- | ------------------- | ---------------- |
| **Free Requests/Day** | 6,000               | 1,500            |
| **Speed**             | Very Fast           | Fast             |
| **Model**             | Llama 3.1 70B       | Gemini 1.5 Flash |
| **Signup**            | Email/Google/GitHub | Google only      |
| **Ease of Use**       | ⭐⭐⭐⭐⭐          | ⭐⭐⭐⭐         |

**Recommendation:** Start with **Groq** - it's faster and has higher limits!

---

## 🔒 Security Tips

✅ **DO:**

- Keep API keys secret
- Store them in GitHub Secrets
- Use different keys for different projects

❌ **DON'T:**

- Share your API keys publicly
- Commit keys to git
- Post keys in issues or PRs

---

## 🐛 Troubleshooting

### "Invalid API Key" (Groq)

1. Make sure you copied the entire key
2. Check for extra spaces
3. Regenerate the key if needed

### "API Key Not Found" (Gemini)

1. Make sure the Generative Language API is enabled
2. Wait a few minutes after creating the key
3. Try creating a new key

### "Rate Limit Exceeded"

- **Groq:** You've hit 6,000 requests/day - wait until tomorrow
- **Gemini:** You've hit 1,500 requests/day - switch to Groq or wait

### GitHub Secret Not Working

1. Check the secret name is EXACTLY `GROQ_API_KEY` or `GEMINI_API_KEY`
2. Try updating the secret (delete and re-add)
3. Make sure you're in the right repository

---

## 📚 Links

- **Groq Console:** https://console.groq.com/
- **Groq Docs:** https://console.groq.com/docs
- **Gemini API:** https://aistudio.google.com/app/apikey
- **Gemini Docs:** https://ai.google.dev/docs

---

## ✨ Next Steps

Once you have your API keys set up:

1. ✅ Add them to GitHub Secrets
2. ✅ Go to Actions → Transcribe Episode
3. ✅ Run your first transcription with AI cleanup!

Need help? Check the [GitHub Actions Setup Guide](TRANSCRIPTION_GITHUB_SETUP.md)!
