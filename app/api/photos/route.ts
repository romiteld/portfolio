import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import sizeOf from 'image-size'

export async function GET() {
  try {
    const photosDir = path.join(process.cwd(), 'public', 'photos')
    const files = fs.readdirSync(photosDir)
    
    const photos = files
      .filter(file => /\.(jpg|jpeg)$/i.test(file))
      .map(file => {
        const filePath = path.join(photosDir, file)
        const dimensions = sizeOf(filePath)
        
        return {
          id: uuidv4(),
          src: `/photos/${file}`,
          alt: `Woodworking project - ${path.parse(file).name}`,
          width: dimensions.width || 800,
          height: dimensions.height || 600
        }
      })

    return NextResponse.json({ photos })
  } catch (error) {
    console.error('Error reading photos directory:', error)
    return NextResponse.json({ error: 'Failed to load photos' }, { status: 500 })
  }
} 