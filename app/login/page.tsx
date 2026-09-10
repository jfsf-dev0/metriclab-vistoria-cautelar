'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Smartphone, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { setSession } from '@/lib/auth';

type Estado = 'inicial' | 'chave' | 'codigo_unico';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [estado, setEstado] = useState<Estado>('inicial');
  const [identificador, setIdentificador] = useState('');
  const [codigoAcesso, setCodigoAcesso] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  const triggerShake = (mensagem?: string) => {
    setShaking(true);
    if (mensagem) setErro(mensagem);
    setTimeout(() => setShaking(false), 450);
  };

  const handleVoltar = () => {
    setEstado('inicial');
    setCodigoAcesso('');
    setCodigoOtp('');
    setErro(null);
  };

  // ESTADO 2A: Validação com Chave de Acesso
  const handleEntrarComChave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErro(null);

    const inputLimpo = identificador.trim();
    const codigoLimpo = codigoAcesso.trim();

    if (!inputLimpo) {
      triggerShake('Informe seu e-mail ou telefone.');
      return;
    }

    if (!codigoLimpo) {
      triggerShake('Informe o código de acesso de 6 dígitos.');
      return;
    }

    setLoading(true);

    // Bypass Demo oficial: 123456
    if (codigoLimpo === '123456') {
      setSession({
        lead_id: 'demo-lead-123456',
        nome: 'Inspetor Demo — Pacote 15 e 19',
        telefone: inputLimpo,
        trecho_nome: 'Pacote 15 e 19',
        pacote: '15 e 19',
      });
      router.push('/trechos');
      return;
    }

    try {
      const isEmail = inputLimpo.includes('@');
      let query = supabase
        .from('demo_lote15_leads')
        .select('id, nome, telefone, email, chave_acesso, status, trecho_nome, pacote')
        .eq('chave_acesso', codigoLimpo)
        .neq('status', 'expirado');

      if (isEmail) {
        query = query.eq('email', inputLimpo.toLowerCase());
      } else {
        const cleanDigits = inputLimpo.replace(/\D/g, '');
        query = query.ilike('telefone', `%${cleanDigits}%`);
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        setLoading(false);
        triggerShake('Código inválido');
        return;
      }

      setSession({
        lead_id: data.id,
        nome: data.nome,
        telefone: data.telefone || inputLimpo,
        trecho_nome: data.trecho_nome || 'Pacote 15 e 19',
        pacote: data.pacote || '15 e 19',
      });

      router.push('/trechos');
    } catch (err) {
      console.error('[handleEntrarComChave]', err);
      setLoading(false);
      triggerShake('Código inválido');
    }
  };

  // ESTADO 2B: Validação com Código Único (Demo 123456)
  const handleConfirmarCodigoUnico = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErro(null);

    const inputLimpo = identificador.trim();
    const codigoLimpo = codigoOtp.trim();

    if (!codigoLimpo) {
      triggerShake('Digite o código recebido.');
      return;
    }

    setLoading(true);

    // Aceita 123456 para qualquer input (Demo)
    if (codigoLimpo === '123456') {
      setSession({
        lead_id: 'demo-lead-123456',
        nome: 'Inspetor Demo — Pacote 15 e 19',
        telefone: inputLimpo || '+55 (11) 98765-4321',
        trecho_nome: 'Pacote 15 e 19',
        pacote: '15 e 19',
      });
      router.push('/trechos');
      return;
    }

    // Busca no Supabase caso seja outro código existente
    try {
      const { data, error } = await supabase
        .from('demo_lote15_leads')
        .select('id, nome, telefone, email, status, trecho_nome, pacote')
        .eq('chave_acesso', codigoLimpo)
        .neq('status', 'expirado')
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        triggerShake('Código inválido');
        return;
      }

      setSession({
        lead_id: data.id,
        nome: data.nome,
        telefone: data.telefone || inputLimpo,
        trecho_nome: data.trecho_nome || 'Pacote 15 e 19',
        pacote: data.pacote || '15 e 19',
      });

      router.push('/trechos');
    } catch (err) {
      console.error('[handleConfirmarCodigoUnico]', err);
      setLoading(false);
      triggerShake('Código inválido');
    }
  };

  return (
    <div
      className={`w-full max-w-[380px] bg-white rounded-[12px] border border-[#E5E5E3] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out ${
        shaking ? 'animate-shake' : ''
      }`}
    >
      {/* Logo */}
      <div className="text-center">
        <span className="text-[28px] font-bold text-[#111111] leading-none tracking-tight select-none">
          m<span className="text-[#F5A623]">.</span>
        </span>
      </div>

      {/* Título e Subtítulo */}
      <div className="text-center mt-4">
        <h1 className="text-[22px] font-bold text-[#111111] leading-tight">
          Vistoria Cautelar
        </h1>
        <p className="text-[13px] font-normal text-[#9B9B9B] mt-1">
          Pacote 15 e 19
        </p>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ESTADO 1 — INICIAL
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {estado === 'inicial' && (
        <div className="mt-6 space-y-5 animate-in fade-in-0 duration-200">
          <div>
            <input
              type="text"
              value={identificador}
              onChange={(e) => {
                setIdentificador(e.target.value);
                setErro(null);
              }}
              placeholder="seu@email.com ou +55 (11) 99999-9999"
              autoFocus
              className="w-full border-0 border-b border-[#E5E5E3] bg-transparent py-2.5 text-[15px] text-[#111111] placeholder:text-[#9B9B9B] focus:border-[#111111] focus:outline-none transition-colors"
            />
          </div>

          {erro && (
            <p className="text-[12px] text-[#dc2626] font-medium text-center">
              {erro}
            </p>
          )}

          {/* Dois botões lado a lado */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEstado('chave');
                setErro(null);
              }}
              className="flex-1 h-[44px] bg-white border border-[#E5E5E3] rounded-[8px] inline-flex items-center justify-center gap-2 hover:bg-[#F9F9F8] transition-colors cursor-pointer select-none"
            >
              <Lock className="w-4 h-4 text-[#111111]" />
              <span className="text-[13px] font-medium text-[#111111]">
                Entrar com chave
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEstado('codigo_unico');
                setErro(null);
              }}
              className="flex-1 h-[44px] bg-white border border-[#E5E5E3] rounded-[8px] inline-flex items-center justify-center gap-2 hover:bg-[#F9F9F8] transition-colors cursor-pointer select-none"
            >
              <Smartphone className="w-4 h-4 text-[#111111]" />
              <span className="text-[13px] font-medium text-[#111111]">
                Código único
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E5E5E3]" />
            <span className="text-[12px] text-[#9B9B9B]">ou</span>
            <div className="flex-1 h-px bg-[#E5E5E3]" />
          </div>

          {/* Botão Entrar preto full-width */}
          <button
            type="button"
            onClick={() => {
              setEstado('chave');
              setErro(null);
            }}
            className="w-full h-[44px] bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center"
          >
            Entrar
          </button>

          {/* Rodapé Demo */}
          <p className="text-[11px] text-[#C4C4C2] text-center mt-4">
            Demo: use o código 123456
          </p>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ESTADO 2A — ENTRAR COM CHAVE
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {estado === 'chave' && (
        <form
          onSubmit={handleEntrarComChave}
          className="mt-6 space-y-5 animate-in fade-in-0 duration-200"
        >
          {/* Mantém campo email/telefone */}
          <div>
            <input
              type="text"
              value={identificador}
              onChange={(e) => {
                setIdentificador(e.target.value);
                setErro(null);
              }}
              placeholder="seu@email.com ou +55 (11) 99999-9999"
              className="w-full border-0 border-b border-[#E5E5E3] bg-transparent py-2.5 text-[15px] text-[#111111] placeholder:text-[#9B9B9B] focus:border-[#111111] focus:outline-none transition-colors"
            />
          </div>

          {/* Novo campo: Código de Acesso */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block">
                CÓDIGO DE ACESSO (6 DÍGITOS)
              </label>
              <span className="text-[10px] text-[#C4C4C2]">
                Demo: 123456
              </span>
            </div>
            <input
              type="password"
              maxLength={6}
              value={codigoAcesso}
              onChange={(e) => {
                setCodigoAcesso(e.target.value);
                setErro(null);
              }}
              placeholder="••••••"
              autoFocus
              className="w-full border-0 border-b border-[#E5E5E3] bg-transparent py-2 text-[15px] text-[#111111] tracking-[4px] placeholder:text-[#9B9B9B] focus:border-[#111111] focus:outline-none transition-colors"
            />
            {erro && (
              <p className="text-[12px] text-[#dc2626] font-medium mt-1.5">
                {erro}
              </p>
            )}
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[44px] bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>

          {/* Link Voltar */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleVoltar}
              className="text-[12px] text-[#9B9B9B] hover:text-[#111111] transition-colors cursor-pointer"
            >
              ← Voltar
            </button>
          </div>
        </form>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ESTADO 2B — CÓDIGO ÚNICO
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {estado === 'codigo_unico' && (
        <form
          onSubmit={handleConfirmarCodigoUnico}
          className="mt-6 space-y-5 animate-in fade-in-0 duration-200"
        >
          {identificador.trim() ? (
            <div className="text-center">
              <p className="text-[13px] text-[#6B6B6B]">
                Enviamos um código para
              </p>
              <p className="text-[13px] font-medium text-[#111111] mt-0.5 truncate">
                {identificador}
              </p>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={identificador}
                onChange={(e) => {
                  setIdentificador(e.target.value);
                  setErro(null);
                }}
                placeholder="seu@email.com ou +55 (11) 99999-9999"
                className="w-full border-0 border-b border-[#E5E5E3] bg-transparent py-2.5 text-[15px] text-[#111111] placeholder:text-[#9B9B9B] focus:border-[#111111] focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Campo Código Recebido */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block">
                CÓDIGO RECEBIDO
              </label>
              <span className="text-[10px] text-[#C4C4C2]">
                Demo: qualquer número usa 123456
              </span>
            </div>
            <input
              type="text"
              maxLength={6}
              value={codigoOtp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setCodigoOtp(val);
                setErro(null);
              }}
              placeholder="000000"
              autoFocus
              className="w-full border-0 border-b border-[#E5E5E3] bg-transparent py-2 text-[15px] text-[#111111] tracking-[6px] placeholder:text-[#C4C4C2] focus:border-[#111111] focus:outline-none transition-colors text-center"
            />
            {erro && (
              <p className="text-[12px] text-[#dc2626] font-medium mt-1.5 text-center">
                {erro}
              </p>
            )}
          </div>

          {/* Botão Confirmar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[44px] bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirmando...</span>
              </>
            ) : (
              'Confirmar'
            )}
          </button>

          {/* Link Voltar */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleVoltar}
              className="text-[12px] text-[#9B9B9B] hover:text-[#111111] transition-colors cursor-pointer"
            >
              ← Voltar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-[380px] h-[340px] bg-white rounded-[12px] border border-[#E5E5E3] p-8 animate-pulse" />
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
