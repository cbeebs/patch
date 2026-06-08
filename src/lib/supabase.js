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
// Schema: id, user_id, sender, msg_text, image_data, ts, metadata jsonb

function msgToRow(msg, userId) {
  const metadata = {}
  if (msg.allergenPicker) metadata.allergenPicker = msg.allergenPicker
  if (msg.allergenDone)   metadata.allergenDone   = msg.allergenDone
  return {
    id:         msg.id,
    user_id:    userId,
    sender:     msg.role,
    msg_text:   msg.text   ?? null,
    image_data: msg.image  ?? null,
    ts:         msg.ts,
    metadata,
  }
}

function rowToMsg(row) {
  const msg = { id: row.id, role: row.sender, ts: row.ts }
  if (row.msg_text   != null) msg.text  = row.msg_text
  if (row.image_data != null) msg.image = row.image_data
  if (row.metadata?.allergenPicker) msg.allergenPicker = row.metadata.allergenPicker
  if (row.metadata?.allergenDone)   msg.allergenDone   = row.metadata.allergenDone
  return msg
}

export async function fetchMessages(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('ts', { ascending: true })
  if (error) { console.error('fetchMessages:', error.message); return null }
  return data.map(rowToMsg)
}

export async function upsertMessage(msg, userId) {
  if (!supabase) return
  const { error } = await supabase.from('messages').upsert(msgToRow(msg, userId))
  if (error) console.error('upsertMessage:', error.message)
}

export async function deleteMessage(id, userId) {
  if (!supabase) return
  const { error } = await supabase
    .from('messages').delete().eq('id', id).eq('user_id', userId)
  if (error) console.error('deleteMessage:', error.message)
}

export async function updateMessageMeta(id, meta, userId) {
  if (!supabase) return
  const { data: existing } = await supabase
    .from('messages').select('metadata').eq('id', id).eq('user_id', userId).single()
  const merged = { ...(existing?.metadata ?? {}), ...meta }
  const { error } = await supabase
    .from('messages').update({ metadata: merged }).eq('id', id).eq('user_id', userId)
  if (error) console.error('updateMessageMeta:', error.message)
}

// ── Food logs ─────────────────────────────────────────────────────────────────
// Schema: id (uuid), user_id, log_date, meal_type, log_time, description,
//         ingredients jsonb, allergens jsonb, ts, is_pending, msg_ref

function logToRow(log, userId) {
  return {
    user_id:     userId,
    log_date:    log.date,
    meal_type:   log.meal        ?? null,
    log_time:    log.time        ?? null,
    description: log.description ?? null,
    ingredients: log.ingredients ?? [],
    allergens:   log.allergens   ?? [],
    ts:          log.ts,
    is_pending:  log._pending    ?? false,
    msg_ref:     log._msgId      ?? null,
  }
}

function rowToLog(row) {
  return {
    _dbId:       row.id,
    date:        row.log_date,
    meal:        row.meal_type   ?? null,
    time:        row.log_time    ?? null,
    description: row.description ?? null,
    ingredients: row.ingredients ?? [],
    allergens:   row.allergens   ?? [],
    ts:          row.ts,
    _pending:    row.is_pending  ?? false,
    _msgId:      row.msg_ref     ?? null,
  }
}

export async function fetchFoodLogs(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .order('ts', { ascending: true })
  if (error) { console.error('fetchFoodLogs:', error.message); return null }
  return data.map(rowToLog)
}

export async function insertFoodLog(log, userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('food_logs')
    .insert(logToRow(log, userId))
    .select('id')
    .single()
  if (error) { console.error('insertFoodLog:', error.message); return null }
  return data.id
}

export async function updateFoodLog(dbId, patch, userId) {
  if (!supabase) return
  const row = {}
  if ('allergens' in patch) row.allergens  = patch.allergens
  if ('_pending'  in patch) row.is_pending = patch._pending
  const { error } = await supabase
    .from('food_logs').update(row).eq('id', dbId).eq('user_id', userId)
  if (error) console.error('updateFoodLog:', error.message)
}

// ── Symptom logs ──────────────────────────────────────────────────────────────
// Schema: id (uuid), user_id, log_date, severity smallint, conditions jsonb, ts

function symptomToRow(log, userId) {
  return {
    user_id:    userId,
    log_date:   log.date,
    severity:   log.severity,
    conditions: log.conditions ?? [],
    ts:         log.ts,
  }
}

function rowToSymptom(row) {
  return {
    _dbId:      row.id,
    date:       row.log_date,
    severity:   row.severity,
    conditions: row.conditions ?? [],
    ts:         row.ts,
  }
}

export async function fetchSymptomLogs(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('user_id', userId)
    .order('ts', { ascending: true })
  if (error) { console.error('fetchSymptomLogs:', error.message); return null }
  return data.map(rowToSymptom)
}

export async function insertSymptomLog(log, userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('symptom_logs')
    .insert(symptomToRow(log, userId))
    .select('id')
    .single()
  if (error) { console.error('insertSymptomLog:', error.message); return null }
  return data.id
}

// ── User data (doctors + onboarded) ──────────────────────────────────────────
// Schema: user_id (pk), doctors jsonb, onboarded boolean, updated_at

export async function fetchUserData(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_data')
    .select('doctors, onboarded')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) { console.error('fetchUserData:', error.message); return null }
  return data ?? { doctors: [], onboarded: false }
}

export async function saveUserData(userId, { doctors, onboarded }) {
  if (!supabase) return
  const { error } = await supabase
    .from('user_data')
    .upsert({ user_id: userId, doctors, onboarded, updated_at: new Date().toISOString() })
  if (error) console.error('saveUserData:', error.message)
}
