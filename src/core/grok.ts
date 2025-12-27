import type { TodoItem } from './types'

const GROK_API_URL = 'https://api.grok.x.ai/v1/chat/completions'

export type GrokConfig = {
  apiKey: string
}

/**
 * Calls the Grok API to complete a prompt.
 */
async function callGrok(prompt: string, apiKey: string, systemPrompt?: string): Promise<string> {
  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Grok API Error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (e) {
    console.error('Failed to call Grok API:', e)
    throw e
  }
}

/**
 * Uses Grok to parse unstructured text into structured tasks.
 */
export async function smartParseWithGrok(text: string, apiKey: string): Promise<TodoItem[]> {
  const systemPrompt = `You are a strict JSON parser. extract tasks from the user's text.
  Return ONLY a valid JSON array of objects with these keys: 
  - available keys: "text" (required), "dueDate" (ISO string, guess if relative), "priority" (low/medium/high), "tags" (string array).
  Do not explain. Return only JSON.`

  const prompt = `Text to parse: "${text}"`

  try {
    const jsonString = await callGrok(prompt, apiKey, systemPrompt)
    // Clean potential markdown code blocks if Grok wraps them
    const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim()
    const tasks = JSON.parse(cleanJson)

    if (Array.isArray(tasks)) {
      return tasks
    }
    return []
  } catch (e) {
    console.warn('Grok smart parse failed', e)
    return []
  }
}

/**
 * Uses Grok to enhance a single task string.
 */
export async function enhanceWithGrok(text: string, apiKey: string): Promise<string> {
  const systemPrompt = `Rewrite the task to be clear and concise. 
  Infer and append (!high/!medium/!low) and (#tag) if obvious. 
  Output ONLY the rewritten task string.`

  return callGrok(text, apiKey, systemPrompt)
}
