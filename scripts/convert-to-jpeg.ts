import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const photosDir = path.join(process.cwd(), 'photos')
const supportedInputFormats = ['.jpg', '.jpeg', '.png', '.gif', '.tiff', '.webp']

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

async function convertToJPEG() {
  try {
    const files = fs.readdirSync(photosDir)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      // Skip files that are already JPEGs
      return supportedInputFormats.includes(ext) && 
             ext !== '.jpg' && 
             ext !== '.jpeg'
    })
    
    console.log(`Found ${imageFiles.length} non-JPEG images to convert`)
    
    for (const file of imageFiles) {
      const inputPath = path.join(photosDir, file)
      const outputPath = path.join(photosDir, `${path.parse(file).name}.jpg`)
      const tempPath = path.join(photosDir, `temp_${Date.now()}_${path.parse(file).name}.jpg`)
      
      try {
        // Process the image
        await retry(async () => {
          await sharp(inputPath)
            .jpeg({
              quality: 90,
              chromaSubsampling: '4:4:4'
            })
            .toFile(tempPath)

          console.log(`Converted: ${file} → ${path.basename(outputPath)}`)
          
          // Wait briefly before file operations
          await wait(100)
          
          // Move temp file to final destination
          await retry(async () => {
            if (fs.existsSync(outputPath)) {
              fs.unlinkSync(outputPath)
            }
            fs.renameSync(tempPath, outputPath)
          })
          
          // Delete original file
          await retry(async () => {
            fs.unlinkSync(inputPath)
            console.log(`Deleted original: ${file}`)
          })
        })
        
        // Wait between processing files
        await wait(200)
      } catch (err) {
        console.error(`Error converting ${file}:`, err)
        // Clean up temp file if it exists
        if (fs.existsSync(tempPath)) {
          try {
            fs.unlinkSync(tempPath)
          } catch (cleanupErr) {
            console.error(`Error cleaning up temp file: ${cleanupErr}`)
          }
        }
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

convertToJPEG() 