import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force this route to be dynamic and never run at build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Initialize Supabase client inside the handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    // Check if we have the API environment variables
    const envStatus = {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
    }
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        apiStatus: "degraded",
        error: "Missing Supabase credentials",
        timestamp: new Date().toISOString(),
        environmentVariables: envStatus
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check for active model in db
    const { data: modelData, error: modelError } = await supabase
      .from('chess_models')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    // Check all storage buckets
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()

    // Check if chess-models bucket exists
    let modelFiles: any[] = []
    let fileUrls: any[] = []
    
    if (buckets?.some(bucket => bucket.name === 'chess-models')) {
      // Get files in the bucket
      const { data: files, error: filesError } = await supabase
        .storage
        .from('chess-models')
        .list()

      if (!filesError && files) {
        modelFiles = files
        
        // Get public URLs for files
        for (const file of files) {
          const { data: urlData } = await supabase
            .storage
            .from('chess-models')
            .getPublicUrl(file.name)
            
          if (urlData) {
            fileUrls.push({
              name: file.name,
              url: urlData.publicUrl
            })
          }
        }
      }
    }
    
    // Check openings table
    const { data: openingsCount, error: openingsError } = await supabase
      .from('chess_openings')
      .select('id', { count: 'exact', head: true })
    
    // Get most recently updated openings
    const { data: recentOpenings, error: recentOpeningsError } = await supabase
      .from('chess_openings')
      .select('fen, next_moves')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      apiStatus: "online",
      timestamp: new Date().toISOString(),
      environmentVariables: envStatus,
      modelInfo: {
        active: modelData || null,
        error: modelError ? modelError.message : null
      },
      storage: {
        buckets: buckets || [],
        bucketsError: bucketsError ? bucketsError.message : null,
        modelFiles: modelFiles || [],
        modelFileUrls: fileUrls || []
      },
      openings: {
        count: openingsCount || 0,
        countError: openingsError ? openingsError.message : null,
        recent: recentOpenings || [],
        recentError: recentOpeningsError ? recentOpeningsError.message : null
      }
    })
  } catch (error) {
    console.error('Diagnostic API error:', error)
    return NextResponse.json({ 
      error: 'Diagnostic API error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 