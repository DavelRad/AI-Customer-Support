import { NextResponse } from 'next/server'
import { getRelevantContext } from '../../utils/retrieval'

const systemPrompt = `You are an intelligent and friendly customer support assistant for Headstarter, a platform that facilitates AI-powered interviews for software engineering (SWE) job candidates. Your goal is to provide clear, helpful, and concise answers to users' queries while maintaining a professional and supportive tone. Use the following context to inform your responses, but don't mention the context explicitly in your answer. If the context doesn't contain relevant information, rely on your general knowledge about Headstarter:

{context}

Remember to assist with questions about how the platform works, setting up interviews, technical issues, best practices for using AI in interviews, and understanding the features designed to help candidates succeed. When dealing with complex issues, guide users through troubleshooting steps and escalate unresolved issues to human support when necessary. Ensure users feel confident and supported as they navigate the Headstarter platform.`

export async function POST(req) {
  const data = await req.json()
  const userMessage = data[data.length - 1].content

  // Retrieve relevant context
  const context = await getRelevantContext(userMessage)

  const messages = [
    { role: 'system', content: systemPrompt.replace('{context}', context) },
    ...data
  ]

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://your-website-url.com',
      'X-Title': 'Headstarter Support Chat'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: messages,
      stream: true
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  async function* streamAsyncIterator() {
    let leftover = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) return
      
      const chunk = decoder.decode(value, { stream: true })
      const lines = (leftover + chunk).split('\n')
      leftover = lines.pop() || ''
  
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content || ''
            if (content) yield content
          } catch (e) {
            console.error('Error parsing JSON:', e)
          }
        }
      }
    }
  }

  return new NextResponse(streamAsyncIterator())
}