import type { CouncilResponse, PersonaMode } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function postMove(
  from: string,
  to: string,
  mode: PersonaMode,
): Promise<CouncilResponse> {
  const res = await fetch(`${API_BASE}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, mode }),
  });
  if (!res.ok) throw new Error(`Engine responded with ${res.status}`);
  return res.json();
}
