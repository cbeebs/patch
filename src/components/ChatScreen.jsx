import { useState, useEffect, useRef, useCallback } from 'react'
import { T } from '../constants/theme.js'
import { Bubble } from './ui/Bubble.jsx'
import { TypingDots } from './ui/TypingDots.jsx'
import { SeveritySlider } from './ui/SeveritySlider.jsx'
import { PatchAvatarImg } from './ui/Avatars.jsx'
import { BackIcon, AttachIcon, CamIcon, SendIcon } from './ui/Icons.jsx'
import { callClaude, analyseFood, analyseSymptom, PATCH_SYSTEM } from '../lib/api.js'
import { uid, todayStr, getMeal } from '../lib/utils.js'

function IBtn({children,onClick,accent}) {
  return (
    <button onClick={onClick} style={{width:40,height:40,borderRadius:'50%',border:accent?'none':`1px solid ${T.border}`,background:accent?T.coral:T.bg,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,color:accent?'white':T.sub,touchAction:'manipulation'}}>
      {children}
    </button>
  )
}

export function ChatScreen({messages,addMessage,patchMessage,removeMessage,foodLogs,addFoodLog,patchFoodLog,symptomLogs,addSymptomLog,onBack,onboarded,setOnboarded,onOpenProfile}) {
  const [input,setInput]     = useState('')
  const [loading,setLoading] = useState(false)
  const [sevCtx,setSevCtx]   = useState(null)
  const [sevVal,setSevVal]   = useState(2)
  const [error,setError]     = useState(null)
  const endRef    = useRef(null)
  const fileRef   = useRef(null)
  const camRef    = useRef(null)
  const statusRef = useRef(null)
  const taRef     = useRef(null)

  // Auto-resize textarea when input changes
  useEffect(()=>{
    const ta = taRef.current
    if(!ta) return
    ta.style.height = 'auto'
    const h = Math.min(ta.scrollHeight, 120)
    ta.style.height = h + 'px'
    ta.style.overflowY = h >= 120 ? 'auto' : 'hidden'
  },[input])

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}) },[messages,loading])

  useEffect(()=>{
    if(messages.length===0) {
      setTimeout(()=>addPatch("Hey 👋 What's been going on that made you want to start tracking?"),600)
    }
  },[])

  useEffect(()=>{
    if(!onboarded||messages.length===0) return
    const h=new Date().getHours()
    const checked=symptomLogs.some(l=>l.date===todayStr())
    const lastTs=messages[messages.length-1]?.ts||0
    const hoursAgo=(Date.now()-lastTs)/3600000
    if(h>=6&&h<=11&&!checked&&hoursAgo>5)
      setTimeout(()=>addPatch("Morning ☀️ Good time for a quick check-in — send me a photo in natural light when you're ready."),800)
  },[])

  const addPatch=useCallback((text,extras={})=>{
    addMessage({role:'patch',text,ts:Date.now(),id:uid(),...extras})
  },[addMessage])

  const addUser=useCallback((text,image=null)=>{
    addMessage({role:'user',text,image,ts:Date.now(),id:uid()})
  },[addMessage])

  const removeStatus=useCallback(()=>{
    if(statusRef.current){ removeMessage(statusRef.current); statusRef.current=null }
  },[removeMessage])

  const handleAllergenDone=useCallback((msgId,sel)=>{
    patchMessage(msgId,{allergenDone:true})
    patchFoodLog(msgId,{allergens:sel,_pending:false})
    addPatch(`Logged ✓${sel.length>0?` — flagged ${sel.join(', ')}`:''}`)
  },[patchMessage,patchFoodLog,addPatch])

  const handleImage=async(file)=>{
    if(!file) return
    setError(null); setLoading(true)
    const reader=new FileReader()
    reader.onload=async(e)=>{
      const dataUrl=e.target.result
      const base64=dataUrl.split(',')[1]
      addUser(null,dataUrl)
      const h=new Date().getHours()
      const isMorning=h>=6&&h<=11
      const checkedToday=symptomLogs.some(l=>l.date===todayStr())
      const lastPatch=[...messages].reverse().find(m=>m.role==='patch')
      const askedForPhoto=lastPatch?.text?.toLowerCase().match(/photo|selfie|pic|check.in|image|snap/)
      const isSymptom=(isMorning&&!checkedToday)||askedForPhoto
      try {
        if(isSymptom) {
          const statusId=uid()
          statusRef.current=statusId
          addMessage({role:'patch',text:'Checking...',ts:Date.now(),id:statusId})
          const ctx=`${foodLogs.length} food logs, ${symptomLogs.length} symptom checks`
          const result=await analyseSymptom(base64,ctx)
          removeStatus()
          addPatch(result.observation)
          setSevVal(result.severity)
          setSevCtx({label:"How's your skin looking? (fab to ughh)",onConfirm:(v)=>{
            addSymptomLog({date:todayStr(),severity:v,conditions:result.possible_conditions,ts:Date.now()})
            setSevCtx(null)
            addPatch(`Logged ✓ severity ${v}/5.`)
            if(result.follow_up) setTimeout(()=>addPatch(result.follow_up),700)
            if(!onboarded) setOnboarded(true)
          }})
        } else {
          setSevCtx(null)
          const meal=getMeal(h)
          const statusId=uid()
          statusRef.current=statusId
          addMessage({role:'patch',text:`Identifying your ${meal.toLowerCase()}...`,ts:Date.now(),id:statusId})
          const result=await analyseFood(base64)
          removeStatus()
          const msgId=uid()
          const tempLog={date:todayStr(),meal,time:new Date().toISOString(),description:result.description,ingredients:result.ingredients,allergens:[],ts:Date.now(),_pending:true,_msgId:msgId}
          addFoodLog(tempLog)
          addMessage({role:'patch',text:`${result.description}\n\nAny allergens to flag?`,ts:Date.now(),id:msgId,allergenPicker:{likely:result.likely_allergens||[],possible:result.possible_allergens||[]}})
          if(!onboarded) setOnboarded(true)
        }
      } catch(err) {
        removeStatus()
        setError("Couldn't reach Patch — check your connection.")
      }
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSend=async()=>{
    if(!input.trim()||loading) return
    const text=input.trim()
    setInput('')
    setError(null)
    addUser(text)
    setLoading(true)
    try {
      const history=messages.slice(-14).map(m=>({role:m.role==='patch'?'assistant':'user',content:m.text||'[photo]'}))
      history.push({role:'user',content:text})
      const reply=await callClaude(history,PATCH_SYSTEM(foodLogs,symptomLogs,onboarded))
      addPatch(reply)
      if(!onboarded&&messages.length>=4) setOnboarded(true)
    } catch(err) { setError("Couldn't reach Patch — check your connection.") }
    setLoading(false)
  }

  const isMorning=new Date().getHours()>=6&&new Date().getHours()<=11
  const checkedToday=symptomLogs.some(l=>l.date===todayStr())

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:T.bg}}>
      <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:'10px 16px',paddingTop:'max(14px,env(safe-area-inset-top))',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onBack} style={{background:'none',border:'none',padding:'4px 6px 4px 0',cursor:'pointer',color:T.sub,touchAction:'manipulation'}}><BackIcon/></button>
        <div onClick={()=>onOpenProfile({id:'patch'})} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',flex:1,touchAction:'manipulation'}}>
          <PatchAvatarImg size={36} online/>
          <div>
            <p style={{margin:0,fontSize:16,fontWeight:'700',color:T.text}}>Patch</p>
            <p style={{margin:0,fontSize:12,color:T.online,fontWeight:'500'}}>{loading?'typing...':'online'}</p>
          </div>
        </div>
      </div>

      {isMorning&&!checkedToday&&onboarded&&!sevCtx&&(
        <div style={{background:'#FFFDE7',borderBottom:'1px solid #FFF176',padding:'9px 16px',display:'flex',alignItems:'center',gap:10,animation:'pfadeup 0.2s ease'}}>
          <span style={{fontSize:16}}>☀️</span>
          <p style={{margin:0,fontSize:12,color:'#6D4C00',flex:1}}>Morning check-in — send a photo in natural light</p>
          <button onClick={()=>camRef.current?.click()} style={{background:'none',border:'1px solid #B8860B',borderRadius:8,padding:'4px 10px',fontSize:11,color:'#6D4C00',cursor:'pointer',touchAction:'manipulation'}}>Photo</button>
        </div>
      )}

      {error&&(
        <div style={{background:'#FFF3F0',borderBottom:`1px solid ${T.coralMid}`,padding:'8px 16px',animation:'pfadeup 0.2s ease'}}>
          <p style={{margin:0,fontSize:12,color:T.coralDark}}>{error}</p>
        </div>
      )}

      <div style={{flex:1,overflowY:'auto',overscrollBehavior:'contain',padding:'14px 0 6px'}}>
        {messages.map((msg,i)=>(
          <div key={msg.id||i} style={{animation:'pfadeup 0.2s ease'}}>
            <Bubble msg={msg} onAllergenDone={handleAllergenDone}/>
          </div>
        ))}
        {loading&&<div style={{padding:'4px 14px'}}><TypingDots/></div>}
        <div ref={endRef}/>
      </div>

      {sevCtx&&(
        <div style={{animation:'pslide-up 0.25s ease'}}>
          <SeveritySlider value={sevVal} onChange={setSevVal} onConfirm={()=>sevCtx.onConfirm(sevVal)} label={sevCtx.label}/>
        </div>
      )}

      {!sevCtx&&(
        <div style={{background:T.card,borderTop:`1px solid ${T.border}`,padding:'8px 12px',paddingBottom:'max(10px,env(safe-area-inset-bottom))',display:'flex',alignItems:'flex-end',gap:8}}>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{handleImage(e.target.files[0]);e.target.value='';}}/>
          <input ref={camRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e=>{handleImage(e.target.files[0]);e.target.value='';}}/>
          <IBtn onClick={()=>fileRef.current?.click()}><AttachIcon/></IBtn>
          <div style={{flex:1,background:T.bg,borderRadius:22,display:'flex',alignItems:'flex-end',padding:'9px 14px',border:`1px solid ${T.border}`,minHeight:40}}>
            <textarea
              ref={taRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}}
              placeholder="Message Patch..."
              rows={1}
              style={{flex:1,border:'none',outline:'none',background:'transparent',fontSize:16,fontFamily:'inherit',lineHeight:1.4,resize:'none',color:T.text,display:'block',width:'100%',overflowY:'hidden'}}
            />
          </div>
          <IBtn accent onClick={()=>camRef.current?.click()}><CamIcon/></IBtn>
          {input.trim()&&<IBtn accent onClick={handleSend}><SendIcon/></IBtn>}
        </div>
      )}
    </div>
  )
}
