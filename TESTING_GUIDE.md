# ELIXR Testing Guide

Follow this guide to test all features of ELIXR after Supabase integration.

---

## ✅ TASK #16: Authentication & Profile Testing

### 1. Test Sign Out & Sign In

**Current Status:** Open http://localhost:3000/

**Desktop Users:**
- Look for **"SIGN OUT"** button in the top-right corner of the navigation bar
- Click it
- ✅ Verify: You're taken to the authentication screen

**Sign Back In:**
- Enter your email and password
- Click **"SIGN IN"**
- ✅ Verify: You land on your feed page

**Session Persistence:**
- Refresh the page (Cmd/Ctrl + R)
- ✅ Verify: You remain signed in (don't get kicked to login screen)

**Result:** [ ] Pass / [ ] Fail

---

### 2. Test Profile Viewing

- Click **"PROFILE"** in the navigation (or bottom bar on mobile)
- ✅ Verify: You see your profile with:
  - Your name
  - Your city/country
  - Your avatar (if uploaded)
  - Your brew logs

**Result:** [ ] Pass / [ ] Fail

---

### 3. Test Profile Editing

- On your profile page, look for **"Edit Profile"** or settings button
- Click it
- Try changing:
  - [ ] Bio
  - [ ] City
  - [ ] Avatar image (upload a new one)
- Click **"Save"** or similar
- ✅ Verify: Changes appear immediately on your profile

**Result:** [ ] Pass / [ ] Fail

---

### 4. Test Gear Management

- Go to your profile
- Click the **"GEAR"** tab
- Try searching for **"UFO DRIPPER V2"**
- ✅ Verify: It appears in search results
- Click to add it
- ✅ Verify: It shows in your gear list

**Custom Gear:**
- Type **"MY CUSTOM BREWER"** in the search
- ✅ Verify: You see **"ADD CUSTOM: MY CUSTOM BREWER"** button
- Click it
- ✅ Verify: It appears in your gear list

**Result:** [ ] Pass / [ ] Fail

---

## ✅ TASK #17: Real-Time Features Testing

**IMPORTANT:** This requires TWO user accounts. Do this in parallel browser windows.

### Setup: Create Second Account

1. Open a **new incognito/private browser window**
2. Go to http://localhost:3000/
3. Click **"NEW USER? CREATE ACCOUNT"**
4. Create account:
   - Email: `test2@test.com`
   - Password: `password123`
5. Complete profile setup with a different name (e.g., "Test User 2")

Now you have:
- **Window 1**: Your main account
- **Window 2**: Test account 2

---

### Test 1: Real-Time Feed Updates

**Setup:**
1. Window 1: Go to **Search/Explore**
2. Search for your second account's username
3. Click **"Follow"** button
4. ✅ Verify: Button changes to "Following"
5. Go back to **Feed** page

**Test:**
1. Window 2 (Test User 2): Click **"LOG BREW"** or the **+** button
2. Fill in brew details:
   - Title: "TEST REAL-TIME BREW"
   - Roaster: "ONYX"
   - Origin: "ETHIOPIA"
   - Rating: 8.5
   - (Fill in other required fields)
3. Upload an image (optional)
4. Click **"SHARE"**

**Verify in Window 1:**
- ✅ The new brew from Test User 2 appears in your feed **immediately** (no refresh needed)

**Result:** [ ] Pass / [ ] Fail

---

### Test 2: Real-Time Likes

**Setup:** Keep both windows open, with Test User 2's brew visible in Window 1's feed.

**Test:**
1. Window 1: Click the **❤️ heart icon** on Test User 2's brew
2. ✅ Verify in Window 1: Heart fills in, like count increases
3. ✅ Verify in Window 2: Like count updates **immediately** (no refresh)

**Result:** [ ] Pass / [ ] Fail

---

### Test 3: Real-Time Comments

**Test:**
1. Window 1: Click **💬 comment icon** on Test User 2's brew
2. Type a comment: "TESTING REAL-TIME COMMENTS!"
3. Click **Send** or press Enter
4. ✅ Verify in Window 1: Comment appears immediately
5. ✅ Verify in Window 2: Comment appears **immediately** (no refresh)

**Result:** [ ] Pass / [ ] Fail

---

### Test 4: Follow/Unfollow Real-Time

**Test:**
1. Window 1: Go to Test User 2's profile
2. Click **"Unfollow"**
3. ✅ Verify in Window 2: Follower count decreases immediately
4. Click **"Follow"** again
5. ✅ Verify in Window 2: Follower count increases immediately

**Result:** [ ] Pass / [ ] Fail

---

### Test 5: Private Posts

**Test:**
1. Window 1: Create a new brew log
2. Toggle **"Private"** visibility **ON** (eye icon should be closed)
3. Share the brew
4. ✅ Verify in Window 1: Post appears in your feed
5. ✅ Verify in Window 2: Post **does NOT** appear in Test User 2's feed (since they're following you, but it's private)

**Result:** [ ] Pass / [ ] Fail

---

## 🎯 Final Checklist

### Authentication & Profile (Task #16)
- [ ] Sign out works
- [ ] Sign in works
- [ ] Session persists on refresh
- [ ] Profile displays correctly
- [ ] Profile editing works
- [ ] Gear management works

### Real-Time Features (Task #17)
- [ ] Feed updates in real-time when following users post
- [ ] Likes update in real-time
- [ ] Comments update in real-time
- [ ] Follow/unfollow counts update in real-time
- [ ] Private posts are hidden correctly

---

## 🐛 If Something Fails

1. **Check browser console (F12 → Console tab)** for errors
2. **Check Supabase dashboard:**
   - Go to Supabase dashboard
   - Click **"Logs"** → **"Postgres Logs"**
   - Look for red error messages
3. **Verify environment variables:**
   - `.env.local` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. **Report the issue:**
   - Note which test failed
   - Copy any error messages
   - Describe what happened vs. what should have happened

---

## ✅ After Testing

Once all tests pass:
- Mark Task #16 as complete
- Mark Task #17 as complete
- You're ready to deploy to production!

🎉 **ELIXR is fully functional with real-time features!**
