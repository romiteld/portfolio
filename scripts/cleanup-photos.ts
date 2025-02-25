import fs from 'fs'
import path from 'path'

const photosDir = path.join(process.cwd(), 'photos')

try {
  // Read all files in the photos directory
  const files = fs.readdirSync(photosDir)
  
  // Create a map to store filenames without extensions and their full filenames
  const fileMap = new Map<string, string[]>()
  
  // Group files by their base name (without extension and prefixes)
  files.forEach(file => {
    let baseName = path.parse(file).name
    // Remove common prefixes
    baseName = baseName.replace(/^(enhanced_|Resized_|temp_|IMG_)/i, '')
    
    const existing = fileMap.get(baseName) || []
    fileMap.set(baseName, [...existing, file])
  })
  
  let duplicatesRemoved = 0
  
  // Process each group of files
  fileMap.forEach((groupFiles, baseName) => {
    if (groupFiles.length > 1) {
      console.log(`\nFound duplicates for ${baseName}:`)
      groupFiles.forEach(file => console.log(`  ${file}`))
      
      // Keep the first jpg file, or the first file if no jpg exists
      const jpgFile = groupFiles.find(f => f.toLowerCase().endsWith('.jpg'))
      const fileToKeep = jpgFile || groupFiles[0]
      
      // Delete all other files
      groupFiles.forEach(file => {
        if (file !== fileToKeep) {
          const filePath = path.join(photosDir, file)
          fs.unlinkSync(filePath)
          console.log(`Deleted duplicate: ${file}`)
          duplicatesRemoved++
        }
      })
      
      console.log(`Kept: ${fileToKeep}`)
    }
  })
  
  console.log(`\nRemoved ${duplicatesRemoved} duplicate file(s)`)
} catch (error: any) {
  if (error?.code === 'ENOENT') {
    console.error('Error: photos directory not found')
  } else {
    console.error('Error:', error)
  }
} 