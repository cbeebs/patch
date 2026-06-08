import { useState, useEffect, useRef } from 'react'
import { T } from '../constants/theme.js'
import { PatchAvatarImg } from './ui/Avatars.jsx'
import { BackIcon, CamIcon } from './ui/Icons.jsx'
import { analyseDay1 } from '../lib/api.js'
import { signUp, saveUserData, supabase } from '../lib/supabase.js'
import { save, DAY1_KEY, FIRSTNAME_KEY, ONBOARD_KEY } from '../lib/utils.js'

const STEPS = 8

function ProgBar({ step }) {
  const pct = Math.round(Math.min((step / (STEPS - 1)) * 100, 100))
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:T.border, zIndex:10 }}>
      <div style={{ height:'100%', background:T.coral, width:`${pct}%`, transition:'width 0.35s ease', borderRadius:'0 2px 2px 0' }}/>
    </div>
  )
}

function PillBtn({ label, selected, onTap, emoji }) {
  return (
    <button onClick={onTap} style={{
      width:'100%', padding:'13px 16px', borderRadius:14, cursor:'pointer',
      border:`2px solid ${selected ? T.coral : T.border}`,
      background:selected ? T.coralLight : T.card,
      color:selected ? T.coralDark : T.text,
      fontSize:15, fontWeight:selected ? 700 : 400,
      fontFamily:'inherit', textAlign:'left',
      display:'flex', alignItems:'center', gap:12,
      touchAction:'manipulation',
    }}>
      <div style={{
        width:20, height:20, borderRadius:'50%', flexShrink:0,
        border:`2px solid ${selected ? T.coral : T.border}`,
        background:selected ? T.coral : 'transparent',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {selected && <div style={{ width:7, height:7, borderRadius:'50%', background:'white' }}/>}
      </div>
      {emoji && <span style={{ fontSize:18 }}>{emoji}</span>}
      <span>{label}</span>
    </button>
  )
}

function ChipBtn({ label, selected, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      padding:'12px 10px', borderRadius:14, cursor:'pointer',
      border:`2px solid ${selected ? T.coral : T.border}`,
      background:selected ? T.coralLight : T.card,
      color:selected ? T.coralDark : T.text,
      fontSize:14, fontWeight:selected ? 700 : 400,
      fontFamily:'inherit', textAlign:'center', touchAction:'manipulation',
    }}>{label}</button>
  )
}

function Pane({ children, scroll }) {
  return (
    <div style={{
      width:`${100/STEPS}%`, height:'100%', flexShrink:0,
      display:'flex', flexDirection:'column', alignItems:'center',
      overflowY:scroll ? 'auto' : 'hidden',
      overscrollBehavior:'contain',
    }}>
      {children}
    </div>
  )
}

function Inner({ children, heading, subtext, topPad }) {
  return (
    <div style={{
      width:'100%', maxWidth:420, padding:'0 24px',
      paddingTop: topPad ?? 'max(72px,calc(env(safe-area-inset-top) + 52px))',
      paddingBottom:'max(40px,env(safe-area-inset-bottom))',
    }}>
      {heading && <h1 style={{ margin:'0 0 10px', fontSize:26, fontWeight:800, color:T.navy, letterSpacing:'-0.6px', lineHeight:1.15 }}>{heading}</h1>}
      {subtext && <p style={{ margin:'0 0 24px', fontSize:15, color:T.sub, lineHeight:1.6 }}>{subtext}</p>}
      {children}
    </div>
  )
}

const DURATION_OPTS = [
  { label:'Just started',  emoji:'🌱' },
  { label:'A few weeks',   emoji:'📅' },
  { label:'A few months',  emoji:'🗓' },
  { label:'Over a year',   emoji:'⏳' },
]
const SYMPTOM_OPTS = ['Redness','Spots / pimples','Dry patches','Oily / shiny','Bumps under skin','Itchy','Painful']
const IMPACT_OPTS  = [
  { val:1, label:"Barely notice it",        emoji:'🙂' },
  { val:2, label:"A bit annoying",          emoji:'😐' },
  { val:3, label:"Getting to me",           emoji:'😟' },
  { val:4, label:"Affecting my confidence", emoji:'😔' },
  { val:5, label:"Really getting me down",  emoji:'😞' },
]
const NEXT_STEPS = [
  "Track what you eat alongside your skin each day",
  "Do a 30-second morning check-in with a photo",
  "Build a picture over 2–4 weeks to spot your triggers",
]

