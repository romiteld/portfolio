import { OpenAI } from "openai"
import { type NextRequest, NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  const { message } = await req.json()

  if (!message) {
    return NextResponse.json({ error: "No message provided" }, { status: 400 })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: message }],
    })

    const reply = completion.choices[0].message.content

    return NextResponse.json({ message: reply })
  } catch (error) {
    console.error("Error calling OpenAI:", error)
    return NextResponse.json({ error: "Error generating response" }, { status: 500 })
  }
}

