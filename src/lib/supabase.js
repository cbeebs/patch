import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_KEY) : null

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp(email, password) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function resetPassword(email) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/'
  })
  if (error) throw error
}

export async function updatePassword(newPassword) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthChange(callback) {
  if (!supabase) return () => {}
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(_event, session)
  })
  return () => subscription.unsubscribe()
}

// ── Messages ──────────────────────────────────────────────────────────────────

function msgToRow(msg, userId) {
  return {
    id: msg.id,
    user_id: userId,
    sender: msg.role,
    content: msg.text ?? null,
    image: msg.image ?? null,
    ts: msg.ts,
    allergen_picker: msg.allergenPicker ?? null,
    allergen_done: msg.allergenDone ?? false,
  }
}

function rowToMsg(row) {
  const m = { id: row.id, role: row.sender, ts: row.ts }
  if (row.content != null)         m.text = row.content
  if (row.image != null)           m.image = row.image
  if (row.allergen_picker != null) m.allergenPicker = row.allergen_picker
  if (row.allergen_done)           m.allergenDone = row.allergen_done
  return m
}

export async function fetchMessages(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('ts', { ascending: true })
  if (error) { console.error('fetchMessages', error); return null }
  return data.map(rowToMsg)
}

export async function insertMessage(msg, userId) {
  if (!supabase) return
  const { error } = await supabase.from('messages').upsert(msgToRow(msg, userId))
  if (error) console.error('insertMessage', error)
}

export async function deleteMessage(id, userId) {
  if (!supabase) return
  const { error } = await supabase.from('messages').delete().eq('id', id).eq('user_id', userId)
  if (error) console.error('deleteMessage', error)
}

export async function updateMessage(id, updates, userId) {
  if (!supabase) return
  const row = {}
  if ('allergenDone' in updates)  row.allergen_done   = updates.allergenDone
  if ('allergenPicker' in updates) row.allergen_picker = updates.allergenPicker
  if ('text' in updates)           row.content         = updates.text
  const { error } = await supabase.from('messages').update(row).eq('id', id).eq('user_id', userId)
  if (error) console.error('updateMessage', error)
}

// ── Food Logs ─────────────────────────────────────────────────────────────────

function logToRow(log, userId) {
  return {
    user_id: userId,
    log_date: log.date,
    meal: log.meal ?? null,
    log_time: log.time ?? null,
    description: log.description ?? null,
    ingredients: log.ingredients ?? [],
    allergens: log.allergens ?? [],
    ts: log.ts,
    pending: log._pending ?? false,
    msg_id: log._msgId ?? null,
    product_name: log.productName ?? null,
    brand: log.brand ?? null,
    nutritional: log.nutritional ?? null,
    source: log.source ?? null,
  }
}

function rowToLog(row) {
  const l = {
    _dbId: row.id,
    date: row.log_date,
    ts: row.ts,
    ingredients: row.ingredients ?? [],
    allergens: row.allergens ?? [],
    _pending: row.pending ?? false,
  }
  if (row.meal != null)     l.meal = row.meal
  if (row.log_time != null) l.time = row.log_time
  if (row.description != null)  l.description = row.description
  if (row.msg_id != null)       l._msgId = row.msg_id
  if (row.product_name != null) l.productName = row.product_name
  if (row.brand != null)        l.brand = row.brand
  if (row.nutritional != null)  l.nutritional = row.nutritional
  if (row.source != null)       l.source = row.source
  return l
}

export async function fetchFoodLogs(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .order('ts', { ascending: true })
  if (error) { console.error('fetchFoodLogs', error); return null }
  return data.map(rowToLog)
}

export async function insertFoodLog(log, userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('food_logs')
    .insert(logToRow(log, userId))
    .select('id')
    .single()
  if (error) { console.error('insertFoodLog', error); return null }
  return data.id
}

export async function updateFoodLog(dbId, updates, userId) {
  if (!supabase) return
  const row = {}
  if ('allergens' in updates)  row.allergens = updates.allergens
  if ('_pending' in updates)   row.pending   = updates._pending
  const { error } = await supabase.from('food_logs').update(row).eq('id', dbId).eq('user_id', userId)
  if (error) console.error('updateFoodLog', error)
}

// ── Symptom Logs ──────────────────────────────────────────────────────────────

function symptomToRow(log, userId) {
  return {
    user_id: userId,
    log_date: log.date,
    severity: log.severity,
    conditions: log.conditions ?? [],
    ts: log.ts,
  }
}

function rowToSymptom(row) {
  return { _dbId: row.id, date: row.log_date, severity: row.severity, conditions: row.conditions ?? [], ts: row.ts }
}

export async function fetchSymptomLogs(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('user_id', userId)
    .order('ts', { ascending: true })
  if (error) { console.error('fetchSymptomLogs', error); return null }
  return data.map(rowToSymptom)
}

export async function insertSymptomLog(log, userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('symptom_logs')
    .insert(symptomToRow(log, userId))
    .select('id')
    .single()
  if (error) { console.error('insertSymptomLog', error); return null }
  return data.id
}

// ── Doctors ───────────────────────────────────────────────────────────────────

function docToRow(doc, userId) {
  return {
    id: doc.id,
    user_id: userId,
    doc_name: doc.name,
    spec: doc.spec ?? null,
    initials: doc.initials ?? null,
    emoji: doc.emoji ?? null,
    bio: doc.bio ?? null,
  }
}

function rowToDoc(row) {
  const d = { id: row.id, name: row.doc_name }
  if (row.spec != null)     d.spec = row.spec
  if (row.initials != null) d.initials = row.initials
  if (row.emoji != null)    d.emoji = row.emoji
  if (row.bio != null)      d.bio = row.bio
  return d
}

export async function fetchDoctors(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) { console.error('fetchDoctors', error); return null }
  return data.map(rowToDoc)
}

export async function insertDoctor(doc, userId) {
  if (!supabase) return
  const { error } = await supabase.from('doctors').upsert(docToRow(doc, userId))
  if (error) console.error('insertDoctor', error)
}

export async function deleteDoctor(docId, userId) {
  if (!supabase) return
  const { error } = await supabase.from('doctors').delete().eq('id', docId).eq('user_id', userId)
  if (error) console.error('deleteDoctor', error)
}

// ── User Settings ─────────────────────────────────────────────────────────────

export async function fetchSettings(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_settings')
    .select('onboarded')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) { console.error('fetchSettings', error); return null }
  return data
}

export async function upsertSettings(userId, settings) {
  if (!supabase) return
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() })
  if (error) console.error('upsertSettings', error)
}