export function DemoFlow({ onBack, onComplete }) {
  const [step,     setStep]     = useState(0)
  const [name,     setName]     = useState('')
  const [photos,   setPhotos]   = useState({ left:null, front:null, right:null })
  const [duration, setDuration] = useState(null)
  const [symptoms, setSymptoms] = useState([])
  const [impact,   setImpact]   = useState(null)
  const [result,   setResult]   = useState(null)

  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [confirmPw,      setConfirmPw]      = useState('')
  const [signupLoading,  setSignupLoading]  = useState(false)
  const [signupError,    setSignupError]    = useState('')
  const [signupDone,     setSignupDone]     = useState(false)

  const leftRef  = useRef(null)
  const frontRef = useRef(null)
  const rightRef = useRef(null)

  const advance = () => setStep(s => s + 1)
  const goBack  = () => step === 0 ? onBack() : setStep(s => s - 1)
  const toggle  = (list, setList, val) =>
    setList(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val])

  const pickPhoto = (side, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => setPhotos(p => ({ ...p, [side]: e.target.result }))
    reader.readAsDataURL(file)
  }

  // Trigger analysis when step 5 (loading) is reached
  useEffect(() => {
    if (step !== 5) return
    const answers = { duration, locations:[], symptoms, triggers:[], impact }
    analyseDay1(photos, answers)
      .then(r => { setResult(r); setTimeout(advance, 600) })
      .catch(() => {
        setResult({ condition:'Skin concern', severity:2, summary:"Thanks for sharing. I'll keep an eye on things as you track.", observations:[], confidence:0 })
        setTimeout(advance, 600)
      })
  }, [step])

  const handleSignup = async (e) => {
    e.preventDefault()
    setSignupError('')
    if (!supabase) { setSignupError('Sign-up requires a Supabase connection.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setSignupError('Please enter a valid email address'); return }
    if (password.length < 6) { setSignupError('Password must be at least 6 characters'); return }
    if (password !== confirmPw) { setSignupError('Passwords do not match'); return }

    setSignupLoading(true)
    try {
      const day1Payload = { photos, answers:{ duration, symptoms, impact }, analysis:result }
      const data = await signUp(email, password)

      // Persist to localStorage
      save(DAY1_KEY,        day1Payload)
      save(FIRSTNAME_KEY,   name.trim())
      save(ONBOARD_KEY,     true)
      save('patch_v4_show_day1', true)

      // Try to persist onboarded to Supabase (best-effort)
      if (data.user?.id) {
        saveUserData(data.user.id, { doctors:[], onboarded:true }).catch(() => {})
      }

      if (data.session) {
        onComplete(data.session)
      } else {
        setSignupDone(true)
      }
    } catch (err) {
      let msg = err.message || 'Something went wrong'
      if (/already registered|already exists/i.test(msg)) msg = 'An account with this email already exists — please sign in.'
      setSignupError(msg)
    }
    setSignupLoading(false)
  }

  const a = result || {}
  const allPhotos = photos.left && photos.front && photos.right

  const inputSt = {
    width:'100%', border:`1.5px solid ${T.border}`, borderRadius:12,
    padding:'12px 14px', fontSize:16, color:T.text, background:T.bg,
    fontFamily:'inherit', outline:'none',
  }

  return (
    <div style={{ position:'absolute', inset:0, background:T.bg, zIndex:900, overflow:'hidden' }}>
      <ProgBar step={step}/>

      {/* Back button — hidden during loading (step 5) */}
      {step !== 5 && (
        <button onClick={goBack} style={{
          position:'absolute',
          top:'max(14px,calc(env(safe-area-inset-top) + 4px))',
          left:16, zIndex:10,
          background:'none', border:'none', cursor:'pointer',
          color:T.sub, padding:8, touchAction:'manipulation',
        }}>
          <BackIcon/>
        </button>
      )}

      {/* Carousel */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
        <div style={{
          display:'flex', width:`${STEPS * 100}%`, height:'100%',
          transform:`translateX(-${(step / STEPS) * 100}%)`,
          transition:'transform 0.38s cubic-bezier(0.4,0,0.2,1)',
        }}>

          {/* ── Step 0: Name ── */}
          <Pane>
            <div style={{
              width:'100%', maxWidth:420, padding:'0 28px',
              paddingTop:'max(80px,calc(env(safe-area-inset-top) + 60px))',
              paddingBottom:'max(40px,env(safe-area-inset-bottom))',
            }}>
              <PatchAvatarImg size={52}/>
              <h1 style={{ margin:'18px 0 8px', fontSize:30, fontWeight:800, color:T.navy, letterSpacing:'-0.8px', lineHeight:1.1 }}>
                What should I call you?
              </h1>
              <p style={{ margin:'0 0 28px', fontSize:15, color:T.sub, lineHeight:1.6 }}>
                No forms. No fuss. Just a conversation.
              </p>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && name.trim().length >= 2) advance() }}
                placeholder="Your first name"
                autoComplete="given-name"
                style={{
                  width:'100%', fontSize:24, fontWeight:600, border:'none',
                  borderBottom:`2px solid ${name.trim().length >= 2 ? T.coral : T.border}`,
                  background:'transparent', color:T.navy, outline:'none',
                  padding:'8px 0', marginBottom:32, fontFamily:'inherit',
                  transition:'border-color 0.2s',
                }}
              />
              <button
                onClick={advance}
                disabled={name.trim().length < 2}
                style={{
                  width:'100%', padding:15, borderRadius:14, border:'none',
                  background:name.trim().length >= 2 ? T.coral : T.border,
                  color:name.trim().length >= 2 ? 'white' : T.muted,
                  fontSize:16, fontWeight:700, cursor:name.trim().length >= 2 ? 'pointer' : 'default',
                  fontFamily:'inherit', touchAction:'manipulation',
                }}
              >
                Continue →
              </button>
            </div>
          </Pane>

          {/* ── Step 1: Photos ── */}
          <Pane scroll>
            <Inner heading={`Show me what's going on${name ? `, ${name}` : ''}`} subtext="Three quick photos in natural light">
              <input ref={leftRef}  type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e=>{ pickPhoto('left',  e.target.files[0]); e.target.value='' }}/>
              <input ref={frontRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e=>{ pickPhoto('front', e.target.files[0]); e.target.value='' }}/>
              <input ref={rightRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e=>{ pickPhoto('right', e.target.files[0]); e.target.value='' }}/>

              <div style={{ display:'flex', gap:10, marginBottom:28 }}>
                {[
                  { key:'left',  label:'Left',  ref:leftRef  },
                  { key:'front', label:'Front', ref:frontRef },
                  { key:'right', label:'Right', ref:rightRef },
                ].map(({ key, label, ref }) => (
                  <div key={key} onClick={() => ref.current?.click()} style={{
                    flex:1, aspectRatio:'3/4', borderRadius:16,
                    border:`2px dashed ${photos[key] ? T.coral : T.border}`,
                    background:photos[key] ? 'transparent' : T.card,
                    cursor:'pointer', overflow:'hidden', position:'relative',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    gap:8, touchAction:'manipulation',
                  }}>
                    {photos[key] ? (
                      <img src={photos[key]} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    ) : (
                      <>
                        <div style={{ color:T.border }}><CamIcon/></div>
                        <span style={{ fontSize:11, fontWeight:700, color:T.muted, letterSpacing:'0.5px', textTransform:'uppercase' }}>{label}</span>
                      </>
                    )}
                    {photos[key] && (
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.45)', padding:'6px 8px' }}>
                        <p style={{ margin:0, fontSize:11, fontWeight:700, color:'white', textAlign:'center', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label} ✓</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={advance} style={{
                width:'100%', padding:15, borderRadius:14, border:'none',
                background:T.coral, color:'white', fontSize:16, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit', touchAction:'manipulation',
              }}>
                {allPhotos ? 'Continue' : 'Skip for now'} →
              </button>
            </Inner>
          </Pane>

          {/* ── Step 2: Duration ── */}
          <Pane scroll>
            <Inner heading="How long has this been going on?" subtext="Pick the one that fits best.">
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {DURATION_OPTS.map(({ label, emoji }) => (
                  <PillBtn key={label} label={label} emoji={emoji}
                    selected={duration === label}
                    onTap={() => { setDuration(label); setTimeout(advance, 200) }}
                  />
                ))}
              </div>
            </Inner>
          </Pane>

          {/* ── Step 3: Symptoms ── */}
          <Pane scroll>
            <Inner heading="How would you describe it?" subtext="Select all that apply.">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:28 }}>
                {SYMPTOM_OPTS.map(o => (
                  <ChipBtn key={o} label={o}
                    selected={symptoms.includes(o)}
                    onToggle={() => toggle(symptoms, setSymptoms, o)}
                  />
                ))}
              </div>
              <button onClick={advance} style={{
                width:'100%', padding:15, borderRadius:14, border:'none',
                background:T.coral, color:'white', fontSize:16, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit', touchAction:'manipulation',
              }}>
                Continue →
              </button>
            </Inner>
          </Pane>

          {/* ── Step 4: Impact ── */}
          <Pane scroll>
            <Inner heading="How much is it affecting you?" subtext="Day to day — be honest.">
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {IMPACT_OPTS.map(({ val, label, emoji }) => (
                  <PillBtn key={val} label={label} emoji={emoji}
                    selected={impact === val}
                    onTap={() => { setImpact(val); setTimeout(advance, 200) }}
                  />
                ))}
              </div>
            </Inner>
          </Pane>

          {/* ── Step 5: Loading ── */}
          <Pane>
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, textAlign:'center' }}>
              <PatchAvatarImg size={88}/>
              <h2 style={{ margin:'24px 0 10px', fontSize:26, fontWeight:800, color:T.navy, letterSpacing:'-0.6px' }}>
                Patch is thinking{name ? `, ${name}` : ''}...
              </h2>
              <p style={{ margin:'0 0 36px', fontSize:15, color:T.sub, lineHeight:1.6 }}>
                Looking at your photos and answers
              </p>
              <div style={{ width:40, height:40, borderRadius:'50%', border:`3px solid ${T.border}`, borderTopColor:T.coral, animation:'patchSpin 0.7s linear infinite' }}/>
            </div>
          </Pane>

          {/* ── Step 6: Results reveal ── */}
          <Pane scroll>
            <div style={{ width:'100%', maxWidth:420, margin:'0 auto', padding:'0 20px', paddingTop:'max(60px,calc(env(safe-area-inset-top) + 44px))', paddingBottom:'max(48px,env(safe-area-inset-bottom))' }}>
              <p style={{ margin:'0 0 6px', fontSize:11, fontWeight:700, color:T.coral, letterSpacing:'0.9px', textTransform:'uppercase' }}>PATCH'S OPINION</p>
              <h1 style={{ margin:'0 0 20px', fontSize:26, fontWeight:800, color:T.navy, letterSpacing:'-0.6px', lineHeight:1.15 }}>
                {name ? `${name}, here's what I'm seeing` : "Here's what I'm seeing"}
              </h1>

              {photos.front && (
                <div style={{ borderRadius:20, overflow:'hidden', marginBottom:20, height:200, background:T.border }}>
                  <img src={photos.front} alt="Your skin" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center' }}/>
                </div>
              )}

              {a.condition && (
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                  <span style={{ background:T.coralLight, color:T.coralDark, borderRadius:20, padding:'5px 14px', fontSize:13, fontWeight:700 }}>
                    {a.condition}
                  </span>
                  <span style={{ fontSize:12, color:T.muted }}>Possible condition · {a.confidence || 0}% confidence</span>
                </div>
              )}

              {a.summary && (
                <div style={{ background:T.card, borderRadius:16, padding:'16px 18px', marginBottom:16, border:`1px solid ${T.border}` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <PatchAvatarImg size={28}/>
                    <p style={{ margin:0, fontSize:14, color:T.navy, lineHeight:1.65, fontStyle:'italic', flex:1 }}>
                      "{a.summary}"
                    </p>
                  </div>
                </div>
              )}

              {a.severity != null && (
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:20 }}>
                  {[1,2,3,4,5].map(v => (
                    <div key={v} style={{
                      flex:1, height:8, borderRadius:4,
                      background: v <= a.severity ? T.coral : T.border,
                    }}/>
                  ))}
                  <span style={{ fontSize:12, color:T.sub, marginLeft:6, flexShrink:0 }}>
                    {a.severity}/5
                  </span>
                </div>
              )}

              {a.observations?.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <p style={{ margin:'0 0 10px', fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.9px', textTransform:'uppercase' }}>WHAT I'M NOTICING</p>
                  {a.observations.map((obs, i) => (
                    <div key={i} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:T.coral, flexShrink:0, marginTop:6 }}/>
                      <p style={{ margin:0, fontSize:14, color:T.text, lineHeight:1.55 }}>{obs}</p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background:'#F0F7F0', borderRadius:16, padding:'16px 18px', marginBottom:28 }}>
                <p style={{ margin:'0 0 10px', fontSize:10, fontWeight:700, color:'#4A7A4A', letterSpacing:'0.9px', textTransform:'uppercase' }}>WHAT TO DO NEXT WITH PATCH</p>
                {NEXT_STEPS.map((s, i) => (
                  <div key={i} style={{ display:'flex', gap:10, marginBottom:i < NEXT_STEPS.length-1 ? 8 : 0, alignItems:'flex-start' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#4A7A4A', flexShrink:0, marginTop:6 }}/>
                    <p style={{ margin:0, fontSize:14, color:'#2D5A2D', lineHeight:1.55 }}>{s}</p>
                  </div>
                ))}
              </div>

              <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:24 }}>
                <p style={{ margin:'0 0 6px', fontSize:17, fontWeight:700, color:T.navy, textAlign:'center' }}>
                  Want Patch to keep tracking this for you?
                </p>
                <p style={{ margin:'0 0 18px', fontSize:13, color:T.sub, textAlign:'center', lineHeight:1.55 }}>
                  Save your results and Patch will track your patterns over time.
                </p>
                <button onClick={advance} style={{
                  width:'100%', padding:16, borderRadius:14, border:'none',
                  background:T.coral, color:'white', fontSize:16, fontWeight:800,
                  cursor:'pointer', fontFamily:'inherit', touchAction:'manipulation',
                  letterSpacing:'-0.3px',
                }}>
                  Save my results and continue →
                </button>
                <p style={{ margin:'10px 0 0', fontSize:12, color:T.muted, textAlign:'center' }}>
                  Free to start. No card needed.
                </p>
              </div>
            </div>
          </Pane>

          {/* ── Step 7: Signup ── */}
          <Pane scroll>
            {signupDone ? (
              <div style={{ width:'100%', maxWidth:420, padding:'0 24px', paddingTop:'max(80px,calc(env(safe-area-inset-top) + 60px))', textAlign:'center' }}>
                <PatchAvatarImg size={64}/>
                <h2 style={{ margin:'16px 0 10px', fontSize:24, fontWeight:800, color:T.navy }}>Almost there!</h2>
                <p style={{ margin:'0 0 20px', fontSize:15, color:T.sub, lineHeight:1.65 }}>
                  Check your email and click the confirmation link. Your results will be waiting.
                </p>
                <div style={{ background:T.coralLight, borderRadius:14, padding:'14px 16px', border:`1px solid ${T.coralMid}` }}>
                  <p style={{ margin:0, fontSize:13, color:T.coralDark, lineHeight:1.55 }}>
                    Your assessment and skin photos have been saved. Sign in after confirming to continue.
                  </p>
                </div>
              </div>
            ) : (
              <Inner heading={`Create your account${name ? `, ${name}` : ''}`} subtext="Your assessment and results will be waiting for you.">
                {signupError && (
                  <div style={{ background:T.coralLight, border:`1px solid ${T.coralMid}`, borderRadius:12, padding:'10px 14px', marginBottom:16 }}>
                    <p style={{ margin:0, fontSize:13, color:T.coralDark }}>{signupError}</p>
                  </div>
                )}
                <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} style={inputSt} required autoComplete="email"/>
                  <input type="password" placeholder="Create a password" value={password} onChange={e=>setPassword(e.target.value)} style={inputSt} required autoComplete="new-password"/>
                  <input type="password" placeholder="Confirm password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} style={inputSt} required autoComplete="new-password"/>
                  <button type="submit" disabled={signupLoading} style={{
                    padding:14, borderRadius:13, border:'none',
                    background:T.coral, color:'white', fontSize:15, fontWeight:700,
                    cursor:signupLoading ? 'default' : 'pointer',
                    opacity:signupLoading ? 0.7 : 1,
                    fontFamily:'inherit', marginTop:4, touchAction:'manipulation',
                  }}>
                    {signupLoading ? 'Creating account...' : 'Create account →'}
                  </button>
                  <p style={{ margin:'6px 0 0', fontSize:12, color:T.muted, textAlign:'center' }}>
                    Free to start. No card needed.
                  </p>
                </form>
              </Inner>
            )}
          </Pane>

        </div>
      </div>
    </div>
  )
}
