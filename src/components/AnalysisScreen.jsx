import { useState, useEffect } from 'react'
import { T } from '../constants/theme.js'
import { PATCH_BODY } from '../assets/avatars.js'
import { PatchAvatarImg } from './ui/Avatars.jsx'
import { CloseIcon, DocIcon } from './ui/Icons.jsx'
import { buildAnalysis } from '../lib/api.js'
import { load, LETTERS_KEY } from '../lib/utils.js'
import { LetterComposer } from './LetterComposer.jsx'

// ── Placeholder / empty-state components ─────────────────────────────────────

function PlaceholderBar({width, height=5, radius=3}) {
  return <div style={{width,height,background:T.border,borderRadius:radius}}/>
}

function EmptyState() {
  const placeholderSeverities = [null,null,null,null,null,null,null]
  const placeholderTriggers = ['Possible trigger','Possible trigger','Possible trigger']
  const placeholderConditions = ['Possible condition','Possible condition']

  return (
    <>
      {/* Symptom history placeholder */}
      <p style={{margin:'0 0 10px',fontSize:10,fontWeight:'700',color:T.muted,letterSpacing:'0.9px',textTransform:'uppercase'}}>SYMPTOM HISTORY</p>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:24,opacity:0.35}}>
        {placeholderSeverities.map((_,i)=>(
          <div key={i} style={{textAlign:'center'}}>
            <div style={{width:34,height:34,borderRadius:8,background:T.border,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{width:10,height:2,background:T.muted,borderRadius:2}}/>
            </div>
            <p style={{fontSize:9,color:T.muted,margin:'3px 0 0'}}>—</p>
          </div>
        ))}
      </div>

      {/* Triggers placeholder */}
      <p style={{margin:'0 0 10px',fontSize:10,fontWeight:'700',color:T.muted,letterSpacing:'0.9px',textTransform:'uppercase'}}>SUSPECTED TRIGGERS</p>
      {placeholderTriggers.map((_,i)=>(
        <div key={i} style={{background:T.card,borderRadius:14,padding:'14px 16px',marginBottom:8,border:`1px solid ${T.border}`,opacity:0.4}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <PlaceholderBar width={`${55+i*15}%`} height={12} radius={6}/>
            <PlaceholderBar width={32} height={12} radius={6}/>
          </div>
          <div style={{height:5,background:T.bg,borderRadius:3}}>
            <div style={{width:`${60-i*15}%`,height:'100%',background:T.border,borderRadius:3}}/>
          </div>
        </div>
      ))}

      {/* Conditions placeholder */}
      <p style={{margin:'20px 0 10px',fontSize:10,fontWeight:'700',color:T.muted,letterSpacing:'0.9px',textTransform:'uppercase'}}>POSSIBLE CONDITIONS</p>
      {placeholderConditions.map((_,i)=>(
        <div key={i} style={{background:T.card,borderRadius:14,padding:'14px 16px',marginBottom:8,border:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start',opacity:0.4}}>
          <div style={{flex:1}}>
            <PlaceholderBar width={'55%'} height={12} radius={6}/>
            <div style={{marginTop:8}}><PlaceholderBar width={'80%'} height={9} radius={4}/></div>
          </div>
          <PlaceholderBar width={30} height={12} radius={6}/>
        </div>
      ))}

      {/* Empty state message */}
      <div style={{background:T.card,borderRadius:14,padding:'20px',marginTop:8,border:`1px solid ${T.border}`,textAlign:'center'}}>
        <div style={{width:40,height:40,borderRadius:'50%',background:T.coralLight,margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.coral} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <p style={{margin:'0 0 6px',fontSize:14,fontWeight:'700',color:T.text}}>No data yet</p>
        <p style={{margin:0,fontSize:13,color:T.sub,lineHeight:1.6}}>Your data will appear here as you log meals and check-ins. Start a chat with Patch to begin.</p>
      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalysisScreen({foodLogs,symptomLogs,onBack,closing}) {
  const [data,setData]             = useState(null)
  const [loading,setLoading]       = useState(true)
  const [showComposer,setShowComposer] = useState(false)
  const [composerClosing,setComposerClosing] = useState(false)
  const cc = c => c>65?'#E53935':c>40?'#FB8C00':'#43A047'
  const savedLetters = load(LETTERS_KEY,[])
  const isEmpty = foodLogs.length===0 && symptomLogs.length===0

  useEffect(()=>{
    if(isEmpty) { setLoading(false); return }
    buildAnalysis(foodLogs,symptomLogs).then(d=>{ setData(d); setLoading(false) })
  },[])

  const d = data||{}

  const closeComposer = () => {
    setComposerClosing(true)
    setTimeout(()=>{ setShowComposer(false); setComposerClosing(false) }, 230)
  }

  return (
    <div style={{
      position:'absolute',inset:0,background:T.bg,zIndex:200,display:'flex',flexDirection:'column',
      animation:closing?'pslide-out 0.22s ease forwards':'pslide 0.22s ease',
    }}>
      <div style={{position:'absolute',top:'max(16px,env(safe-area-inset-top))',right:18,zIndex:10}}>
        <button onClick={onBack} style={{background:'none',border:'none',padding:6,cursor:'pointer',color:T.navy,opacity:0.5,touchAction:'manipulation'}}><CloseIcon/></button>
      </div>

      <div style={{flex:1,overflowY:'auto',overscrollBehavior:'contain'}}>

        {/* ── Hero ── */}
        <div style={{
          background:'#F2EDE6',
          position:'relative',
          overflow:'hidden',
          minHeight:'max(300px,calc(env(safe-area-inset-top) + 260px))',
        }}>
          <img
            src={PATCH_BODY}
            alt="Patch"
            style={{
              position:'absolute',
              right:0,
              bottom:0,
              height:'100%',
              width:'auto',
              display:'block',
              zIndex:1,
              objectFit:'contain',
              objectPosition:'right bottom',
            }}
          />
          <div style={{
            position:'relative',
            zIndex:2,
            padding:'max(56px,calc(env(safe-area-inset-top) + 40px)) 0 32px 24px',
            maxWidth:'60%',
          }}>
            <p style={{margin:'0 0 10px',fontSize:11,fontWeight:'700',color:T.coral,letterSpacing:'0.9px',textTransform:'uppercase'}}>ANALYSIS</p>
            <h2 style={{margin:'0 0 16px',fontSize:31,fontWeight:'800',color:T.navy,letterSpacing:'-1px',lineHeight:1.08}}>Patch's Opinion</h2>
            <p style={{margin:'0 0 16px',fontSize:12,color:'#8A7E76',lineHeight:1.65}}>
              {foodLogs.length} meals<br/>
              {symptomLogs.length} check-ins<br/>
              {new Set(foodLogs.map(l=>l.date)).size} days tracked
            </p>
            {!loading&&!isEmpty&&d.overall_confidence>0&&(
              <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'white',borderRadius:20,padding:'6px 14px'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:T.coral,flexShrink:0}}/>
                <span style={{fontSize:12,fontWeight:'700',color:T.navy}}>{d.overall_confidence}% confidence</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{padding:'20px 16px'}}>
          {loading ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:40,gap:16}}>
              <div style={{width:36,height:36,borderRadius:'50%',border:`3px solid ${T.border}`,borderTopColor:T.coral,animation:'patchSpin 0.7s linear infinite'}}/>
              <p style={{color:T.sub,fontSize:14}}>Analysing your data...</p>
            </div>
          ) : isEmpty ? (
            <EmptyState/>
          ) : (
            <>
              <div style={{background:T.card,borderRadius:16,padding:'16px 18px',marginBottom:20,border:`1px solid ${T.border}`}}>
                <p style={{margin:'0 0 6px',fontSize:10,fontWeight:'700',color:T.muted,letterSpacing:'0.9px',textTransform:'uppercase'}}>PATCH SAYS</p>
                <p style={{margin:'0 0 12px',fontSize:14,lineHeight:1.65,color:T.navy,fontStyle:'italic'}}>"{d.summary}"</p>
                {d.overall_confidence>0&&(
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{flex:1,height:5,background:T.bg,borderRadius:3}}>
                      <div style={{width:`${d.overall_confidence}%`,height:'100%',background:T.coral,borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:12,fontWeight:'700',color:T.coralDark}}>{d.overall_confidence}%</span>
                  </div>
                )}
              </div>

              {d.triggers?.length>0&&(
                <>
                  <p style={{margin:'0 0 10px',fontSize:10,fontWeight:'700',color:T.muted,letterSpacing:'0.9px',textTransform:'uppercase'}}>SUSPECTED TRIGGERS</p>
                  {d.triggers.map((t,i)=>(
                    <div key={i} style={{background:T.card,borderRadius:14,padding:'14px 16px',marginBottom:8,border:`1px solid ${T.border}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <p style={{margin:0,fontSize:15,fontWeight:'700',color:T.text}}>{t.name}</p>
                        <span style={{fontSize:15,fontWeight:'800',color:cc(t.confidence)}}>{t.confidence}%</span>
                      </div>
                      <div style={{height:5,background:T.bg,borderRadius:3,marginBottom:8}}>
                        <div style={{width:`${t.confidence}%`,height:'100%',background:cc(t.confidence),borderRadius:3}}/>
                      </div>
                      <p style={{margin:0,fontSize:13,color:T.sub,lineHeight:1.5}}>{t.evidence}</p>
                    </div>
                  ))}
                </>
              )}

              {d.conditions?.length>0&&(
                <>
                  <p style={{margin:'20px 0 10px',fontSize:10,fontWeight:'700',color:T.muted,letterSpacing:'0.9px',textTransform:'uppercase'}}>POSSIBLE CONDITIONS</p>
                  {d.conditions.map((c,i)=>(
                    <div key={i} style={{background:T.card,borderRadius:14,padding:'14px 16px',marginBottom:8,border:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <p style={{margin:'0 0 4px',fontSize:15,fontWeight:'700',color:T.text}}>{c.name}</p>
                        <p style={{margin:0,fontSize:13,color:T.sub,lineHeight:1.45}}>{c.note}</p>
                      </div>
                      <span style={{fontSize:15,fontWeight:'800',color:cc(c.likelihood),marginLeft:14}}>{c.likelihood}%</span>
                    </div>
                  ))}
                </>
              )}

              {symptomLogs.length>0&&(
                <>
                  <p style={{margin:'20px 0 10px',fontSize:10,fontWeight:'700',color:T.muted,letterSpacing:'0.9px',textTransform:'uppercase'}}>SYMPTOM HISTORY</p>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
                    {symptomLogs.slice(-21).map((l,i)=>{
                      const palette=['#F5EDE8','#F0D9CF','#ECC4B4','#E8A990','#E08468','#C85E43']
                      const textC=['#C4A090','#B8826E','#A0624A','#fff','#fff','#fff']
                      return (
                        <div key={i} style={{textAlign:'center'}}>
                          <div style={{width:34,height:34,borderRadius:8,background:palette[l.severity],display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:'800',color:textC[l.severity]}}>{l.severity}</div>
                          <p style={{fontSize:9,color:T.muted,margin:'3px 0 0'}}>{new Date(l.date).toLocaleDateString([],{day:'numeric',month:'numeric'})}</p>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {d.next_steps&&(
                <div style={{background:'#F0F7F0',borderRadius:14,padding:'14px 16px',marginBottom:20}}>
                  <p style={{margin:'0 0 4px',fontSize:10,fontWeight:'700',color:'#4A7A4A',letterSpacing:'0.9px',textTransform:'uppercase'}}>NEXT STEP</p>
                  <p style={{margin:0,fontSize:14,color:'#2D5A2D',lineHeight:1.55}}>{d.next_steps}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Letters ── */}
        <div style={{padding:'0 16px 32px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <PatchAvatarImg size={36}/>
            <div>
              <p style={{margin:0,fontSize:15,fontWeight:'700',color:T.text}}>Letters from Patch</p>
              <p style={{margin:0,fontSize:12,color:T.sub}}>Formatted referral letters for your specialist</p>
            </div>
          </div>
          {savedLetters.length>0&&savedLetters.map((l,i)=>(
            <div key={i} onClick={()=>setShowComposer(true)} style={{background:T.card,borderRadius:14,padding:'13px 16px',marginBottom:8,border:`1px solid ${T.border}`,cursor:'pointer',display:'flex',alignItems:'center',gap:12,touchAction:'manipulation'}}>
              <div style={{width:38,height:38,background:T.coralLight,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:T.coralDark}}><DocIcon/></div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:13,fontWeight:'600',color:T.text}}>{l.recipient||'Letter'}</p>
                <p style={{margin:'2px 0 0',fontSize:12,color:T.sub,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.preview||''}</p>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <p style={{margin:0,fontSize:11,color:T.muted}}>{l.date}</p>
                <p style={{margin:'2px 0 0',fontSize:11,color:T.coral,fontWeight:'600'}}>{l.period}</p>
              </div>
            </div>
          ))}
          <button onClick={()=>setShowComposer(true)} style={{width:'100%',background:T.coral,color:'white',border:'none',borderRadius:13,padding:'14px',fontSize:14,fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:4,touchAction:'manipulation'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Write a new letter
          </button>
          <p style={{fontSize:11,color:T.muted,textAlign:'center',marginTop:20,lineHeight:1.7,padding:'0 16px'}}>
            Patch tracks patterns to help you have better conversations. Always your call what you do with the information.
          </p>
        </div>
      </div>

      {(showComposer||composerClosing)&&(
        <LetterComposer
          analysisData={d}
          foodLogs={foodLogs}
          symptomLogs={symptomLogs}
          onClose={closeComposer}
          closing={composerClosing}
        />
      )}
    </div>
  )
}
