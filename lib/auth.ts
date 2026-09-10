export interface UserSession {
  lead_id: string;
  telefone: string;
  nome: string;
  trecho_nome?: string;
  pacote?: string;
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ml_vistoria_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session: UserSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ml_vistoria_session', JSON.stringify(session));
  document.cookie = `ml_vistoria_session=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ml_vistoria_session');
  document.cookie = 'ml_vistoria_session=; path=/; max-age=0; SameSite=Lax';
}
