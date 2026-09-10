'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { setSession } from '@/lib/auth';

type OpcaoAcesso = 'chave' | 'magic';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [opcao, setOpcao] = useState<OpcaoAcesso>('chave');
  const [telefone, setTelefone] = useState('');
  const [codigoAcesso, setCodigoAcesso] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [magicEnviado, setMagicEnviado] = useState(false);

  // Phone mask: +55 (00) 00000-0000
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const cleaned = digits.startsWith('55') && digits.length > 2 ? digits.slice(2) : digits;
    const ddd = cleaned.slice(0, 2);
    const part1 = cleaned.slice(2, 7);
    const part2 = cleaned.slice(7, 11);
    if (!cleaned) return '';
    if (cleaned.length <= 2) return `+55 (${cleaned}`;
    if (cleaned.length <= 7) return `+55 (${ddd}) ${part1}`;
    return `+55 (${ddd}) ${part1}-${part2}`;
  };

  const toCleanPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  // Escutar login por magic link via Supabase Auth
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSession({
          lead_id: session.user.id,
          telefone: session.user.phone || session.user.email || '',
          nome: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário Vistoria',
        });
        router.push('/trechos');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // OPÇÃO 1 — Entrar com chave
  const handleSubmitChave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const cleanTel = toCleanPhone(telefone);
    const cleanKey = codigoAcesso.trim();

    if (!cleanTel || cleanTel.length < 12) {
      setErro('Informe um telefone válido com DDD.');
      return;
    }

    if (!cleanKey || cleanKey.length < 6) {
      setErro('A chave de acesso deve conter 6 dígitos.');
      return;
    }

    setLoading(true);

    // Bypass de código demo
    if (cleanKey === '123456') {
      setSession({
        lead_id: 'demo-lead-123456',
        telefone: cleanTel,
        nome: 'Inspetor Demo — Pacote 15 e 19',
      });
      router.push('/trechos');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('demo_lote15_leads')
        .select('id, nome, telefone, chave_acesso, status')
        .eq('telefone', cleanTel)
        .eq('chave_acesso', cleanKey)
        .neq('status', 'expirado')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        setErro('Telefone ou chave de acesso inválidos.');
        setLoading(false);
        return;
      }

      setSession({
        lead_id: data.id,
        telefone: data.telefone,
        nome: data.nome,
      });

      router.push('/trechos');
    } catch (err: any) {
      console.error('Erro de login:', err);
      setErro(err?.message || 'Telefone ou chave de acesso inválidos.');
      setLoading(false);
    }
  };

  // OPÇÃO 2 — Link Mágico
  const handleSubmitMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErro('Digite um e-mail válido.');
      return;
    }

    setLoading(true);

    // Simulação para demo@metriclab.com.br
    if (cleanEmail === 'demo@metriclab.com.br') {
      setTimeout(() => {
        setSession({
          lead_id: 'demo-magic-lead',
          telefone: '+55 11 99999-0000',
          nome: 'Demo MetricLab',
        });
        router.push('/trechos');
      }, 500);
      return;
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${origin}/trechos`,
        },
      });

      if (error) {
        console.error('[signInWithOtp]', error.message);
        setErro('Não foi possível enviar o link mágico agora. Tente novamente.');
        setLoading(false);
        return;
      }

      setMagicEnviado(true);
      setLoading(false);
    } catch (err: any) {
      console.error('[handleSubmitMagicLink]', err);
      setErro('Erro de conexão ao solicitar link mágico.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[360px]">
      {/* Opções de Acesso Lado a Lado (estilo gestão Google/Microsoft) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            setOpcao('chave');
            setErro(null);
          }}
          className={`h-11 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-all select-none cursor-pointer ${
            opcao === 'chave'
              ? 'border-[#1A202C] bg-white text-[#1A202C] shadow-xs ring-1 ring-[#1A202C]'
              : 'border-[#E2E8F0] bg-white/70 text-[#718096] hover:bg-white hover:text-[#1A202C] shadow-2xs'
          }`}
        >
          <KeyRound className="size-4" />
          <span>Entrar com chave</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setOpcao('magic');
            setErro(null);
          }}
          className={`h-11 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-all select-none cursor-pointer ${
            opcao === 'magic'
              ? 'border-[#1A202C] bg-white text-[#1A202C] shadow-xs ring-1 ring-[#1A202C]'
              : 'border-[#E2E8F0] bg-white/70 text-[#718096] hover:bg-white hover:text-[#1A202C] shadow-2xs'
          }`}
        >
          <Sparkles className="size-4 text-[#FFC028]" />
          <span>Link mágico</span>
        </button>
      </div>

      {/* Divisor */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[#E2E8F0]" />
        <span className="text-xs text-[#718096]">
          {opcao === 'chave' ? 'credenciais de campo' : 'acesso sem senha'}
        </span>
        <div className="flex-1 h-px bg-[#E2E8F0]" />
      </div>

      {/* Erro */}
      {erro && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium text-center">
          {erro}
        </div>
      )}

      {/* OPÇÃO 1: FORMULÁRIO COM CAMPOS UNDERLINE */}
      {opcao === 'chave' && (
        <form onSubmit={handleSubmitChave} className="space-y-6 animate-in fade-in-0 duration-200">
          {/* Campo Telefone */}
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#718096] mb-1">
              Telefone (+55)
            </label>
            <input
              type="tel"
              required
              value={telefone}
              onChange={(e) => {
                setTelefone(formatPhone(e.target.value));
                setErro(null);
              }}
              placeholder="+55 (11) 99999-0001"
              autoFocus
              className="w-full bg-transparent border-0 border-b border-[#CBD5E0] focus:border-[#1A202C] py-2.5 text-base text-[#1A202C] placeholder:text-[#A0AEC0] outline-none rounded-none transition-colors"
            />
          </div>

          {/* Campo Código de Acesso */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#718096]">
                Código de acesso (6 dígitos)
              </label>
              <span className="text-[10px] text-[#718096]">Demo: 123456</span>
            </div>
            <input
              type="password"
              required
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              value={codigoAcesso}
              onChange={(e) => {
                setCodigoAcesso(e.target.value.replace(/\D/g, ''));
                setErro(null);
              }}
              placeholder="••••••"
              className="w-full bg-transparent border-0 border-b border-[#CBD5E0] focus:border-[#1A202C] py-2.5 text-base text-[#1A202C] placeholder:text-[#A0AEC0] outline-none rounded-none transition-colors tracking-widest"
            />
          </div>

          {/* Botão Confirmar */}
          <button
            type="submit"
            disabled={loading || !telefone.trim() || codigoAcesso.length < 6}
            className="w-full h-11 rounded-lg bg-[#1C1C1C] text-white text-sm font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Confirmando...
              </>
            ) : (
              'Confirmar →'
            )}
          </button>
        </form>
      )}

      {/* OPÇÃO 2: LINK MÁGICO */}
      {opcao === 'magic' && (
        <div className="space-y-6 animate-in fade-in-0 duration-200">
          {magicEnviado ? (
            <div className="p-4 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs text-center space-y-3">
              <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A202C]">Link mágico enviado!</p>
                <p className="text-xs text-[#718096] mt-1">
                  Enviamos as instruções para <strong>{email}</strong>. Abra o link no seu dispositivo para acessar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMagicEnviado(false)}
                className="text-xs text-[#0061B7] hover:underline font-medium"
              >
                Tentar outro e-mail
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitMagicLink} className="space-y-6">
              {/* Campo Email Underline */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#718096]">
                    Seu e-mail corporativo
                  </label>
                  <span className="text-[10px] text-[#718096]">Demo: demo@metriclab.com.br</span>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErro(null);
                  }}
                  placeholder="seu@email.com"
                  autoFocus
                  className="w-full bg-transparent border-0 border-b border-[#CBD5E0] focus:border-[#1A202C] py-2.5 text-base text-[#1A202C] placeholder:text-[#A0AEC0] outline-none rounded-none transition-colors"
                />
              </div>

              {/* Botão Enviar Link Mágico */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-11 rounded-lg bg-[#1C1C1C] text-white text-sm font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Enviando link...
                  </>
                ) : (
                  'Enviar link mágico →'
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Texto Abaixo */}
      <p className="text-[11px] text-[#718096] text-center mt-5 select-none">
        Acesso via WhatsApp disponível em campo
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-4 py-12 select-none">
      {/* Logo m. exato do gestão */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="text-4xl font-black tracking-tighter text-[#1A202C] select-none">
          m<span style={{ color: '#FFC028' }}>.</span>
        </div>
        <div className="text-center">
          <h1 className="text-[28px] sm:text-[32px] font-bold text-[#1A202C] tracking-tight leading-tight">
            Vistoria Cautelar
          </h1>
          <p className="text-[14px] text-[#718096] font-normal mt-1.5">
            Pacote 15 e 19
          </p>
        </div>
      </div>

      {/* Card / Formulário */}
      <Suspense
        fallback={
          <div className="h-64 w-full max-w-[360px] rounded-2xl bg-white/60 p-8 shadow-2xs animate-pulse" />
        }
      >
        <LoginContent />
      </Suspense>

      {/* Rodapé padrão gestão */}
      <div className="mt-10 flex flex-col items-center gap-2 text-xs text-[#718096]">
        <div className="flex items-center gap-2">
          <a
            href="https://metriclab.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
            style={{ color: '#FFC028' }}
          >
            MetricLab
          </a>
          <span>·</span>
          <span>Pacote 15 e 19</span>
        </div>
      </div>
    </main>
  );
}
