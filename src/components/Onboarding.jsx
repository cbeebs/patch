import { useState, useEffect, useRef } from 'react'
import { T } from '../constants/theme.js'
import { PatchAvatarImg } from './ui/Avatars.jsx'
import { BackIcon, CamIcon } from './ui/Icons.jsx'
import { analyseDay1 } from '../lib/api.js'

const STEPS = 8

function ProgBar({ step }) {
  if (step === 0 || step === 7) return null
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:T.border, zIndex:10 }}>
      <div style={{
        height:'100%', background:T.coral,
        width:`${(step / 7) * 100}%`,
        transition:'width 0.35s ease',
        borderRadius:'0 2px 2px 0',
      }}/>
    </div>
  )
}

function Inner({ heading, subtext, children }) {
  return (
    <div style={{
      width:'100%', maxWidth:420, padding:'0 24px',
      paddingTop:'max(72px,calc(env(safe-area-inset-top) + 52px))',
      paddingBottom:'max(40px,env(safe-area-inset-bottom))',
    }}>
      {heading && <h1 style={{ margin:'0 0 10px', fontSize:28, fontWeight:800, color:T.navy, letterSpacing:'-0.8px', lineHeight:1.15 }}>{heading}</h1>}
      {subtext && <p style={{ margin:'0 0 28px', fontSize:15, color:T.sub, lineHeight:1.6 }}>{subtext}</p>}
      {children}
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

function ChipGrid({ options, selected, onToggle }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:28 }}>
      {options.map(o => (
        <button key={o} onClick={() => onToggle(o)} style={{
          padding:'13px 10px', borderRadius:14, cursor:'pointer',
          border:`2px solid ${selected.includes(o) ? T.coral : T.border}`,
          background:selected.includes(o) ? T.coralLight : T.card,
          color:selected.includes(o) ? T.coralDark : T.text,
          fontSize:14, fontWeight:selected.includes(o) ? 700 : 400,
          fontFamily:'inherit', textAlign:'center', touchAction:'manipulation',
        }}>{o}</button>
      ))}
    </div>
  )
}

function ContinueBtn({ onTap, label='Continue' }) {
  return (
    <button onClick={onTap} style={{
      width:'100%', padding:15, borderRadius:14, border:'none',
      background:T.coral, color:'white',
      fontSize:16, fontWeight:700, fontFamily:'inherit', cursor:'pointer',
      touchAction:'manipulation',
    }}>
      {label} →
    </button>
  )
}

