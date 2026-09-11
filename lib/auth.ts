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
    // Garante que nenhum acesso seja recuperado de localStorage
    if (localStorage.getItem('ml_vistoria_session')) {
      localStorage.removeItem('ml_vistoria_session');
    }

    const raw = sessionStorage.getItem('ml_vistoria_session');
    if (raw) {
      return JSON.parse(raw);
    }

    // Fallback para cookie de sessão em memória
    const match = document.cookie.match(/(^|;)\s*ml_vistoria_session=([^;]+)/);
    if (match) {
      const parsed = JSON.parse(decodeURIComponent(match[2]));
      if (parsed && (parsed.lead_id || parsed.nome)) {
        sessionStorage.setItem('ml_vistoria_session', JSON.stringify(parsed));
        return parsed;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function setSession(session: UserSession) {
  if (typeof window === 'undefined') return;
  try {
    // NUNCA persiste em localStorage
    localStorage.removeItem('ml_vistoria_session');
  } catch {}

  // Armazena estritamente na sessão ativa (sessionStorage + session cookie sem max-age)
  sessionStorage.setItem('ml_vistoria_session', JSON.stringify(session));
  document.cookie = `ml_vistoria_session=${encodeURIComponent(JSON.stringify(session))}; path=/; SameSite=Lax`;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('ml_vistoria_session');
    localStorage.removeItem('ml_vistoria_session');
  } catch {}
  document.cookie = 'ml_vistoria_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}
