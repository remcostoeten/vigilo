/**
 * Experimental types for the Chrome built-in AI (Gemini Nano)
 * See: https://github.com/explainers-by-googlers/prompt-api
 */

export interface AISession {
    prompt(text: string): Promise<string>
    promptStreaming(text: string): AsyncIterable<string>
    destroy(): void
}

export interface WindowAI {
    canCreateTextSession(): Promise<'readily' | 'after-download' | 'no'>
    createTextSession(options?: {
        initialPrompts?: { role: 'system' | 'user' | 'assistant'; content: string }[]
    }): Promise<AISession>
}

declare global {
    interface Window {
        ai?: WindowAI
        // Polyfill or older spec support might use different names, 
        // but we target the latest `window.ai` spec.
    }
}

let session: AISession | null = null

/**
 * Checks if the browser supports the AI API and if the model is available.
 */
export async function isAIAvailable(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.ai) return false
    try {
        const status = await window.ai.canCreateTextSession()
        return status === 'readily'
    } catch (e) {
        console.warn('Error checking AI availability:', e)
        return false
    }
}

/**
 * Gets or creates a singleton AI session.
 */
async function getSession(): Promise<AISession | null> {
    if (!window.ai) return null
    if (session) return session

    try {
        const canCreate = await window.ai.canCreateTextSession()
        if (canCreate !== 'readily') return null

        // Create a session with a system prompt to guide behavior
        session = await window.ai.createTextSession({
            initialPrompts: [
                {
                    role: 'system',
                    content: `You are an intelligent task assistant. Your job is to rewrite the user's task input to be more clear and concise. 
          You should also infer a priority (!high, !medium, !low) and a relevant category tag (#work, #personal, #bug, #feature) if clearly applicable.
          Output ONLY the rewritten task text with the appended metadata. Do not explain anything.`,
                },
            ],
        })
        return session
    } catch (e) {
        console.error('Failed to create AI session:', e)
        return null
    }
}

/**
 * Enhances the given task text using local AI.
 */
export async function enhanceTask(text: string): Promise<string> {
    const session = await getSession()
    if (!session) {
        throw new Error('AI not available')
    }

    try {
        const result = await session.prompt(`Enhance this task: "${text}"`)
        return result.trim()
    } catch (e) {
        console.error('AI prompt failed:', e)
        // If prompt fails, the session might be dead or model crashed, reset it
        session.destroy()
        return text // Fallback to original
    }
}
