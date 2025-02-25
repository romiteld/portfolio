import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'
import sharp from 'sharp'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in .env.local file')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function uploadPhoto(filePath: string) {
  try {
    const fileExt = path.extname(filePath)
    const fileName = `${Date.now()}${fileExt}`
    
    // Convert to WebP with high quality settings, maintaining original dimensions
    const processedImageBuffer = await sharp(filePath)
      .webp({ 
        quality: 90, // High quality
        effort: 6, // Maximum compression effort
        smartSubsample: true, // Better chroma subsampling
        nearLossless: true // Better quality preservation
      })
      .toBuffer()
    
    // Upload file to Supabase Storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('woodworking-photos')
      .upload(fileName, processedImageBuffer, {
        contentType: 'image/webp'
      })

    if (storageError) throw storageError

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('woodworking-photos')
      .getPublicUrl(fileName)

    // Insert record into photos table
    const { data: photoData, error: dbError } = await supabase
      .from('woodworking_photos')
      .insert([{ image_url: publicUrl }])
      .select()

    if (dbError) throw dbError

    console.log(`Successfully uploaded: ${fileName}`)
    return photoData
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw error
  }
}

// Example usage:
// const photoMetadata = {
//   title: "Custom Wooden Table",
//   description: "Handcrafted walnut dining table",
//   category: "furniture",
//   order: 1
// }
// uploadPhoto('./photos/table.jpg', photoMetadata) 