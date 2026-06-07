import { useState, useEffect } from 'react'
import { T } from '../constants/theme.js'
import { PATCH_LOCKUP } from '../assets/avatars.js'
import { signIn, signUp, resetPassword, updatePassword, supabase } from '../lib/supabase.js'

export function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update-password')
      } else if (event === 'SIGNED_IN' && session) {
        onAuth(session)
      }
    })
    return () => subscription.unsubscribe()
  }, [onAuth])

  const clearMessages = () => { setError(''); setSuccessMsg('') }

  const handleLogin = async e => {
    e.preventDefault()
    clearMessages(); setLoading(true)
    try {
      const data = await signIn(email, password)
      onAuth(data.session)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleSignup = async e => {
    e.preventDefault()
    clearMessages()
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await signUp(email, password)
      setSuccessMsg('Check your email and click the confirmation link, then come back to sign in.')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleReset = async e => {
    e.preventDefault()
    clearMessages(); setLoading(true)
    try {
      await resetPassword(email)
      setMode('reset-sent')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleUpdatePassword = async e => {
    e.preventDefault()
    clearMessages()
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await updatePassword(newPassword)
      setSuccessMsg('Password updated! Signing you in...')
      setTimeout(() => setMode('login'), 1500)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    border: `1.5px solid ${T.border}`,
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 16,
    color: T.text,
    background: T.bg,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const btnStyle = {
    width: '100%',
    background: T.coral,
    color: 'white',
    border: 'none',
    borderRadius: 13,
    padding: '14px',
    fontSize: 15,
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: 4,
    opacity: loading ? 0.7 : 1,
  }

  const linkBtn = {
    background: 'none',
    border: 'none',
    color: T.coral,
    fontSize: 13,
    cursor: 'pointer',
    padding: '4px 0',
    fontFamily: 'inherit',
  }

  return (
    <div style={{height:'100dvh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:T.card,borderRadius:20,padding:'32px 24px',width:'100%',maxWidth:390,border:`1px solid ${T.border}`}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <img src={PATCH_LOCKUP} alt="Patch" style={{width:160,height:'auto',display:'inline-block'}}/>
        </div>

        {error && <p style={{color:T.coralDark,fontSize:13,marginBottom:14,textAlign:'center',padding:'10px 14px',background:T.coralLight,borderRadius:10}}>{error}</p>}
        {successMsg && <p style={{color:'#2D6A2D',fontSize:13,marginBottom:14,textAlign:'center',padding:'10px 14px',background:'#F0F7F0',borderRadius:10}}>{successMsg}</p>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:12}}>
            <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} required/>
            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle} required/>
            <button type="submit" style={btnStyle} disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,marginTop:8}}>
              <button type="button" style={linkBtn} onClick={()=>{clearMessages();setMode('reset')}}>Forgot password?</button>
              <button type="button" style={linkBtn} onClick={()=>{clearMessages();setMode('signup')}}>Don't have an account? Create one</button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup} style={{display:'flex',flexDirection:'column',gap:12}}>
            <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} required/>
            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle} required/>
            <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} style={inputStyle} required/>
            <button type="submit" style={btnStyle} disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
            <div style={{display:'flex',justifyContent:'center',marginTop:8}}>
              <button type="button" style={linkBtn} onClick={()=>{clearMessages();setMode('login')}}>Already have an account? Sign in</button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} style={{display:'flex',flexDirection:'column',gap:12}}>
            <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} required/>
            <button type="submit" style={btnStyle} disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
            <div style={{display:'flex',justifyContent:'center',marginTop:8}}>
              <button type="button" style={linkBtn} onClick={()=>{clearMessages();setMode('login')}}>Back to sign in</button>
            </div>
          </form>
        )}

        {mode === 'reset-sent' && (
          <div style={{textAlign:'center'}}>
            <p style={{fontSize:14,color:T.text,lineHeight:1.65,marginBottom:20}}>
              Check your email for a reset link. Click it and you'll be brought back here to set a new password.
            </p>
            <button style={btnStyle} onClick={()=>{clearMessages();setMode('login')}}>Back to sign in</button>
          </div>
        )}

        {mode === 'update-password' && (
          <form onSubmit={handleUpdatePassword} style={{display:'flex',flexDirection:'column',gap:12}}>
            <input type="password" placeholder="New password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={inputStyle} required/>
            <input type="password" placeholder="Confirm new password" value={confirmNewPassword} onChange={e=>setConfirmNewPassword(e.target.value)} style={inputStyle} required/>
            <button type="submit" style={btnStyle} disabled={loading}>{loading ? 'Updating...' : 'Set new password'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
