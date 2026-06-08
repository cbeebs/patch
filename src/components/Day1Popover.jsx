import { T } from '../constants/theme.js'
import { CloseIcon } from './ui/Icons.jsx'

const SEV_LABELS  = ['','Very mild','Mild','Moderate','Significant','Severe']
const IMP_LABELS  = { 1:'Barely notice it', 2:'A bit annoying', 3:'Getting to me', 4:'Affecting my confidence', 5:'Really getting me down' }

export function Day1Popover({ data, onClose, closing }) {
  const { photos, answers, analysis } = data || {}
  const frontPhoto = photos?.front
  const a = analysis || {}

  return (
    <div
      onClick={onClose}
      style={{
        position:'absolute', inset:0, zIndex:700,
        background:'rgba(0,0,0,0.5)',
        display:'flex', alignItems:'flex-end',
        animation:closing ? 'pfadeout 0.22s ease forwards' : 'pfadein 0.22s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%', background:T.bg,
          borderRadius:'20px 20px 0 0',
          maxHeight:'88vh', overflowY:'auto', overscrollBehavior:'contain',
          paddingBottom:'max(32px,env(safe-area-inset-bottom))',
          animation:closing ? 'pslide-down 0.22s ease forwards' : 'pslide-up 0.3s ease',
        }}
      >
        {/* Header row */}
        <div style={{ padding:'20px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <p style={{ margin:'0 0 3px', fontSize:11, fontWeight:700, color:T.coral, letterSpacing:'0.9px', textTransform:'uppercase' }}>MY DAY 1</p>
            <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:T.navy, letterSpacing:'-0.5px' }}>Your skin baseline</h2>
          </div>
          <button onClick={onClose} style={{
            width:36, height:36, borderRadius:'50%', background:T.border,
            border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            color:T.sub, touchAction:'manipulation', flexShrink:0,
          }}>
            <CloseIcon/>
          </button>
        </div>

        {/* Photo + condition */}
        {(frontPhoto || a.condition) && (
          <div style={{ padding:'18px 20px 0', display:'flex', alignItems:'center', gap:16 }}>
            {frontPhoto && (
              <div style={{ width:80, height:96, borderRadius:14, overflow:'hidden', border:`2px solid ${T.border}`, flexShrink:0 }}>
                <img src={frontPhoto} alt="Day 1 front" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              </div>
            )}
            <div>
              {a.condition && (
                <span style={{
                  display:'inline-block', background:T.coralLight, color:T.coralDark,
                  borderRadius:20, padding:'5px 14px', fontSize:14, fontWeight:700, marginBottom:8,
                }}>
                  {a.condition}
                </span>
              )}
              {a.confidence > 0 && (
                <p style={{ margin:0, fontSize:12, color:T.muted }}>{a.confidence}% confidence</p>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {a.summary && (
          <div style={{ margin:'16px 20px 0', background:T.card, borderRadius:14, padding:'14px 16px', border:`1px solid ${T.border}` }}>
            <p style={{ margin:0, fontSize:14, color:T.navy, lineHeight:1.65, fontStyle:'italic' }}>"{a.summary}"</p>
          </div>
        )}

        {/* Severity + Impact stats */}
        <div style={{ padding:'12px 20px 0', display:'flex', gap:10 }}>
          {a.severity != null && (
            <div style={{ flex:1, background:T.card, borderRadius:14, padding:'14px 16px', border:`1px solid ${T.border}` }}>
              <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.9px', textTransform:'uppercase' }}>SEVERITY</p>
              <p style={{ margin:'0 0 2px', fontSize:24, fontWeight:800, color:T.coral }}>{a.severity}<span style={{ fontSize:14, fontWeight:400, color:T.muted }}>/5</span></p>
              <p style={{ margin:0, fontSize:11, color:T.sub }}>{SEV_LABELS[a.severity] || ''}</p>
            </div>
          )}
          {answers?.impact && (
            <div style={{ flex:1, background:T.card, borderRadius:14, padding:'14px 16px', border:`1px solid ${T.border}` }}>
              <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.9px', textTransform:'uppercase' }}>IMPACT</p>
              <p style={{ margin:'0 0 2px', fontSize:24, fontWeight:800, color:T.navy }}>{answers.impact}<span style={{ fontSize:14, fontWeight:400, color:T.muted }}>/5</span></p>
              <p style={{ margin:0, fontSize:11, color:T.sub }}>{IMP_LABELS[answers.impact] || ''}</p>
            </div>
          )}
        </div>

        {/* Answer chips */}
        {(answers?.locations?.length > 0 || answers?.symptoms?.length > 0) && (
          <div style={{ padding:'14px 20px 0' }}>
            {answers.locations?.length > 0 && (
              <div style={{ marginBottom:10 }}>
                <p style={{ margin:'0 0 6px', fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.9px', textTransform:'uppercase' }}>LOCATION</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {answers.locations.map(l => (
                    <span key={l} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:20, padding:'4px 12px', fontSize:12, color:T.text }}>{l}</span>
                  ))}
                </div>
              </div>
            )}
            {answers.symptoms?.length > 0 && (
              <div>
                <p style={{ margin:'0 0 6px', fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.9px', textTransform:'uppercase' }}>DESCRIPTION</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {answers.symptoms.map(s => (
                    <span key={s} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:20, padding:'4px 12px', fontSize:12, color:T.text }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p style={{ margin:'18px 20px 0', fontSize:12, color:T.muted, textAlign:'center', lineHeight:1.6 }}>
          You can always find this in your profile
        </p>
      </div>
    </div>
  )
}
