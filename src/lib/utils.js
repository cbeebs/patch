export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
export const fmtTime = ts => new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})
export const todayStr = () => new Date().toISOString().split("T")[0]
export const getMeal = h => h>=5&&h<11?"Breakfast":h>=11&&h<15?"Lunch":h>=15&&h<18?"Snack":"Dinner"
export const load = (k,fb) => { try { return JSON.parse(localStorage.getItem(k))??fb } catch { return fb } }
export const save = (k,v) => localStorage.setItem(k,JSON.stringify(v))

export const MSGS_KEY    = "patch_v4_messages"
export const LOGS_KEY    = "patch_v4_food_logs"
export const SYMPTOM_KEY = "patch_v4_symptom_logs"
export const DOCTORS_KEY = "patch_v4_doctors"
export const ONBOARD_KEY = "patch_v4_onboarded"
export const SCREEN_KEY  = "patch_v4_screen"
export const LETTERS_KEY   = "patch_v4_letters"
export const DAY1_KEY      = "patch_v4_day1"
export const FIRSTNAME_KEY = "patch_v4_firstname"
export const NOTIF_KEY     = "patch_v4_notif"
