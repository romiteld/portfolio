import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const photosDir = path.join(process.cwd(), 'photos')
const supportedInputFormats = ['.jpg', '.jpeg', '.png', '.gif', '.tiff']

async function convertToWebP() {
  try {
    // Read all files in the photos directory
    const files = fs.readdirSync(photosDir)
    
    // Filter for supported image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return supportedInputFormats.includes(ext)
    })
    
    console.log(`Found ${imageFiles.length} images to convert`)
    
    // Convert each image to WebP
    for (const file of imageFiles) {
      const inputPath = path.join(photosDir, file)
      const outputPath = path.join(photosDir, `${path.parse(file).name}.webp`)
      
      try {
        await sharp(inputPath)
          .webp({
            quality: 85, // Good balance between quality and file size
            effort: 6,  // Higher effort = better compression but slower
          })
          .toFile(outputPath)
        
        console.log(`Converted: ${file} → ${path.basename(outputPath)}`)
        
        // Delete original file after successful conversion
        fs.unlinkSync(inputPath)
        console.log(`Deleted original: ${file}`)
      } catch (err) {
        console.error(`Error converting ${file}:`, err)
      }
    }
    
    console.log('\nConversion complete!')
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      console.error('Error: photos directory not found')
    } else {
      console.error('Error:', error)
    }
  }
}

convertToWebP() 