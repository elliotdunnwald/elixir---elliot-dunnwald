# ELIXR Testing Checklist

## Task #16: Authentication and Profile Flows

### Basic Authentication (✓ Already Verified)
- [x] Sign up with new account
- [x] Profile creation works
- [x] Feed loads successfully
- [x] Sign out works

### Profile Management (To Test)

#### View Your Profile
1. Click "PROFILE" in navigation
2. Verify your name, location, and bio display correctly
3. Check that your gear items are listed

#### Edit Profile
1. On your profile page, look for an "Edit Profile" button
2. Try updating:
   - First/Last name
   - Bio
   - City/Country
   - Privacy setting (Public/Private toggle)
3. Save changes
4. Verify changes appear immediately

#### Gear Management
1. On your profile, find gear section
2. Try adding new gear item
3. Try removing a gear item
4. Verify changes persist after page refresh

#### Avatar Upload
1. Look for avatar/profile picture section
2. Upload an image (JPG/PNG under 5MB)
3. Verify image appears as your avatar
4. Check that avatar shows on your posts in feed

---

## Task #17: Real-Time Features and Social Interactions

### Setup: Create Second Test Account

#### Browser 1 (Your Main Account)
1. Keep current session open
2. Note your username

#### Browser 2 (Test Account)
1. Open app in Incognito/Private window: http://localhost:3000
2. Sign up with different email (e.g., test2@example.com)
3. Complete profile setup with different name
4. Note this username

### Test Real-Time Feed Updates

#### Test 1: New Post Appears in Real-Time
1. **Browser 2**: Follow your main account
   - Go to Explore
   - Search for your main account username
   - Click Follow

2. **Browser 1**: Create a new brew log
   - Click "+ LOG BREW"
   - Fill in brew details
   - Share the post

3. **Browser 2**: Watch the feed
   - ✓ New post should appear automatically (without refresh)
   - ✓ Should see it within 1-2 seconds

### Test Likes Feature

#### Test 2: Like a Post
1. **Browser 2**: Find a post from your main account
2. Click the heart/like button
3. **Browser 1**: Watch the same post
   - ✓ Like count should increment automatically
   - ✓ Should update within 1-2 seconds (no refresh needed)

#### Test 3: Unlike a Post
1. **Browser 2**: Click the like button again to unlike
2. **Browser 1**: Watch the like count
   - ✓ Like count should decrement automatically

### Test Comments Feature

#### Test 4: Add Comment
1. **Browser 2**: Find a post from your main account
2. Add a comment (e.g., "Great brew!")
3. Submit comment
4. **Browser 1**: Watch the post
   - ✓ Comment should appear immediately
   - ✓ Comment count should update

#### Test 5: Delete Comment
1. **Browser 2**: Delete your comment
2. **Browser 1**: Watch the post
   - ✓ Comment should disappear automatically

### Test Follow/Unfollow

#### Test 6: Follow User
1. **Browser 1**: Go to Explore
2. Search for the test account username
3. Click Follow
4. **Browser 2**: Check profile
   - ✓ Follower count should increase

#### Test 7: Unfollow User
1. **Browser 1**: Click Unfollow
2. **Browser 2**: Watch follower count
   - ✓ Should decrease automatically

### Test Private Profiles

#### Test 8: Private Profile Privacy
1. **Browser 2**: Go to profile settings
2. Toggle profile to Private
3. Sign out of Browser 2
4. **Browser 1**: Try to search for test account
   - ✓ Should not appear in search (unless you follow them)

### Test Activity Privacy

#### Test 9: Private Brew Logs
1. **Browser 1**: Create new brew log
2. Before sharing, toggle "Private" option
3. Share the post
4. **Browser 2**: Check feed
   - ✓ Private post should NOT appear (unless following)

---

## Performance Tests

### Test 10: Multiple Activities
1. Create 10+ brew logs
2. Scroll through feed
   - ✓ Infinite scroll loads more activities
   - ✓ Scrolling is smooth
   - ✓ Images load properly

### Test 11: Real-Time with Multiple Updates
1. Have both browsers open
2. Rapidly like/unlike posts from Browser 2
3. Watch Browser 1
   - ✓ Updates should not cause lag
   - ✓ UI should remain responsive

---

## Error Handling Tests

### Test 12: Offline Behavior
1. Open DevTools > Network tab
2. Select "Offline" mode
3. Try to create a post
   - ✓ Should show error message
   - ✓ Should not crash

### Test 13: Invalid Image Upload
1. Try to upload very large file (>10MB)
   - ✓ Should show error or prevent upload
2. Try to upload non-image file (PDF, etc.)
   - ✓ Should reject or show error

---

## Cleanup

After testing:
1. You can delete the test account if desired
2. You can delete test brew logs

---

## Known Issues / Notes

- Record any bugs or issues you find during testing
- Note: Real-time updates require active internet connection
- Supabase free tier supports up to 500MB database storage

---

## Sign-Off

When all tests pass, mark tasks as complete:
- [ ] Task #16: Profile management tests completed
- [ ] Task #17: Real-time features tests completed

