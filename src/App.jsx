import { useState, useEffect, useRef, useCallback } from 'react'
import { T } from './constants/theme.js'
import { load, save, MSGS_KEY, LOGS_KEY, SYMPTOM_KEY, DOCTORS_KEY, ONBOARD_KEY, SCREEN_KEY } from './lib/utils.js'
import {
  supabase, getSession, onAuthChange, signOut,
  fetchMessages, upsertMessage, deleteMessage, updateMessageMeta,
  fetchFoodLogs, insertFoodLog, updateFoodLog,
  fetchSymptomLogs, insertSymptomLog,
  fetchUserData, saveUserData,
} from './lib/supabase.js'
import { Auth } from './components/Auth.jsx'
import { ContactsScreen } from './components/ContactsScreen.jsx'
import { ChatScreen } from './components/ChatScreen.jsx'
import { ProfileScreen } from './components/ProfileScreen.jsx'
import { AnalysisScreen } from './components/AnalysisScreen.jsx'

export default function App() {
  const [session,      setSession]      = useState(undefined)
  const [screen,       setScreen]       = useState(()=>load(SCREEN_KEY,'contacts'))
  const [messages,     setMessages]     = useState(()=>load(MSGS_KEY,[]))
  const [foodLogs,     setFoodLogs]     = useState(()=>load(LOGS_KEY,[]))
  const [symptomLogs,  setSymptomLogs]  = useState(()=>load(SYMPTOM_KEY,[]))
  const [doctors,      setDoctors]      = useState(()=>load(DOCTORS_KEY,[]))
  const [onboarded,    setOnboarded]    = useState(()=>load(ONBOARD_KEY,false))
  const [profile,      setProfile]      = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const supabaseLoaded = useRef(false)

  // ── Auth ────────────────────────────────────────────────────────────────────

  useEffect(()=>{
    if(!supabase) { setSession(null); return }
    getSession().then(s=>setSession(s))
    const unsub = onAuthChange((event, s) => {
      if(event === 'PASSWORD_RECOVERY') return
      setSession(s)
    })
    return unsub
  },[])

  // ── Load from Supabase when session starts ──────────────────────────────────

  useEffect(()=>{
    if(!session?.user?.id) return
    supabaseLoaded.current = false
    const uid = session.user.id
    Promise.all([
      fetchMessages(uid),
      fetchFoodLogs(uid),
      fetchSymptomLogs(uid),
      fetchUserData(uid),
    ]).then(([msgs, logs, symptoms, userData])=>{
      if(msgs     != null) { setMessages(msgs);                    save(MSGS_KEY,    msgs) }
      if(logs     != null) { setFoodLogs(logs);                    save(LOGS_KEY,    logs) }
      if(symptoms != null) { setSymptomLogs(symptoms);             save(SYMPTOM_KEY, symptoms) }
      if(userData != null) {
        setDoctors(userData.doctors ?? []);                        save(DOCTORS_KEY, userData.doctors ?? [])
        setOnboarded(userData.onboarded ?? false);                 save(ONBOARD_KEY, userData.onboarded ?? false)
      }
      supabaseLoaded.current = true
    })
  },[session?.user?.id])

  // ── localStorage mirror (offline / no-Supabase fallback) ───────────────────

  useEffect(()=>save(MSGS_KEY,    messages),    [messages])
  useEffect(()=>save(LOGS_KEY,    foodLogs),    [foodLogs])
  useEffect(()=>save(SYMPTOM_KEY, symptomLogs), [symptomLogs])
  useEffect(()=>save(DOCTORS_KEY, doctors),     [doctors])
  useEffect(()=>save(ONBOARD_KEY, onboarded),   [onboarded])
  useEffect(()=>save(SCREEN_KEY,  screen),      [screen])

  // ── Mutation helpers ────────────────────────────────────────────────────────

  const userId = session?.user?.id

  const addMessage = useCallback((msg)=>{
    setMessages(p=>[...p, msg])
    if(userId) upsertMessage(msg, userId)
  },[userId])

  const removeMessage = useCallback((id)=>{
    setMessages(p=>p.filter(m=>m.id!==id))
    if(userId) deleteMessage(id, userId)
  },[userId])

  const patchMessage = useCallback((id, updates)=>{
    setMessages(p=>p.map(m=>m.id===id ? {...m,...updates} : m))
    if(userId) updateMessageMeta(id, updates, userId)
  },[userId])

  const addFoodLog = useCallback(async (log)=>{
    let dbId = null
    if(userId) dbId = await insertFoodLog(log, userId)
    setFoodLogs(p=>[...p, dbId ? {...log, _dbId: dbId} : log])
    return dbId
  },[userId])

  const patchFoodLog = useCallback((msgId, patch)=>{
    setFoodLogs(p=>p.map(l=>{
      if(l._msgId !== msgId) return l
      if(l._dbId && userId) updateFoodLog(l._dbId, patch, userId)
      return {...l, ...patch}
    }))
  },[userId])

  const addSymptomLog = useCallback(async (log)=>{
    let dbId = null
    if(userId) dbId = await insertSymptomLog(log, userId)
    setSymptomLogs(p=>[...p, dbId ? {...log, _dbId: dbId} : log])
  },[userId])

  const addDoctor = useCallback((doc)=>{
    setDoctors(prev=>{
      if(prev.find(d=>d.id===doc.id)) return prev
      const next = [...prev, doc]
      if(userId) saveUserData(userId, { doctors: next, onboarded })
      return next
    })
  },[userId, onboarded])

  const setOnboardedPersisted = useCallback((v)=>{
    setOnboarded(v)
    save(ONBOARD_KEY, v)
    if(userId) saveUserData(userId, { doctors, onboarded: v })
  },[userId, doctors])

  // ── Render ──────────────────────────────────────────────────────────────────

  if(session === undefined) {
    return (
      <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:T.bg}}>
        <div style={{width:36,height:36,borderRadius:'50%',border:`3px solid ${T.border}`,borderTopColor:T.coral,animation:'patchSpin 0.7s linear infinite'}}/>
        <style>{`@keyframes patchSpin{to{transform:rotate(360deg);}}`}</style>
      </div>
    )
  }

  if(session === null && supabase !== null) {
    return <Auth onAuth={s=>setSession(s)}/>
  }

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",height:'100dvh',maxWidth:430,margin:'0 auto',position:'relative',overflow:'hidden',background:T.bg}}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0;touch-action:manipulation;}
        body{background:#FAF8F5;overscroll-behavior:none;}
        button,a,input,textarea,select{touch-action:manipulation;}
        input,textarea{font-size:16px!important;}
        ::-webkit-scrollbar{display:none;}
        @keyframes pdot{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-5px);}}
        @keyframes pfadeup{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pslide{from{transform:translateX(30px);opacity:0;}to{transform:translateX(0);opacity:1;}}
        @keyframes patchSpin{to{transform:rotate(360deg);}}
        textarea{resize:none;}
        input[type=range]{cursor:pointer;touch-action:none;}
      `}</style>

      {screen==='contacts'&&(
        <ContactsScreen doctors={doctors} msgCount={messages.length}
          onOpenChat={()=>setScreen('chat')}
          onAddDoctor={addDoctor}
          onOpenAnalysis={()=>setShowAnalysis(true)}
          onOpenProfile={setProfile}
          onSignOut={()=>setSession(null)}/>
      )}
      {screen==='chat'&&(
        <ChatScreen messages={messages}
          addMessage={addMessage}
          patchMessage={patchMessage}
          removeMessage={removeMessage}
          foodLogs={foodLogs}
          addFoodLog={addFoodLog}
          patchFoodLog={patchFoodLog}
          symptomLogs={symptomLogs}
          addSymptomLog={addSymptomLog}
          onBack={()=>setScreen('contacts')}
          onboarded={onboarded}
          setOnboarded={setOnboardedPersisted}
          onOpenProfile={setProfile}/>
      )}
      {showAnalysis&&(
        <AnalysisScreen foodLogs={foodLogs} symptomLogs={symptomLogs} onBack={()=>setShowAnalysis(false)}/>
      )}
      {profile&&(
        <ProfileScreen doc={profile} foodLogs={foodLogs} symptomLogs={symptomLogs} onBack={()=>setProfile(null)}/>
      )}
    </div>
  )
}
