'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function ensureProfile(supabase, user) {
    const handle = (email.split('@')[0] || 'reader').replace(/[^a-z0-9]/gi, '').slice(0, 16) + user.id.slice(0, 3);
    await supabase.from('hgpress_profiles').upsert({
      id: user.id,
      handle,
      display_name: email.split('@')[0] || 'reader'
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    const supabase = getBrowserClient();
    if (mode === 'up') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return setMsg(error.message);
      if (data.user) await ensureProfile(supabase, data.user);
      setMsg(data.session ? 'Desk is open.' : 'Check your inbox if confirmation is on, then come back.');
      if (data.session) router.push('/desk');
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setMsg(error.message);
      if (data.user) await ensureProfile(supabase, data.user);
      router.push('/desk');
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="kicker">The key</div>
      <h2 style={{ fontFamily: 'Didot, serif', fontSize: 42, fontWeight: 400, margin: '6px 0 8px' }}>
        {mode === 'in' ? 'Come back in.' : 'Take a desk.'}
      </h2>
      <input type="email" required placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" required minLength={6} placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {msg && <div className="err">{msg}</div>}
      <div className="row">
        <button className="btn" type="submit"><span>{mode === 'in' ? 'Unlock' : 'Open account'}</span></button>
        <button type="button" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'Need a desk?' : 'Already have a key?'}
        </button>
      </div>
    </form>
  );
}
