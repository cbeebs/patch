import { useState } from 'react'
import { T } from '../constants/theme.js'
import { BackIcon } from './ui/Icons.jsx'
import { load, save, NOTIF_KEY, MSGS_KEY, LOGS_KEY, SYMPTOM_KEY, DOCTORS_KEY, ONBOARD_KEY, DAY1_KEY, FIRSTNAME_KEY, LETTERS_KEY } from '../lib/utils.js'

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:28 }}>
      <p style={{ margin:'0 0 10px', fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.9px', textTransform:'uppercase', padding:'0 16px' }}>{title}</p>
      <div style={{ background:T.card, borderRadius:16, border:`1px solid ${T.border}`, overflow:'hidden', margin:'0 16px' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, onTap, right, last }) {
  return (
    <div onClick={onTap} style={{
      padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between',
      borderBottom:last ? 'none' : `1px solid ${T.border}`,
      cursor:onTap ? 'pointer' : 'default', touchAction:'manipulation',
    }}>
      <span style={{ fontSize:15, color:T.text }}>{label}</span>
      {right || (value && <span style={{ fontSize:14, color:T.sub }}>{value}</span>)}
    </div>
  )
}

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      width:44, height:26, borderRadius:13, cursor:'pointer', touchAction:'manipulation',
      background:on ? T.coral : T.border,
      position:'relative', transition:'background 0.2s',
      flexShrink:0,
    }}>
      <div style={{
        position:'absolute', top:3, left:on ? 21 : 3, width:20, height:20, borderRadius:'50%',
        background:'white', transition:'left 0.2s',
      }}/>
    </div>
  )
}

