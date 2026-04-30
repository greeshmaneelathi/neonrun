export const SUPABASE_URL  = 'https://dlfhzzphktypjlyajavq.supabase.co';
export const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmh6enBoa3R5cGpseWFqYXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTY4MjgsImV4cCI6MjA5MzA3MjgyOH0.Y9rQGd-YV8o4YRxwnFQsQHk9M3x-s1tmA7-xCZ3MF3c';

export async function fetchLeaderboard(limit = 10) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/leaderboard?select=name,score,coins,created_at&order=score.desc&limit=${limit}`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function submitScore(name, score, coins) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/leaderboard`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ name: name.toUpperCase().slice(0, 12), score, coins })
      }
    );
    return res.ok;
  } catch { return false; }
}
