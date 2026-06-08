import { T } from '../constants/theme.js'
import { PatchAvatarImg, SpecAvatar } from './ui/Avatars.jsx'
import { BackIcon } from './ui/Icons.jsx'

export function ProfileScreen({doc,foodLogs,symptomLogs,onBack,closing}) {
  const isPatch = doc.id === 'patch'
  return (
    <div style={{
      position:'absolute',inset:0,background:T.bg,zIndex:300,display:'flex',flexDirection:'column',
      animation:closing?'pslide-out 0.22s ease forwards':'pslide 0.22s ease',
    }}>
      <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:'12px 16px',paddingTop:'max(14px,env(safe-area-inset-top))',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onBack} style={{background:'none',border:'none',padding:'4px 8px 4px 0',cursor:'pointer',color:T.sub,touchAction:'manipulation'}}><BackIcon/></button>
        <p style={{margin:0,fontSize:17,fontWeight:'700',color:T.text}}>Profile</p>
      </div>
      <div style={{flex:1,overflowY:'auto',overscrollBehavior:'contain'}}>
        <div style={{background:T.card,padding:'36px 20px 28px',display:'flex',flexDirection:'column',alignItems:'center',borderBottom:`1px solid ${T.border}`}}>
          {isPatch?<PatchAvatarImg size={88}/>:<SpecAvatar spec={doc} size={88}/>}
          <p style={{margin:'16px 0 4px',fontSize:24,fontWeight:'800',color:T.text,letterSpacing:'-0.6px'}}>{isPatch?'Patch':doc.name}</p>
          <p style={{margin:0,fontSize:14,color:T.sub}}>{isPatch?'Your health companion':doc.spec}</p>
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:T.online}}/>
            <span style={{fontSize:12,color:T.online,fontWeight:'600'}}>Active</span>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:1,background:T.border,borderBottom:`1px solid ${T.border}`}}>
          {[[foodLogs.length,'Meals logged'],[symptomLogs.length,'Check-ins'],[new Set(foodLogs.map(l=>l.date)).size,'Days tracked']].map(([v,l],i)=>(
            <div key={i} style={{background:T.card,padding:'18px 0',textAlign:'center'}}>
              <p style={{margin:0,fontSize:26,fontWeight:'800',color:T.coral}}>{v}</p>
              <p style={{margin:'4px 0 0',fontSize:11,color:T.muted}}>{l}</p>
            </div>
          ))}
        </div>
        <div style={{margin:16,background:T.card,borderRadius:14,padding:16,border:`1px solid ${T.border}`}}>
          <p style={{margin:'0 0 8px',fontSize:10,fontWeight:'700',color:T.muted,letterSpacing:'0.9px',textTransform:'uppercase'}}>ABOUT</p>
          <p style={{margin:0,fontSize:14,color:T.text,lineHeight:1.65}}>
            {isPatch
              ? "Patch is your always-on health companion. He tracks what you eat and how you feel, asks the right questions, and over time builds a picture of what might be affecting you. Think of him as a knowledgeable friend you can always be honest with."
              : doc.bio}
          </p>
        </div>
        {!isPatch&&(
          <div style={{margin:'0 16px 32px',background:T.card,borderRadius:14,padding:'14px 16px',border:`1px solid ${T.border}`}}>
            <p style={{margin:'0 0 4px',fontSize:10,fontWeight:'700',color:T.muted,letterSpacing:'0.9px',textTransform:'uppercase'}}>CONNECT A REAL DOCTOR</p>
            <p style={{margin:'0 0 12px',fontSize:13,color:T.sub,lineHeight:1.55}}>When your {doc.spec.toLowerCase()} joins Patch, add them by @username.</p>
            <div style={{background:T.bg,borderRadius:10,padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:13,color:T.muted}}>@doctor-username</span>
              <span style={{fontSize:11,fontWeight:'600',color:T.muted}}>Coming soon</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
