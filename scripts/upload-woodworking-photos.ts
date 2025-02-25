import { uploadPhoto } from './upload-photos'
import path from 'path'
import fs from 'fs'

const photosDir = path.join(process.cwd(), 'photos')

async function uploadAllPhotos() {
  try {
    const files = fs.readdirSync(photosDir)
    const webpFiles = files.filter(file => path.extname(file).toLowerCase() === '.webp')
    
    console.log(`Found ${webpFiles.length} WebP files to upload`)
    
    for (const file of webpFiles) {
      try {
        const filePath = path.join(photosDir, file)
        await uploadPhoto(filePath)
        console.log(`Uploaded: ${file}`)
      } catch (error) {
        console.error(`Failed to upload ${file}:`, error)
      }
    }
    
    console.log('\nUpload complete!')
  } catch (error) {
    console.error('Error reading photos directory:', error)
  }
}

uploadAllPhotos() 