import { useState } from 'react'
import { T } from '../constants/theme.js'
import { BackIcon } from './ui/Icons.jsx'

export function LetterComposer({analysisData,foodLogs,symptomLogs,onClose}) {
  const [period,setPeriod]       = useState("7days")
  const [toName,setToName]       = useState("")
  const [toAddress,setToAddress] = useState("")
  const [toEmail,setToEmail]     = useState("")
  const [fromEmail,setFromEmail] = useState("")
  const [patientName,setPatientName] = useState("")
  const [step,setStep]           = useState("compose")
  const [letter,setLetter]       = useState("")

  const periods = [{id:"today",label:"Today"},{id:"7days",label:"Last 7 days"},{id:"30days",label:"Last 30 days"},{id:"alltime",label:"All time"}]
  const periodLabel = periods.find(p=>p.id===period)?.label||""
  const d = analysisData||{}

  const generateLetter = () => {
    const today = new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})
    const triggers = d?.triggers?.map(t=>`${t.name} (${t.confidence}% confidence)`).join(", ")||"inconclusive at this stage"
    const conditions = d?.conditions?.map(c=>`${c.name} (${c.likelihood}% likelihood)`).join(", ")||"under investigation"
    const fl = foodLogs?.length||0
    const sl = symptomLogs?.length||0
    const generated = `${today}

${toName||"Dear Doctor"},
${toAddress?toAddress+"\n":""}
Re: Patient Dietary & Symptom Tracking Summary — ${patientName||"Your Patient"}
Period reviewed: ${periodLabel}

Dear ${toName||"Doctor"},

I am writing to share a summary of dietary and symptom data tracked via the Patch health companion app for your patient${patientName?` ${patientName}`:""} over the ${periodLabel.toLowerCase()}.

SUMMARY OF FINDINGS

Over the period reviewed, a total of ${fl} meals were logged alongside ${sl} symptom check-ins. Pattern analysis has identified the following:

Suspected dietary triggers: ${triggers}.

Symptom pattern: Flare-ups were observed to occur predominantly within 24–48 hours of consuming the above items. Severity scores ranged from 1–4 on a 0–5 scale.

Possible conditions consistent with the observed pattern: ${conditions}.

SUGGESTED CONVERSATION POINTS

1. Whether a supervised elimination diet would be appropriate given the correlation data.
2. The patient's history with the identified possible conditions and whether any prior assessment has been made.
3. Whether referral to a specialist would be beneficial at this stage.
4. Reviewing the full data log, which can be shared digitally on request.

IMPORTANT DISCLAIMER

This letter was prepared by Patch to share your tracking data. It describes observed patterns, not clinical findings.

Yours sincerely,

Patch
AI Health Companion
patch.health${fromEmail?"\n\nCorrespondence: "+fromEmail:""}`
    setLetter(generated)
    setStep("preview")
  }

  const handlePrint = () => {
    const w = window.open("","_blank")
    w.document.write(`<!DOCTYPE html><html><head><title>Patch Letter</title><style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:-apple-system,sans-serif;color:#1D2A38;background:white;padding:60px;max-width:760px;margin:0 auto;font-size:14px;line-height:1.7;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #F5876D;}
      .logo{display:flex;align-items:center;gap:10px;}
      .mark{width:40px;height:40px;background:#F5876D;border-radius:9px;display:flex;align-items:center;justify-content:center;}
      .wordmark{font-size:24px;font-weight:800;color:#1D2A38;letter-spacing:-0.5px;}
      .meta{text-align:right;font-size:12px;color:#6B7A8A;line-height:1.7;}
      .re{background:#FEF0EC;border-left:3px solid #F5876D;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:28px;font-weight:600;font-size:13px;}
      .section{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#A8B4BF;margin:24px 0 8px;}
      .footer{margin-top:40px;padding-top:16px;border-top:1px solid #EDE9E3;font-size:11px;color:#A8B4BF;line-height:1.6;}
      @media print{body{padding:40px;}}
    </style></head><body>
      <div class="header">
        <div class="logo">
          <div class="mark"><svg width="26" height="26" viewBox="0 0 100 100" fill="none"><path d="M38 72C38 72 30 62 30 52C30 38 40 28 54 28C68 28 76 38 76 50C76 62 67 70 56 70C47 70 40 63 40 55C40 47 47 42 55 42C63 42 68 47 68 53C68 59 64 63 58 63C52 63 49 59 50 55" stroke="white" stroke-width="6" stroke-linecap="round" fill="none"/></svg></div>
          <span class="wordmark">patch</span>
        </div>
        <div class="meta"><strong>${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</strong><br/>Period: ${periodLabel}${toEmail?`<br/>To: ${toEmail}`:""}${fromEmail?`<br/>From: ${fromEmail}`:""}</div>
      </div>
      <div class="re">Re: Patient Dietary & Symptom Tracking Summary${patientName?" — "+patientName:""}</div>
      <div>${letter.replace(/\n/g,"<br>").replace(/(SUMMARY OF FINDINGS|SUGGESTED CONVERSATION POINTS|IMPORTANT DISCLAIMER)/g,'<div class="section">$1</div>')}</div>
      <div class="footer">This letter was prepared by Patch to share your tracking data. It describes observed patterns, not clinical findings.</div>
    </body></html>`)
    w.document.close()
    setTimeout(()=>w.print(),400)
  }

  if(step==="preview") return (
    <div style={{position:"absolute",inset:0,background:T.bg,zIndex:500,display:"flex",flexDirection:"column",animation:"pslide 0.22s ease"}}>
      <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"12px 16px",paddingTop:"max(14px,env(safe-area-inset-top))",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>setStep("compose")} style={{background:"none",border:"none",padding:"4px 8px 4px 0",cursor:"pointer",color:T.sub,touchAction:"manipulation"}}><BackIcon/></button>
        <div style={{flex:1}}><p style={{margin:0,fontSize:17,fontWeight:"700",color:T.text}}>Letter Preview</p><p style={{margin:0,fontSize:12,color:T.sub}}>To {toName||"Doctor"} · {periodLabel}</p></div>
        <button onClick={handlePrint} style={{background:T.coral,color:"white",border:"none",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:"700",cursor:"pointer",touchAction:"manipulation"}}>Download PDF</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px 16px"}}>
        <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.border}`,overflow:"hidden"}}>
          <div style={{background:T.coralLight,padding:"20px",borderBottom:`2px solid ${T.coral}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:34,height:34,background:T.coral,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="20" height="20" viewBox="0 0 100 100" fill="none"><path d="M38 72C38 72 30 62 30 52C30 38 40 28 54 28C68 28 76 38 76 50C76 62 67 70 56 70C47 70 40 63 40 55C40 47 47 42 55 42C63 42 68 47 68 53C68 59 64 63 58 63C52 63 49 59 50 55" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none"/></svg>
              </div>
              <div><p style={{margin:0,fontSize:15,fontWeight:"800",color:T.navy}}>patch</p><p style={{margin:0,fontSize:11,color:T.sub}}>AI Health Companion</p></div>
            </div>
            <div style={{textAlign:"right",fontSize:12,color:T.sub,lineHeight:1.7}}>
              <p style={{margin:0,fontWeight:"600",color:T.text}}>{new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p>
              <p style={{margin:0}}>Period: {periodLabel}</p>
              {toEmail&&<p style={{margin:0}}>To: {toEmail}</p>}
            </div>
          </div>
          <div style={{background:"#FFF8F6",padding:"12px 20px",borderBottom:`1px solid ${T.border}`}}>
            <p style={{margin:0,fontSize:13,fontWeight:"700",color:T.coralDark}}>Re: Patient Dietary & Symptom Tracking Summary{patientName?` — ${patientName}`:""}</p>
          </div>
          <div style={{padding:"20px"}}>
            {letter.split("\n\n").map((para,i)=>{
              const isTitle = ["SUMMARY OF FINDINGS","SUGGESTED CONVERSATION POINTS","IMPORTANT DISCLAIMER"].includes(para.trim())
              return isTitle
                ?<p key={i} style={{margin:"20px 0 6px",fontSize:10,fontWeight:"700",letterSpacing:"0.9px",textTransform:"uppercase",color:T.muted}}>{para}</p>
                :<p key={i} style={{margin:"0 0 12px",fontSize:13.5,lineHeight:1.75,color:T.text}}>{para}</p>
            })}
          </div>
          <div style={{background:T.bg,padding:"14px 20px",borderTop:`1px solid ${T.border}`}}>
            <p style={{margin:0,fontSize:11,color:T.muted,lineHeight:1.6}}>This letter was prepared by Patch to share your tracking data. It describes observed patterns, not clinical findings.</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{position:"absolute",inset:0,background:T.bg,zIndex:500,display:"flex",flexDirection:"column",animation:"pslide 0.22s ease"}}>
      <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"12px 16px",paddingTop:"max(14px,env(safe-area-inset-top))",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onClose} style={{background:"none",border:"none",padding:"4px 8px 4px 0",cursor:"pointer",color:T.sub,touchAction:"manipulation"}}><BackIcon/></button>
        <p style={{margin:0,fontSize:17,fontWeight:"700",color:T.text}}>Write a Letter</p>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px 16px"}}>
        <p style={{margin:"0 0 10px",fontSize:11,fontWeight:"700",color:T.muted,letterSpacing:"0.9px",textTransform:"uppercase"}}>TIME PERIOD</p>
        <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
          {periods.map(p=>(
            <button key={p.id} onClick={()=>setPeriod(p.id)} style={{padding:"8px 16px",borderRadius:20,cursor:"pointer",transition:"all 0.12s",border:period===p.id?"none":`1.5px solid ${T.border}`,background:period===p.id?T.coral:T.card,color:period===p.id?"white":T.text,fontSize:13,fontWeight:period===p.id?"700":"400",boxShadow:period===p.id?`0 2px 8px ${T.coral}44`:"none",touchAction:"manipulation"}}>{p.label}</button>
          ))}
        </div>
        <p style={{margin:"0 0 10px",fontSize:11,fontWeight:"700",color:T.muted,letterSpacing:"0.9px",textTransform:"uppercase"}}>DOCTOR DETAILS</p>
        <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:16}}>
          {[{label:"Doctor name",value:toName,setter:setToName,placeholder:"Dr. Sarah Holt"},{label:"Address / Practice",value:toAddress,setter:setToAddress,placeholder:"123 Harley Street, London"},{label:"Doctor's email",value:toEmail,setter:setToEmail,placeholder:"doctor@practice.com"}].map((f,i,arr)=>(
            <div key={i} style={{padding:"12px 16px",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
              <p style={{margin:"0 0 4px",fontSize:11,color:T.muted,fontWeight:"600"}}>{f.label}</p>
              <input value={f.value} onChange={e=>f.setter(e.target.value)} placeholder={f.placeholder} style={{width:"100%",border:"none",outline:"none",fontSize:16,color:T.text,background:"transparent",fontFamily:"inherit"}}/>
            </div>
          ))}
        </div>
        <p style={{margin:"0 0 10px",fontSize:11,fontWeight:"700",color:T.muted,letterSpacing:"0.9px",textTransform:"uppercase"}}>PATIENT DETAILS</p>
        <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:32}}>
          {[{label:"Patient name",value:patientName,setter:setPatientName,placeholder:"Your name"},{label:"Your email",value:fromEmail,setter:setFromEmail,placeholder:"you@email.com"}].map((f,i,arr)=>(
            <div key={i} style={{padding:"12px 16px",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
              <p style={{margin:"0 0 4px",fontSize:11,color:T.muted,fontWeight:"600"}}>{f.label}</p>
              <input value={f.value} onChange={e=>f.setter(e.target.value)} placeholder={f.placeholder} style={{width:"100%",border:"none",outline:"none",fontSize:16,color:T.text,background:"transparent",fontFamily:"inherit"}}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"12px 16px",paddingBottom:"max(16px,env(safe-area-inset-bottom))",background:T.card,borderTop:`1px solid ${T.border}`}}>
        <button onClick={generateLetter} style={{width:"100%",background:T.coral,color:"white",border:"none",borderRadius:13,padding:"14px",fontSize:15,fontWeight:"700",cursor:"pointer",boxShadow:`0 4px 16px ${T.coral}44`,touchAction:"manipulation"}}>
          Generate Letter →
        </button>
      </div>
    </div>
  )
}
