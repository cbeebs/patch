import { useState, useEffect } from 'react'
import { T } from './constants/theme.js'
import { load, save, MSGS_KEY, LOGS_KEY, SYMPTOM_KEY, DOCTORS_KEY, ONBOARD_KEY, SCREEN_KEY } from './lib/utils.js'
import { supabase, getSession, onAuthChange, signOut } from './lib/supabase.js'
import { Auth } from './components/Auth.jsx'
import { ContactsScreen } from './components/ContactsScreen.jsx'
import { ChatScreen } from './components/ChatScreen.jsx'
import { ProfileScreen } from './components/ProfileScreen.jsx'
import { AnalysisScreen } from './components/AnalysisScreen.jsx'

export default function App() {
  const [session,      setSession]      = useState(undefined)
  const [screen,       setScreen]       = useState(()=>load(SCREEN_KEY,"contacts"))
  const [messages,     setMessages]     = useState(()=>load(MSGS_KEY,[]))
  const [foodLogs,     setFoodLogs]     = useState(()=>load(LOGS_KEY,[]))
  const [symptomLogs,  setSymptomLogs]  = useState(()=>load(SYMPTOM_KEY,[]))
  const [doctors,      setDoctors]      = useState(()=>load(DOCTORS_KEY,[]))
  const [onboarded,    setOnboarded]    = useState(()=>load(ONBOARD_KEY,false))
  const [profile,      setProfile]      = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  useEffect(()=>{
    if(!supabase) { setSession(null); return }
    getSession().then(s=>setSession(s))
    const unsub = onAuthChange((event, s) => {
      if(event === 'PASSWORD_RECOVERY') return
      setSession(s)
    })
    return unsub
  },[])

  useEffect(()=>save(MSGS_KEY,    messages),    [messages])
  useEffect(()=>save(LOGS_KEY,    foodLogs),    [foodLogs])
  useEffect(()=>save(SYMPTOM_KEY, symptomLogs), [symptomLogs])
  useEffect(()=>save(DOCTORS_KEY, doctors),     [doctors])
  useEffect(()=>save(ONBOARD_KEY, onboarded),   [onboarded])
  useEffect(()=>save(SCREEN_KEY,  screen),      [screen])

  const addDoctor = s => { if(!doctors.find(d=>d.id===s.id)) setDoctors(p=>[...p,s]) }

  if(session === undefined) {
    return (
      <div style={{height:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg}}>
        <div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${T.border}`,borderTopColor:T.coral,animation:"patchSpin 0.7s linear infinite"}}/>
        <style>{`@keyframes patchSpin{to{transform:rotate(360deg);}}`}</style>
      </div>
    )
  }

  if(session === null && supabase !== null) {
    return <Auth onAuth={s=>setSession(s)}/>
  }

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",height:"100dvh",maxWidth:430,margin:"0 auto",position:"relative",overflow:"hidden",background:T.bg}}>
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

      {screen==="contacts"&&(
        <ContactsScreen doctors={doctors} msgCount={messages.length}
          onOpenChat={()=>setScreen("chat")}
          onAddDoctor={addDoctor}
          onOpenAnalysis={()=>setShowAnalysis(true)}
          onOpenProfile={setProfile}
          onSignOut={()=>setSession(null)}/>
      )}
      {screen==="chat"&&(
        <ChatScreen messages={messages} setMessages={setMessages}
          foodLogs={foodLogs} setFoodLogs={setFoodLogs}
          symptomLogs={symptomLogs} setSymptomLogs={setSymptomLogs}
          onBack={()=>setScreen("contacts")}
          onboarded={onboarded}
          setOnboarded={v=>{setOnboarded(v);save(ONBOARD_KEY,v);}}
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
