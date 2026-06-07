import { useState } from 'react'
import { T } from '../constants/theme.js'
import { SPECIALISTS } from '../constants/specialists.js'
import { PATCH_LOCKUP } from '../assets/avatars.js'
import { PatchAvatarImg, SpecAvatar } from './ui/Avatars.jsx'
import { BarIcon } from './ui/Icons.jsx'
import { supabase, signOut } from '../lib/supabase.js'

function CRow({left,name,sub,right,unread,onTap,onAvatarTap}) {
  const [pressed,setPressed] = useState(false)
  return (
    <div onClick={onTap} onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)}
      onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",cursor:"pointer",background:pressed?T.bg:T.card,transition:"background 0.1s",userSelect:"none",touchAction:"manipulation"}}>
      <div onClick={e=>{e.stopPropagation();onAvatarTap?.();}} style={{flexShrink:0}}>{left}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{margin:0,fontSize:15,fontWeight:"600",color:T.text,letterSpacing:"-0.2px"}}>{name}</p>
          {right}
        </div>
        <p style={{margin:"2px 0 0",fontSize:13,color:T.sub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sub}</p>
      </div>
      {unread&&<div style={{width:10,height:10,borderRadius:"50%",background:T.coral,flexShrink:0}}/>}
    </div>
  )
}

export function ContactsScreen({doctors,onOpenChat,onAddDoctor,onOpenAnalysis,onOpenProfile,msgCount,onSignOut}) {
  const [search,setSearch] = useState("")
  const [focused,setFocused] = useState(false)
  const available = SPECIALISTS.filter(s=>!doctors.find(d=>d.id===s.id)&&(search===""||s.name.toLowerCase().includes(search.toLowerCase())||s.spec.toLowerCase().includes(search.toLowerCase())))

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.bg}}>
      <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"12px 16px",paddingTop:"max(16px,env(safe-area-inset-top))"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <img src={PATCH_LOCKUP} alt="patch" style={{height:30,width:"auto",display:"block"}}/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {supabase&&<button onClick={handleSignOut} style={{background:"none",border:"none",padding:"4px 8px",cursor:"pointer",color:T.muted,fontSize:12,touchAction:"manipulation"}}>Sign out</button>}
            <button onClick={onOpenAnalysis} style={{background:"none",border:"none",padding:6,cursor:"pointer",color:T.sub,touchAction:"manipulation"}}><BarIcon/></button>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,background:T.bg,borderRadius:13,padding:"10px 14px",border:`1.5px solid ${focused?T.coral:T.border}`,transition:"border 0.15s"}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setTimeout(()=>setFocused(false),200)}
            placeholder="Search specialists or @username..."
            style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:16,color:T.text,fontFamily:"inherit"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:20,lineHeight:1,padding:0,touchAction:"manipulation"}}>×</button>}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {!focused&&(
          <>
            <CRow left={<PatchAvatarImg size={52} online/>} name="Patch" sub="Your health companion"
              right={<span style={{fontSize:11,color:T.muted}}>{msgCount>0?`${msgCount} messages`:"Tap to start"}</span>}
              unread={msgCount===0} onTap={onOpenChat} onAvatarTap={()=>onOpenProfile({id:"patch"})}/>
            <div style={{height:1,background:T.border,margin:"0 16px 0 80px"}}/>
          </>
        )}
        {!focused&&doctors.map((doc,i)=>(
          <div key={doc.id}>
            <CRow left={<SpecAvatar spec={doc} size={52}/>} name={doc.name}
              sub={<span style={{fontSize:12,color:T.sub}}>{doc.spec}</span>}
              right={<span style={{fontSize:11,color:T.muted,background:T.bg,padding:"3px 10px",borderRadius:20,border:`1px solid ${T.border}`}}>Coming soon</span>}
              onTap={()=>onOpenProfile(doc)} onAvatarTap={()=>onOpenProfile(doc)}/>
            {i<doctors.length-1&&<div style={{height:1,background:T.border,margin:"0 16px 0 80px"}}/>}
          </div>
        ))}
        {focused&&!search.startsWith("@")&&(
          <>
            <p style={{margin:"14px 16px 8px",fontSize:10,fontWeight:"700",color:T.muted,letterSpacing:"0.9px",textTransform:"uppercase"}}>{search?"RESULTS":"ADD A SPECIALIST"}</p>
            {available.map((s,i)=>(
              <div key={s.id}>
                <CRow left={<div style={{width:52,height:52,borderRadius:"50%",background:T.coralLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{s.emoji}</div>}
                  name={s.name} sub={<span style={{fontSize:12,color:T.sub}}>{s.spec}</span>}
                  right={<span style={{fontSize:13,fontWeight:"700",color:T.coral}}>Add</span>}
                  onTap={()=>{onAddDoctor(s);setSearch("");}}/>
                {i<available.length-1&&<div style={{height:1,background:T.border,margin:"0 16px 0 80px"}}/>}
              </div>
            ))}
          </>
        )}
        {focused&&search.startsWith("@")&&(
          <div style={{padding:"36px 24px",textAlign:"center"}}>
            <div style={{fontSize:42,marginBottom:12}}>👨‍⚕️</div>
            <p style={{fontSize:16,fontWeight:"700",color:T.text,margin:"0 0 8px"}}>Add by username</p>
            <p style={{fontSize:13,color:T.sub,lineHeight:1.6,margin:"0 0 16px"}}>Doctor usernames available when your provider joins Patch.</p>
            <span style={{fontSize:12,color:T.muted,background:T.bg,padding:"7px 18px",borderRadius:20,border:`1px solid ${T.border}`}}>Coming soon</span>
          </div>
        )}
        {!focused&&doctors.length===0&&(
          <p style={{padding:"28px 24px",fontSize:13,color:T.muted,lineHeight:1.7,textAlign:"center"}}>
            Tap the search bar to add a specialist.<br/>Patch adapts to track what matters for each one.
          </p>
        )}
      </div>
    </div>
  )
}
