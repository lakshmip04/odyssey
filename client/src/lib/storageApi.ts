import { supabase } from './supabaseClient'

const BUCKET_NAME = 'travel-journal-photos'

/**
 * Upload a photo to Supabase Storage
 * @param file - The file to upload
 * @param userId - The user ID (for organizing files)
 * @param entryId - The journal entry ID (optional, for organizing files)
 * @returns The public URL of the uploaded file
 */
export async function uploadPhoto(
  file: File,
  userId: string,
  entryId?: string
): Promise<string> {
  // Generate a unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${entryId || 'temp'}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  
  // Upload the file
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`)
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * Upload multiple photos to Supabase Storage
 * @param files - Array of files to upload
 * @param userId - The user ID
 * @param entryId - The journal entry ID (optional)
 * @returns Array of public URLs
 */
export async function uploadPhotos(
  files: File[],
  userId: string,
  entryId?: string
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadPhoto(file, userId, entryId))
  return Promise.all(uploadPromises)
}

/**
 * Delete a photo from Supabase Storage
 * @param url - The public URL of the photo to delete
 * @returns void
 */
export async function deletePhoto(url: string): Promise<void> {
  // Extract the path from the URL
  // Supabase storage URLs are in format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === BUCKET_NAME)
    
    if (bucketIndex === -1) {
      throw new Error('Invalid photo URL: bucket not found')
    }
    
    // Get everything after the bucket name
    const path = pathParts.slice(bucketIndex + 1).join('/')
    
    if (!path) {
      throw new Error('Invalid photo URL: path is empty')
    }
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      throw new Error(`Failed to delete photo: ${error.message}`)
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to delete photo: Invalid URL format')
  }
}

/**
 * Delete multiple photos from Supabase Storage
 * @param urls - Array of public URLs to delete
 * @returns void
 */
export async function deletePhotos(urls: string[]): Promise<void> {
  const deletePromises = urls.map(url => deletePhoto(url))
  await Promise.all(deletePromises)
}

/**
 * Check if a URL is from Supabase Storage (vs external URL)
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage/v1/object/public')
}

