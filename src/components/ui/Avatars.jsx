import { PATCH_AVATAR } from '../../assets/avatars.js'
import { SPECIALISTS } from '../../constants/specialists.js'
import { T } from '../../constants/theme.js'

export function PatchAvatarImg({size=42,online=false}) {
  return (
    <div style={{position:"relative",flexShrink:0}}>
      <img src={PATCH_AVATAR} alt="Patch" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",display:"block"}}/>
      {online&&<div style={{position:"absolute",bottom:1,right:1,width:Math.max(9,size*0.22),height:Math.max(9,size*0.22),borderRadius:"50%",background:T.online,border:`2px solid ${T.bg}`}}/>}
    </div>
  )
}

export function SpecAvatar({spec,size=42}) {
  const idx = SPECIALISTS.findIndex(s=>s.id===spec.id)%T.avatarBg.length
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:T.avatarBg[idx],display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.3,fontWeight:"700",color:"white",flexShrink:0}}>
      {spec.initials}
    </div>
  )
}
