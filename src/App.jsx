import { useState, useEffect, useRef, useCallback } from 'react'
import { T } from './constants/theme.js'
import { load, save, MSGS_KEY, LOGS_KEY, SYMPTOM_KEY, DOCTORS_KEY, ONBOARD_KEY, SCREEN_KEY, DAY1_KEY, FIRSTNAME_KEY } from './lib/utils.js'
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
import { Onboarding } from './components/Onboarding.jsx'
import { Day1Popover } from './components/Day1Popover.jsx'
import { SettingsScreen } from './components/SettingsScreen.jsx'

export default function App() {
  const [session,      setSession]      = useState(undefined)
  const [screen,       setScreen]       = useState(()=>load(SCREEN_KEY,'contacts'))
  const [messages,     setMessages]     = useState(()=>load(MSGS_KEY,[]))
  const [foodLogs,     setFoodLogs]     = useState(()=>load(LOGS_KEY,[]))
  const [symptomLogs,  setSymptomLogs]  = useState(()=>load(SYMPTOM_KEY,[]))
  const [doctors,      setDoctors]      = useState(()=>load(DOCTORS_KEY,[]))
  const [onboarded,    setOnboarded]    = useState(()=>load(ONBOARD_KEY,false))
  const [day1Data,     setDay1Data]     = useState(()=>load(DAY1_KEY,null))
  const [firstName,    setFirstName]    = useState(()=>load(FIRSTNAME_KEY,''))
  const [profile,      setProfile]      = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  // new overlay state
  const [redoingOnboarding, setRedoingOnboarding] = useState(false)
  const [showDay1Popover,   setShowDay1Popover]   = useState(false)
  const [day1PopClosing,    setDay1PopClosing]     = useState(false)
  const [showSettings,      setShowSettings]      = useState(false)
  const [settingsClosing,   setSettingsClosing]   = useState(false)

  // closing-animation state for overlays
  const [analysisClosing, setAnalysisClosing] = useState(false)
  const [profileClosing,  setProfileClosing]  = useState(false)
  const profileDocRef = useRef(null)
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

    // Reload local-only state that may have been written by DemoFlow before session was set
    const localD1 = load(DAY1_KEY, null)
    if (localD1) setDay1Data(localD1)
    const localFN = load(FIRSTNAME_KEY, '')
    if (localFN) setFirstName(localFN)
    // Show Day 1 popover if DemoFlow requested it
    const showD1Flag = load('patch_v4_show_day1', false)
    if (showD1Flag && localD1) {
      localStorage.removeItem('patch_v4_show_day1')
      setTimeout(()=> setShowDay1Popover(true), 800)
    }

    Promise.all([
      fetchMessages(uid),
      fetchFoodLogs(uid),
      fetchSymptomLogs(uid),
      fetchUserData(uid),
    ]).then(([msgs, logs, symptoms, userData])=>{
      if(msgs     != null) { setMessages(msgs);               save(MSGS_KEY,    msgs) }
      if(logs     != null) { setFoodLogs(logs);               save(LOGS_KEY,    logs) }
      if(symptoms != null) { setSymptomLogs(symptoms);        save(SYMPTOM_KEY, symptoms) }
      if(userData != null) {
        setDoctors(userData.doctors ?? [])
        save(DOCTORS_KEY, userData.doctors ?? [])
        // OR with localStorage so DemoFlow's onboarded:true isn't clobbered if Supabase sync lagged
        const localOnboarded = load(ONBOARD_KEY, false)
        const mergedOnboarded = userData.onboarded || localOnboarded
        setOnboarded(mergedOnboarded)
        save(ONBOARD_KEY, mergedOnboarded)
        if (!userData.onboarded && localOnboarded) {
          saveUserData(uid, { doctors: userData.doctors ?? [], onboarded: true })
        }
      }
      supabaseLoaded.current = true
    })
  },[session?.user?.id])

  // ── localStorage mirror ─────────────────────────────────────────────────────

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

  // ── Persisted setters ───────────────────────────────────────────────────────

  const setFirstNamePersisted = useCallback((v)=>{
    setFirstName(v)
    save(FIRSTNAME_KEY, v)
  },[])

  // ── Onboarding completion ───────────────────────────────────────────────────

  const handleOnboardingComplete = useCallback((data)=>{
    save(DAY1_KEY, data)
    setDay1Data(data)
    setOnboardedPersisted(true)
    setRedoingOnboarding(false)
    setShowDay1Popover(true)
  },[setOnboardedPersisted])

  // ── Overlay open/close with exit animation ──────────────────────────────────

  const openAnalysis = () => setShowAnalysis(true)
  const closeAnalysis = () => {
    setAnalysisClosing(true)
    setTimeout(()=>{ setShowAnalysis(false); setAnalysisClosing(false) }, 230)
  }

  const openProfile = (doc) => { profileDocRef.current = doc; setProfile(doc) }
  const closeProfile = () => {
    setProfileClosing(true)
    setTimeout(()=>{ setProfile(null); setProfileClosing(false) }, 230)
  }

  const openDay1Popover  = () => setShowDay1Popover(true)
  const closeDay1Popover = () => {
    setDay1PopClosing(true)
    setTimeout(()=>{ setShowDay1Popover(false); setDay1PopClosing(false) }, 240)
  }

  const openSettings  = () => setShowSettings(true)
  const closeSettings = () => {
    setSettingsClosing(true)
    setTimeout(()=>{ setShowSettings(false); setSettingsClosing(false) }, 230)
  }

  const handleRedoOnboarding = () => {
    closeSettings()
    setTimeout(()=> setRedoingOnboarding(true), 260)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if(session === undefined) {
    return (
      <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:T.bg}}>
        <div style={{width:36,height:36,borderRadius:'50%',border:`3px solid ${T.border}`,borderTopColor:T.coral,animation:'patchSpin 0.7s linear infinite'}}/>
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
        button,a,input,textarea,select{touch-action:manipulation;}
        input,textarea{font-size:16px!important;}
        ::-webkit-scrollbar{display:none;}
        @keyframes pdot{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-5px);}}
        @keyframes pfadeup{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pslide{from{transform:translateX(30px);opacity:0;}to{transform:translateX(0);opacity:1;}}
        @keyframes pslide-out{from{transform:translateX(0);opacity:1;}to{transform:translateX(30px);opacity:0;}}
        @keyframes pslide-up{from{transform:translateY(100%);}to{transform:translateY(0);}}
        @keyframes pslide-down{from{transform:translateY(0);}to{transform:translateY(100%);}}
        @keyframes pfadein{from{opacity:0;}to{opacity:1;}}
        @keyframes pfadeout{from{opacity:1;}to{opacity:0;}}
        @keyframes patchSpin{to{transform:rotate(360deg);}}
        textarea{resize:none;}
        input[type=range]{cursor:pointer;touch-action:none;}
      `}</style>

      {/* Contacts — always mounted; fades/shifts left when chat is active */}
      <div style={{
        position:'absolute',inset:0,
        transform:screen==='chat'?'translateX(-6%)':'translateX(0)',
        opacity:screen==='chat'?0:1,
        pointerEvents:screen==='contacts'?'auto':'none',
        transition:'transform 0.28s ease,opacity 0.22s ease',
        willChange:'transform,opacity',
      }}>
        <ContactsScreen doctors={doctors} msgCount={messages.length}
          onOpenChat={()=>setScreen('chat')}
          onAddDoctor={addDoctor}
          onOpenAnalysis={openAnalysis}
          onOpenProfile={openProfile}
          onOpenSettings={openSettings}
          day1Photo={day1Data?.photos?.front||null}
          firstName={firstName}/>
      </div>

      {/* Chat — always mounted; slides in from right */}
      <div style={{
        position:'absolute',inset:0,
        transform:screen==='chat'?'translateX(0)':'translateX(100%)',
        transition:'transform 0.28s ease',
        willChange:'transform',
      }}>
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
          onOpenProfile={openProfile}/>
      </div>

      {/* Overlays */}
      {(showAnalysis||analysisClosing)&&(
        <AnalysisScreen foodLogs={foodLogs} symptomLogs={symptomLogs}
          firstName={firstName||session?.user?.email?.split('@')[0]||null}
          day1Data={day1Data}
          onOpenDay1Popover={openDay1Popover}
          onBack={closeAnalysis} closing={analysisClosing}/>
      )}
      {(profile||profileClosing)&&(
        <ProfileScreen doc={profileDocRef.current} foodLogs={foodLogs}
          symptomLogs={symptomLogs} onBack={closeProfile} closing={profileClosing}/>
      )}
      {(showSettings||settingsClosing)&&(
        <SettingsScreen
          session={session}
          day1Data={day1Data}
          firstName={firstName}
          onChangeName={setFirstNamePersisted}
          foodLogs={foodLogs}
          symptomLogs={symptomLogs}
          onRedoOnboarding={handleRedoOnboarding}
          onSignOut={async()=>{ await signOut(); setSession(null) }}
          onBack={closeSettings}
          closing={settingsClosing}/>
      )}
      {(showDay1Popover||day1PopClosing)&&day1Data&&(
        <Day1Popover data={day1Data} onClose={closeDay1Popover} closing={day1PopClosing}/>
      )}
      {(!onboarded||redoingOnboarding)&&(
        <Onboarding onComplete={handleOnboardingComplete}/>
      )}
    </div>
  )
}
