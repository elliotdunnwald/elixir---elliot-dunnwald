# ELIXR Supabase Setup Guide

## Prerequisites
- A Supabase account (free tier works great for getting started)
- Node.js and npm installed
- ELIXR project cloned locally

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the details:
   - **Project Name**: elixr (or whatever you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users
   - **Pricing Plan**: Free tier is sufficient for development and small-scale production

## Step 2: Run Database Schema

1. In your Supabase dashboard, go to the **SQL Editor** tab
2. Create a new query
3. Copy the entire contents of `supabase_schema.sql` from this project
4. Paste it into the SQL Editor
5. Click "Run" to execute the schema
6. Verify all tables were created by going to the **Table Editor** tab

You should see these tables:
- profiles
- gear_items
- brew_activities
- follows
- likes
- comments

## Step 3: Create Storage Bucket

1. Go to the **Storage** tab in your Supabase dashboard
2. Click "Create a new bucket"
3. Name it: `brew-images`
4. Set as **Public bucket** (check the box)
5. Click "Create bucket"
6. Click on the `brew-images` bucket
7. Go to "Policies" and create these policies:

**Upload Policy:**
```sql
CREATE POLICY "Authenticated users can upload brew images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brew-images' AND auth.role() = 'authenticated');
```

**View Policy:**
```sql
CREATE POLICY "Anyone can view brew images"
ON storage.objects FOR SELECT
USING (bucket_id = 'brew-images');
```

**Update Policy:**
```sql
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brew-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Delete Policy:**
```sql
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'brew-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 4: Configure Authentication

1. Go to **Authentication** > **Providers** in Supabase dashboard
2. Enable **Email** provider (enabled by default)
3. Optional: Configure email templates under **Email Templates**
4. Optional: Disable email confirmation for development:
   - Go to **Authentication** > **Settings**
   - Uncheck "Enable email confirmations"
   - This allows instant signup without email verification

## Step 5: Get API Credentials

1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

## Step 6: Configure Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values:

```env
VITE_GEMINI_API_KEY=AIzaSyAW-y7g_Q8Vfaiw91m8cwwRtjZ3SjCykHs
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**IMPORTANT:** Use the **anon** key, NOT the service_role key! The service_role key bypasses RLS and should never be exposed to the client.

## Step 7: Start the Application

```bash
npm run dev
```

The app should now start at `http://localhost:3000`

## Step 8: Create Your First Account

1. Open the app in your browser
2. You'll see the new authentication screen
3. Click "NEW USER? CREATE ACCOUNT"
4. Enter your email and password
5. Complete the profile setup flow
6. You're in!

## Step 9: Test Features

Try these to verify everything works:

### Authentication
- [ ] Sign up with a new account
- [ ] Sign out
- [ ] Sign back in
- [ ] Session persists after page refresh

### Profile
- [ ] Complete profile setup
- [ ] Upload avatar image
- [ ] Edit profile information
- [ ] Share profile link

### Brew Logging
- [ ] Create a new brew log
- [ ] Upload a brew image
- [ ] Verify it appears in your feed
- [ ] Check it shows on your profile

### Social Features
- [ ] Search for users (you'll need to create a second account to test)
- [ ] Follow another user
- [ ] Verify their posts appear in your feed
- [ ] Like a brew post
- [ ] Comment on a brew post
- [ ] Verify likes/comments appear in real-time

### Real-Time (Multi-Window Test)
1. Open two browser windows side by side
2. Sign in as different users in each window
3. Have User A follow User B
4. User B creates a new brew log
5. Verify it appears immediately in User A's feed
6. User A likes the post
7. Verify like count updates in User B's window

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the dev server after changing environment variables

### Authentication errors
- Check that Email auth is enabled in Supabase dashboard
- Verify your password meets minimum requirements (6+ characters)
- Check browser console for detailed error messages

### RLS policy errors
- Verify all RLS policies were created correctly
- Check the Supabase logs in the dashboard under **Logs** > **Postgres Logs**
- Common issue: Trying to insert without being authenticated

### Images not uploading
- Verify the `brew-images` bucket exists and is public
- Check storage policies are configured correctly
- File size limit is 5MB by default

### Data not appearing
- Check browser console for errors
- Verify RLS policies allow the operation
- Check Supabase logs for database errors

## Migration from localStorage

If you were using the old localStorage version:

1. Sign up/sign in to your new account
2. You'll see a migration prompt if local data is detected
3. Click "IMPORT DATA" to transfer your brews
4. Your brew logs will be uploaded to Supabase
5. Local storage will be cleared

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add environment variables to your hosting platform:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Configure CORS in Supabase if needed:
   - Go to **Settings** > **API** > **CORS**
   - Add your production domain

3. Enable email confirmations in production:
   - Go to **Authentication** > **Settings**
   - Check "Enable email confirmations"

## Database Backups

Supabase automatically backs up your database daily on the free tier. You can also:

1. Go to **Database** > **Backups**
2. Create manual backups before major changes
3. Download backups as SQL files

## Monitoring

Monitor your app health:

1. **Database**: Check **Database** > **Metrics** for query performance
2. **API**: Check **API** > **Logs** for request logs
3. **Auth**: Check **Authentication** > **Logs** for auth events
4. **Storage**: Check **Storage** > **Usage** for bandwidth

## Cost Estimates

**Free Tier Limits:**
- 500MB database storage
- 1GB file storage
- 50,000 monthly active users
- 2GB bandwidth per month

**When to Upgrade:**
- If you exceed storage limits
- If you need more bandwidth
- If you need better support

**Pro Tier ($25/month):**
- 8GB database storage
- 100GB file storage
- Unlimited MAUs
- 250GB bandwidth

## Support

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: Great community support
- **ELIXR Issues**: Report bugs specific to ELIXR integration

## Next Steps

Once everything is working:

1. Invite friends to test the real-time features
2. Customize your profile with avatar and bio
3. Start logging your brews
4. Build your coffee network
5. Share your profile link to grow your followers

Enjoy the fully connected ELIXR experience!
