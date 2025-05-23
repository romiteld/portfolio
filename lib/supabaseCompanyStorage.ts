import { OpenAIEmbeddings } from '@langchain/openai'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { supabase } from './supabaseClient'

interface DocumentInput {
  pageContent: string
  metadata: Record<string, any>
}

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
})

export async function storeCompanyInfo(
  company: string,
  contents: { title: string; content: string; source: string }[]
) {
  try {
    const documents = contents.map(
      (item) => ({
        pageContent: item.content,
        metadata: {
          title: item.title,
          source: item.source,
          company,
          category: 'company_info',
          created_at: new Date().toISOString(),
        },
      } as DocumentInput)
    )

    await SupabaseVectorStore.fromDocuments(documents, embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents',
    })

    return { success: true, count: documents.length }
  } catch (error) {
    console.error('Error storing company info:', error)
    return { success: false, error }
  }
}

export async function queryCompanyInfo(query: string, limit = 5) {
  try {
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents',
    })

    const results = await vectorStore.similaritySearch(query, limit)

    return {
      success: true,
      results: results.map((doc: DocumentInput) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      })),
    }
  } catch (error) {
    console.error('Error querying company info:', error)
    return { success: false, error }
  }
}
