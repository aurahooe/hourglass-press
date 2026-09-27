'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase';
import { hourKey, hashPick, msUntilNextHour } from '@/lib/hour';

export default function Front() {
  const [feature, setFeature] = useState(null);
  const [feed, setFeed] = useState([]);
  const [left, setLeft] = useState('');

  useEffect(() => {
    const supabase = getBrowserClient();
    let timer;

    async function load() {
      const key = hourKey();
      const { data: publicPieces } = await supabase
        .from('hgpress_pieces')
        .select('id,title,body,created_at,author_id,hgpress_profiles(handle,display_name)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(40);

      const pieces = publicPieces || [];
      setFeed(pieces);

      const { data: existing } = await supabase.from('hgpress_hours').select('*').eq('hour_key', key).maybeSingle();
      let chosen = pieces.find((p) => p.id === existing?.piece_id);
      if (!chosen && pieces.length) {
        chosen = pieces[hashPick(key + pieces.map((p) => p.id).join(''), pieces.length)];
        await supabase.from('hgpress_hours').upsert({ hour_key: key, piece_id: chosen.id });
      }
      setFeature(chosen || null);
    }

    function tick() {
      const ms = msUntilNextHour();
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      if (ms < 1200) load();
    }

    load();
    tick();
    timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div className="hourbar">
        <div className="sand" aria-hidden="true">
          <svg viewBox="0 0 40 56" fill="none">
            <path d="M6 4h28v8L20 28 6 12V4z" stroke="#1a1612" strokeWidth="1.4" />
            <path d="M6 52h28v-8L20 28 6 44v8z" stroke="#1a1612" strokeWidth="1.4" />
            <path className="grain" d="M10 8h20l-10 14L10 8z" fill="#9c3b22" opacity="0.75" />
          </svg>
        </div>
        <div className="rule" />
        <div className="countdown">next turn {left}</div>
      </div>

      {feature ? (
        <section className="feature">
          <div>
            <div className="kicker">This hour on the masthead</div>
            <h1>{feature.title}</h1>
            <p className="lede">{feature.body.slice(0, 220)}{feature.body.length > 220 ? '…' : ''}</p>
            <div className="meta">
              {feature.hgpress_profiles?.display_name || 'anonymous'} · @{feature.hgpress_profiles?.handle || 'press'}
            </div>
          </div>
          <aside className="panel">
            <p>{feature.body}</p>
            <Link className="btn" href={`/piece/${feature.id}`}><span>Keep reading</span></Link>
          </aside>
        </section>
      ) : (
        <p className="empty">The press is empty this hour. Sign in, write something, and mark it public.</p>
      )}

      <div className="grid">
        {feed.filter((p) => p.id !== feature?.id).map((p, i) => (
          <Link key={p.id} href={`/piece/${p.id}`} className="card" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="kicker">public</div>
            <h3>{p.title}</h3>
            <p>{p.body.slice(0, 140)}{p.body.length > 140 ? '…' : ''}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
