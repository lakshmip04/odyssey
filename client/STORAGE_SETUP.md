# Supabase Storage Setup for Photo Uploads

This guide will help you set up Supabase Storage to enable photo uploads in the Travel Journal feature.

## Step 1: Create the Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Set the following:
   - **Name**: `travel-journal-photos`
   - **Public bucket**: ✅ Enable (check this box)
5. Click **Create bucket**

## Step 2: Set Up Storage Policies

Run the SQL script in your Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Open the file `supabase_storage_setup.sql` (located in the client directory)
3. Copy and paste the entire contents into the SQL Editor
4. Click **Run** to execute the script

This will create the necessary policies that allow:
- Authenticated users to upload their own photos
- Authenticated users to view their own photos
- Authenticated users to delete their own photos
- Public read access to photos (since the bucket is public)

## Step 3: Verify Setup

After running the SQL script, verify that:

1. The bucket `travel-journal-photos` exists in Storage
2. The bucket is marked as **Public**
3. The policies are created (check in **Storage** → **Policies**)

## How It Works

- Photos are organized by user ID: `{userId}/{entryId}/{filename}`
- Each user can only access their own photos
- Photos are automatically deleted when removed from journal entries
- Public URLs are generated for easy access

## Troubleshooting

### Error: "Failed to upload photo"
- Make sure the bucket exists and is public
- Verify the storage policies are set up correctly
- Check that the user is authenticated

### Error: "User not authenticated"
- Ensure the user is logged in
- Check that Supabase authentication is properly configured

### Photos not displaying
- Verify the bucket is set to **Public**
- Check that the public URL is being generated correctly
- Ensure the photo URLs are stored in the database

