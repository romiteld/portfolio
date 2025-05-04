import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const photosDir = path.join(process.cwd(), 'photos')

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to try operation with retries
async function retry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (retries > 0) {
      await wait(delay)
      return retry(operation, retries - 1, delay)
    }
    throw error
  }
}

async function enhancePhotos() {
  try {
    // Read all files in the photos directory
    const files = fs.readdirSync(photosDir)
    
    // Filter for WebP files
    const webpFiles = files.filter(file => path.extname(file).toLowerCase() === '.webp')
    
    console.log(`Found ${webpFiles.length} WebP files to enhance`)
    
    // Process each image
    for (const file of webpFiles) {
      const inputPath = path.join(photosDir, file)
      const outputPath = path.join(photosDir, `enhanced_${file}`)
      
      try {
        // Process the image
        await retry(async () => {
          await sharp(inputPath)
            // Adjust contrast and brightness
            .modulate({
              brightness: 1.05, // Slight brightness increase
              saturation: 1.1,  // Slight saturation increase
            })
            // Apply subtle sharpening
            .sharpen({
              sigma: 1.2,
              m1: 1.5,
              m2: 1.5,
              x1: 2,
              y2: 10,
              y3: 20,
            })
            // Reduce noise while preserving edges
            .median(1)
            // Convert to WebP with high quality
            .webp({
              quality: 90,      // Higher quality
              effort: 6,        // Maximum compression effort
              smartSubsample: true, // Intelligent chroma subsampling
              nearLossless: true    // Near-lossless compression
            })
            .toFile(outputPath)

          console.log(`Enhanced: ${file} → enhanced_${file}`)
          
          // Wait briefly before file operations
          await wait(100)
          
          // Replace original with enhanced version
          await retry(async () => {
            fs.unlinkSync(inputPath)
            fs.renameSync(outputPath, inputPath)
            console.log(`Replaced original with enhanced version: ${file}`)
          })
        })
        
        // Wait between processing files
        await wait(200)
      } catch (err) {
        console.error(`Error enhancing ${file}:`, err)
      }
    }
    
    console.log('\nEnhancement complete!')
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      console.error('Error: photos directory not found')
    } else {
      console.error('Error:', error)
    }
  }
}

enhancePhotos() 