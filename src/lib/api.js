import { detectBarcodeAndFetch } from './barcode.js'
import { ALLERGENS } from '../constants/allergens.js'

export async function callClaude(messages, system, maxTokens=1000) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system, max_tokens: maxTokens }),
  })
  const d = await res.json()
  if (!res.ok) throw new Error(d.error || 'API error')
  return d.content?.[0]?.text || ''
}

export async function analyseFood(base64) {
  const barcodeResult = await detectBarcodeAndFetch(base64)

  if (barcodeResult && barcodeResult.ingredients.length > 0) {
    const enrichPrompt = `Product: ${barcodeResult.productName} by ${barcodeResult.brand}.
Ingredients: ${barcodeResult.ingredients.join(', ')}.
Identify likely and possible allergens from this list only: ${ALLERGENS.join(', ')}.
Return ONLY valid JSON: {"description":"one friendly sentence about this product","likely_allergens":[],"possible_allergens":[]}`

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: 400,
          system: 'You are Patch. Return only valid JSON, no markdown.',
          messages: [{ role: 'user', content: enrichPrompt }]
        })
      })
      const d = await res.json()
      const parsed = JSON.parse(d.content?.[0]?.text?.replace(/```json|```/g,'').trim())
      return {
        description: parsed.description || `${barcodeResult.productName} logged.`,
        ingredients: barcodeResult.ingredients,
        likely_allergens: parsed.likely_allergens || barcodeResult.allergens,
        possible_allergens: parsed.possible_allergens || [],
        productName: barcodeResult.productName,
        brand: barcodeResult.brand,
        nutritional: barcodeResult.nutritional,
        source: 'barcode'
      }
    } catch {
      return {
        description: `${barcodeResult.productName || 'Product'} logged.`,
        ingredients: barcodeResult.ingredients,
        likely_allergens: barcodeResult.allergens,
        possible_allergens: [],
        productName: barcodeResult.productName,
        brand: barcodeResult.brand,
        nutritional: barcodeResult.nutritional,
        source: 'barcode'
      }
    }
  }

  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      max_tokens: 800,
      system: 'You are Patch. Return only valid JSON, no markdown.',
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
        { type: 'text', text: `Analyse this food photo. Return ONLY valid JSON:
{"description":"one friendly sentence","ingredients":["..."],"likely_allergens":["Dairy"],"possible_allergens":["Gluten"]}
Only use allergens from: ${ALLERGENS.join(', ')}` }
      ]}]
    })
  })
  const d = await res.json()
  try {
    const parsed = JSON.parse(d.content?.[0]?.text?.replace(/```json|```/g,'').trim())
    return { ...parsed, productName: '', brand: '', nutritional: null, source: 'vision' }
  } catch {
    return { description: 'Meal logged.', ingredients: [], likely_allergens: [], possible_allergens: [], productName: '', brand: '', nutritional: null, source: 'vision' }
  }
}

export async function analyseSymptom(base64, context) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      max_tokens: 800,
      system: 'You are Patch. Return only valid JSON, no markdown.',
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
        { type: 'text', text: `Analyse this symptom photo. Context: ${context}
Return ONLY valid JSON:
{"severity":2,"observation":"1-2 warm friendly sentences","possible_conditions":["Acne"],"follow_up":"one short question"}
severity 0-5. Conditions: Acne, Rosacea, Eczema, Perioral Dermatitis, Dermatitis, Folliculitis, Psoriasis, Seborrhoea, Redness, Other.` }
      ]}]
    })
  })
  const d = await res.json()
  try {
    return JSON.parse(d.content?.[0]?.text?.replace(/```json|```/g,'').trim())
  } catch {
    return { severity: 2, observation: 'Got it, logged.', possible_conditions: [], follow_up: null }
  }
}

export async function buildAnalysis(foodLogs, symptomLogs) {
  if (foodLogs.length < 3 && symptomLogs.length < 2)
    return { summary: 'Keep logging — patterns usually emerge after about a week.', triggers: [], conditions: [], overall_confidence: 0, next_steps: 'Log meals and do your morning check-in each day.' }

  const text = await callClaude(
    [{ role: 'user', content: `Food logs: ${JSON.stringify(foodLogs.slice(-30))}
Symptom logs: ${JSON.stringify(symptomLogs.slice(-30))}
Analyse for correlations. Return ONLY valid JSON:
{"summary":"2-3 sentence friendly overview","triggers":[{"name":"Dairy","confidence":72,"evidence":"plain English"}],"conditions":[{"name":"Rosacea","likelihood":65,"note":"brief note"}],"overall_confidence":60,"next_steps":"one suggestion"}` }],
    'You are Patch. Friendly, concise. Return ONLY valid JSON.',
    1200
  )
  try {
    return JSON.parse(text.replace(/```json|```/g,'').trim())
  } catch {
    return { summary: 'Still building your picture...', triggers: [], conditions: [], overall_confidence: 0, next_steps: 'Keep logging daily.' }
  }
}

export async function analyseDay1(photos, answers) {
  const content = []
  const photoUrl = photos?.front || photos?.left || photos?.right
  if (photoUrl) {
    const base64 = photoUrl.split(',')[1]
    const mediaType = photoUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
    content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } })
  }
  const lines = [
    answers.duration     ? `Duration: ${answers.duration}` : null,
    answers.locations?.length ? `Location on face: ${answers.locations.join(', ')}` : null,
    answers.symptoms?.length  ? `Description: ${answers.symptoms.join(', ')}` : null,
    answers.triggers?.length  ? `Possible triggers: ${answers.triggers.join(', ')}` : null,
    answers.impact            ? `Impact on daily life: ${answers.impact}/5` : null,
  ].filter(Boolean).join('\n')
  content.push({ type: 'text', text: `New user skin assessment.\n${lines}\n\nAnalyse the photo and answers. Return ONLY valid JSON:\n{"condition":"most likely condition","severity":2,"summary":"2-3 warm friendly sentences, encouraging","observations":["short observation"],"confidence":65}\nConditions: Acne, Rosacea, Eczema, Perioral Dermatitis, Dermatitis, Folliculitis, Psoriasis, Seborrhoea, Redness, Contact Dermatitis, Other.\nseverity 0-5. Warm tone, not clinical.` })
  const res = await fetch('/api/claude', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ max_tokens: 600, system: 'You are Patch — a warm health companion. Return only valid JSON, no markdown.', messages: [{ role: 'user', content }] })
  })
  const d = await res.json()
  try {
    return JSON.parse(d.content?.[0]?.text?.replace(/```json|```/g, '').trim())
  } catch {
    return { condition: 'Skin concern', severity: 2, summary: "Thanks for sharing. Patch will keep an eye on things as you track.", observations: [], confidence: 0 }
  }
}

export const PATCH_SYSTEM = (foodLogs, symptomLogs, onboarded) => `You are Patch — a warm, intelligent health companion. Like a knowledgeable friend who genuinely wants to understand what's going on.

Your job: understand what's going on, track food and symptoms, find connections.

Personality:
- Warm, conversational, never clinical
- Ask ONE question at a time
- Be curious and perceptive
- Be warm and perceptive. You're helping the user understand their own patterns.
- Short responses — 1-3 sentences max

Data: ${foodLogs.length} food logs, ${symptomLogs.length} symptom checks.

${!onboarded
  ? `NEW USER. Start with ONE warm open question like "Hey! What's been going on that made you want to start tracking?" Follow their lead.`
  : `RETURNING USER. Continue naturally. React to logs as they come. Share insights proactively when relevant.`
}`
