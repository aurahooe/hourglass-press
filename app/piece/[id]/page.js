'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase';

export default function PiecePage() {
  const { id } = useParams();
  const [piece, setPiece] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.from('hgpress_pieces').select('*, hgpress_profiles(handle,display_name,bio)').eq('id', id).maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) setErr('This slip is in a locked drawer.');
        else setPiece(data);
      });
  }, [id]);

  if (err) return <p className="empty">{err}</p>;
  if (!piece) return <p className="empty">Setting type…</p>;

  return (
    <article className="feature" style={{ gridTemplateColumns: '1fr' }}>
      <div>
        <div className="kicker">{piece.is_public ? 'public slip' : 'private slip'}</div>
        <h1>{piece.title}</h1>
        <div className="meta">
          {piece.hgpress_profiles?.display_name} · @{piece.hgpress_profiles?.handle}
        </div>
        <div className="panel" style={{ marginTop: 28, transform: 'none' }}>
          <p>{piece.body}</p>
        </div>
      </div>
    </article>
  );
}