export function SettingsScreen({ session, day1Data, firstName, onChangeName, foodLogs, symptomLogs, onRedoOnboarding, onSignOut, onBack, closing }) {
  const [name,         setName]         = useState(firstName || '')
  const [notif,        setNotif]        = useState(() => load(NOTIF_KEY, true))
  const [confirmClear, setConfirmClear] = useState(false)

  const frontPhoto = day1Data?.photos?.front
  const a          = day1Data?.analysis || {}
  const initial    = (name || session?.user?.email || '?')[0].toUpperCase()

  const handleNameBlur = () => {
    const trimmed = name.trim()
    if (trimmed !== firstName) onChangeName(trimmed)
  }

  const handleNotif = () => {
    const next = !notif
    setNotif(next)
    save(NOTIF_KEY, next)
  }

  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify({ exportedAt:new Date().toISOString(), foodLogs, symptomLogs, day1Assessment:day1Data }, null, 2)],
      { type:'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `patch-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClearAll = () => {
    ;[MSGS_KEY, LOGS_KEY, SYMPTOM_KEY, DOCTORS_KEY, ONBOARD_KEY, DAY1_KEY, FIRSTNAME_KEY, NOTIF_KEY, LETTERS_KEY].forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  return (
    <div style={{
      position:'absolute', inset:0, background:T.bg, zIndex:600,
      display:'flex', flexDirection:'column',
      animation:closing ? 'pslide-out 0.22s ease forwards' : 'pslide 0.22s ease',
    }}>
      {/* Header */}
      <div style={{
        background:T.card, borderBottom:`1px solid ${T.border}`,
        padding:'12px 16px', paddingTop:'max(14px,env(safe-area-inset-top))',
        display:'flex', alignItems:'center', gap:12,
      }}>
        <button onClick={onBack} style={{ background:'none', border:'none', padding:'4px 8px 4px 0', cursor:'pointer', color:T.sub, touchAction:'manipulation' }}>
          <BackIcon/>
        </button>
        <p style={{ margin:0, fontSize:17, fontWeight:700, color:T.text }}>Settings</p>
      </div>

      <div style={{ flex:1, overflowY:'auto', overscrollBehavior:'contain', paddingTop:24, paddingBottom:'max(40px,env(safe-area-inset-bottom))' }}>

        {/* ── Profile ── */}
        <Section title="PROFILE">
          {/* Avatar row */}
          <div style={{ padding:'16px', display:'flex', alignItems:'center', gap:14, borderBottom:`1px solid ${T.border}` }}>
            <div style={{
              width:60, height:60, borderRadius:'50%', overflow:'hidden', flexShrink:0,
              background:T.coralLight, display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {frontPhoto
                ? <img src={frontPhoto} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <span style={{ fontSize:26, fontWeight:800, color:T.coral }}>{initial}</span>
              }
            </div>
            <div style={{ flex:1 }}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Your first name"
                style={{
                  width:'100%', border:'none', outline:'none', background:'transparent',
                  fontSize:17, fontWeight:600, color:T.text, fontFamily:'inherit',
                  padding:0, marginBottom:2,
                }}
              />
              <p style={{ margin:0, fontSize:13, color:T.muted }}>{session?.user?.email || ''}</p>
            </div>
          </div>
          <Row label="Email" value={session?.user?.email || '—'} last/>
        </Section>

        {/* ── Skin Profile ── */}
        {day1Data && (
          <Section title="SKIN PROFILE">
            <div style={{ padding:'14px 16px', borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {frontPhoto && (
                  <div style={{ width:48, height:58, borderRadius:10, overflow:'hidden', border:`1px solid ${T.border}`, flexShrink:0 }}>
                    <img src={frontPhoto} alt="Day 1" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  </div>
                )}
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    {a.condition && (
                      <span style={{ background:T.coralLight, color:T.coralDark, borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700 }}>
                        {a.condition}
                      </span>
                    )}
                    {a.severity != null && (
                      <span style={{ fontSize:12, color:T.muted }}>Severity {a.severity}/5</span>
                    )}
                  </div>
                  {a.summary && (
                    <p style={{ margin:0, fontSize:13, color:T.sub, lineHeight:1.5 }}>
                      {a.summary.length > 80 ? a.summary.slice(0, 77) + '…' : a.summary}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Row label="Redo skin assessment" onTap={onRedoOnboarding} right={<span style={{ color:T.muted, fontSize:16 }}>›</span>} last/>
          </Section>
        )}

        {/* ── Notifications ── */}
        <Section title="NOTIFICATIONS">
          <Row
            label="Morning check-in reminder"
            right={<Toggle on={notif} onToggle={handleNotif}/>}
            last
          />
        </Section>

        {/* ── Data ── */}
        <Section title="DATA">
          <Row label="Export my data" onTap={handleExport} right={<span style={{ color:T.muted, fontSize:16 }}>›</span>}/>
          <div style={{ padding:'14px 16px' }}>
            {confirmClear ? (
              <div style={{ background:'#FFF0EE', borderRadius:12, padding:'14px 16px', border:'1px solid #FFCDD2' }}>
                <p style={{ margin:'0 0 6px', fontSize:14, fontWeight:700, color:'#C62828' }}>Are you sure?</p>
                <p style={{ margin:'0 0 14px', fontSize:13, color:T.sub, lineHeight:1.5 }}>
                  This permanently deletes all messages, logs, and your skin assessment.
                </p>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setConfirmClear(false)} style={{ flex:1, padding:10, background:T.card, border:`1px solid ${T.border}`, borderRadius:10, fontFamily:'inherit', fontSize:14, cursor:'pointer', touchAction:'manipulation' }}>Cancel</button>
                  <button onClick={handleClearAll} style={{ flex:1, padding:10, background:'#C62828', border:'none', borderRadius:10, fontFamily:'inherit', fontSize:14, color:'white', fontWeight:700, cursor:'pointer', touchAction:'manipulation' }}>Delete all</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} style={{
                width:'100%', padding:'10px 16px', background:'none', border:'none',
                color:'#C62828', fontSize:15, fontFamily:'inherit', cursor:'pointer',
                textAlign:'left', touchAction:'manipulation',
              }}>
                Clear all data
              </button>
            )}
          </div>
        </Section>

        {/* ── Account ── */}
        <Section title="ACCOUNT">
          <button onClick={onSignOut} style={{
            width:'100%', padding:'14px 16px', background:'none', border:'none',
            color:'#E53935', fontSize:15, fontFamily:'inherit', cursor:'pointer',
            textAlign:'left', touchAction:'manipulation',
          }}>
            Sign out
          </button>
        </Section>

      </div>
    </div>
  )
}
