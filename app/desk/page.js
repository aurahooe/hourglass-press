'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase';

export default function Desk() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mine, setMine] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push('/login');
      setUser(data.user);
      const { data: prof } = await supabase.from('hgpress_profiles').select('*').eq('id', data.user.id).maybeSingle();
      setProfile(prof);
      const { data: pieces } = await supabase.from('hgpress_pieces').select('*').eq('author_id', data.user.id).order('created_at', { ascending: false });
      setMine(pieces || []);
    });
  }, [router]);

  async function saveProfile(e) {
    e.preventDefault();
    const supabase = getBrowserClient();
    const { error } = await supabase.from('hgpress_profiles').update({
      display_name: profile.display_name,
      handle: profile.handle,
      bio: profile.bio || ''
    }).eq('id', user.id);
    setMsg(error ? error.message : 'Saved.');
  }

  async function publish(e) {
    e.preventDefault();
    const supabase = getBrowserClient();
    const { error } = await supabase.from('hgpress_pieces').insert({
      author_id: user.id,
      title,
      body,
      is_public: isPublic
    });
    if (error) return setMsg(error.message);
    setTitle(''); setBody('');
    const { data: pieces } = await supabase.from('hgpress_pieces').select('*').eq('author_id', user.id).order('created_at', { ascending: false });
    setMine(pieces || []);
    setMsg(isPublic ? 'On the public table.' : 'Kept in the drawer.');
  }

  async function toggle(piece) {
    const supabase = getBrowserClient();
    await supabase.from('hgpress_pieces').update({ is_public: !piece.is_public, updated_at: new Date().toISOString() }).eq('id', piece.id);
    setMine((rows) => rows.map((r) => r.id === piece.id ? { ...r, is_public: !r.is_public } : r));
  }

  async function signOut() {
    await getBrowserClient().auth.signOut();
    router.push('/');
  }

  if (!user || !profile) return <p className="empty">Opening the drawer…</p>;

  return (
    <div style={{ display: 'grid', gap: 40 }}>
      <form className="form" onSubmit={saveProfile}>
        <div className="kicker">Your name on the page</div>
        <input value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} placeholder="display name" />
        <input value={profile.handle} onChange={(e) => setProfile({ ...profile, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} placeholder="handle" />
        <textarea value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="a short bio" />
        <div className="row">
          <button className="btn" type="submit"><span>Save profile</span></button>
          <button type="button" onClick={signOut}>Lock the desk</button>
        </div>
      </form>

      <form className="form" onSubmit={publish}>
        <div className="kicker">New slip</div>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" />
        <textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="write the hour out" />
        <label className="check">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Mark public — public slips can sit on the masthead
        </label>
        <button className="btn" type="submit"><span>File it</span></button>
      </form>

      {msg && <div className="err">{msg}</div>}

      <section>
        <div className="kicker">Drawer</div>
        <div className="grid">
          {mine.map((p) => (
            <article key={p.id} className="card">
              <div className="kicker">{p.is_public ? 'public' : 'private'}</div>
              <h3><Link href={`/piece/${p.id}`}>{p.title}</Link></h3>
              <p>{p.body.slice(0, 120)}</p>
              <button style={{ marginTop: 10 }} onClick={() => toggle(p)}>
                {p.is_public ? 'Pull from the floor' : 'Put on the floor'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