export function Onboarding({ onComplete }) {
  const [step,      setStep]      = useState(0)
  const [photos,    setPhotos]    = useState({ left:null, front:null, right:null })
  const [duration,  setDuration]  = useState(null)
  const [locations, setLocations] = useState([])
  const [symptoms,  setSymptoms]  = useState([])
  const [triggers,  setTriggers]  = useState([])
  const [impact,    setImpact]    = useState(null)

  const leftRef  = useRef(null)
  const frontRef = useRef(null)
  const rightRef = useRef(null)

  const advance = () => setStep(s => s + 1)
  const back    = () => setStep(s => Math.max(0, s - 1))

  const toggle = (list, setList, val) =>
    setList(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val])

  const pickPhoto = (side, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => setPhotos(p => ({ ...p, [side]: e.target.result }))
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (step !== 7) return
    const answers = { duration, locations, symptoms, triggers, impact }
    analyseDay1(photos, answers)
      .then(analysis => onComplete({ photos, answers, analysis }))
      .catch(() => onComplete({
        photos, answers: { duration, locations, symptoms, triggers, impact },
        analysis: { condition:'Skin concern', severity:2, summary:"Thanks for sharing. Patch will keep an eye on things as you track.", observations:[], confidence:0 }
      }))
  }, [step])

  const DURATION_OPTS = [
    { label:'Just started',   emoji:'🌱' },
    { label:'A few weeks',    emoji:'📅' },
    { label:'A few months',   emoji:'🗓' },
    { label:'Over a year',    emoji:'⏳' },
  ]
  const LOCATION_OPTS = ['Forehead','Cheeks','Nose','Chin','All over','Not just my face']
  const SYMPTOM_OPTS  = ['Redness','Spots / pimples','Dry patches','Oily / shiny','Bumps under skin','Painful or sore','Itchy']
  const TRIGGER_OPTS  = ['Certain foods','Stress','Time of month','Weather / temperature','Products I use',"I'm not sure"]
  const IMPACT_OPTS   = [
    { val:1, label:"Barely notice it",          emoji:'🙂' },
    { val:2, label:"A bit annoying",            emoji:'😐' },
    { val:3, label:"Getting to me",             emoji:'😟' },
    { val:4, label:"Affecting my confidence",  emoji:'😔' },
    { val:5, label:"Really getting me down",   emoji:'😞' },
  ]

  return (
    <div style={{ position:'absolute', inset:0, background:T.bg, zIndex:800, overflow:'hidden' }}>
      <ProgBar step={step}/>

      {step > 0 && step < 7 && (
        <button onClick={back} style={{
          position:'absolute',
          top:'max(14px,calc(env(safe-area-inset-top) + 4px))',
          left:16, zIndex:10,
          background:'none', border:'none', cursor:'pointer',
          color:T.sub, padding:8, touchAction:'manipulation',
        }}>
          <BackIcon/>
        </button>
      )}

      {/* Carousel rail */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
        <div style={{
          display:'flex', width:`${STEPS * 100}%`, height:'100%',
          transform:`translateX(-${(step / STEPS) * 100}%)`,
          transition:'transform 0.38s cubic-bezier(0.4,0,0.2,1)',
        }}>

          {/* ── Step 0: Welcome ── */}
          <div style={{ width:`${100/STEPS}%`, height:'100%', flexShrink:0, overflowY:'auto', overscrollBehavior:'contain', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Inner>
              <div style={{ textAlign:'center', paddingTop:16 }}>
                <PatchAvatarImg size={80}/>
                <h1 style={{ margin:'20px 0 10px', fontSize:30, fontWeight:800, color:T.navy, letterSpacing:'-0.8px', lineHeight:1.1 }}>
                  Let's figure out what's going on
                </h1>
                <p style={{ margin:'0 0 40px', fontSize:16, color:T.sub, lineHeight:1.65 }}>
                  A few quick questions and some photos. Takes about 2 minutes. Patch will keep track from here.
                </p>
                <button onClick={advance} style={{
                  width:'100%', padding:16, borderRadius:14, border:'none',
                  background:T.coral, color:'white', fontSize:17, fontWeight:800,
                  cursor:'pointer', fontFamily:'inherit', touchAction:'manipulation',
                  letterSpacing:'-0.3px',
                }}>
                  Let's go →
                </button>
              </div>
            </Inner>
          </div>

          {/* ── Step 1: Photos ── */}
          <div style={{ width:`${100/STEPS}%`, height:'100%', flexShrink:0, overflowY:'auto', overscrollBehavior:'contain', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Inner heading="Show me your skin" subtext="Three photos — left side, front, right side. Natural light works best.">
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
                        <p style={{ margin:0, fontSize:11, fontWeight:700, color:'white', textAlign:'center', letterSpacing:'0.5px', textTransform:'uppercase' }}>{label} ✓</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <ContinueBtn onTap={advance} label={photos.left && photos.front && photos.right ? 'Continue' : 'Skip for now'}/>
            </Inner>
          </div>

          {/* ── Step 2: Duration ── */}
          <div style={{ width:`${100/STEPS}%`, height:'100%', flexShrink:0, overflowY:'auto', overscrollBehavior:'contain', display:'flex', flexDirection:'column', alignItems:'center' }}>
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
          </div>

          {/* ── Step 3: Locations ── */}
          <div style={{ width:`${100/STEPS}%`, height:'100%', flexShrink:0, overflowY:'auto', overscrollBehavior:'contain', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Inner heading="Where on your face?" subtext="Select all that apply.">
              <ChipGrid options={LOCATION_OPTS} selected={locations} onToggle={v => toggle(locations, setLocations, v)}/>
              <ContinueBtn onTap={advance}/>
            </Inner>
          </div>

          {/* ── Step 4: Symptoms ── */}
          <div style={{ width:`${100/STEPS}%`, height:'100%', flexShrink:0, overflowY:'auto', overscrollBehavior:'contain', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Inner heading="How would you describe it?" subtext="Select everything that applies.">
              <ChipGrid options={SYMPTOM_OPTS} selected={symptoms} onToggle={v => toggle(symptoms, setSymptoms, v)}/>
              <ContinueBtn onTap={advance}/>
            </Inner>
          </div>

          {/* ── Step 5: Triggers ── */}
          <div style={{ width:`${100/STEPS}%`, height:'100%', flexShrink:0, overflowY:'auto', overscrollBehavior:'contain', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Inner heading="Does anything make it worse?" subtext="Select all that apply.">
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
                {TRIGGER_OPTS.map(o => (
                  <PillBtn key={o} label={o}
                    selected={triggers.includes(o)}
                    onTap={() => toggle(triggers, setTriggers, o)}
                  />
                ))}
              </div>
              <ContinueBtn onTap={advance}/>
            </Inner>
          </div>

          {/* ── Step 6: Impact ── */}
          <div style={{ width:`${100/STEPS}%`, height:'100%', flexShrink:0, overflowY:'auto', overscrollBehavior:'contain', display:'flex', flexDirection:'column', alignItems:'center' }}>
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
          </div>

          {/* ── Step 7: Loading ── */}
          <div style={{ width:`${100/STEPS}%`, height:'100%', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40 }}>
            <PatchAvatarImg size={88}/>
            <h2 style={{ margin:'24px 0 10px', fontSize:26, fontWeight:800, color:T.navy, letterSpacing:'-0.6px', textAlign:'center' }}>
              Patch is thinking...
            </h2>
            <p style={{ margin:'0 0 36px', fontSize:15, color:T.sub, textAlign:'center', lineHeight:1.6 }}>
              Analysing your photos and answers
            </p>
            <div style={{ width:40, height:40, borderRadius:'50%', border:`3px solid ${T.border}`, borderTopColor:T.coral, animation:'patchSpin 0.7s linear infinite' }}/>
          </div>

        </div>
      </div>
    </div>
  )
}
