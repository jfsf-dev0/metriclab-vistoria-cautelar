'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Smartphone, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { setSession } from '@/lib/auth';

type Metodo = 'chave' | 'codigo_unico';

function LoginContent() {
  const router = useRouter();

  // Etapas:
  // 0 = Entrada (Logo, títulos, botão Entrar)
  // 1 = Campo Email/Telefone
  // 2 = Escolha de Método (aparece automaticamente ao digitar)
  // 3 = Código (Chave de Acesso ou Código Único)
  const [etapa, setEtapa] = useState<number>(0);
  const [identificador, setIdentificador] = useState('');
  const [metodo, setMetodo] = useState<Metodo | null>(null);
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const codigoInputRef = useRef<HTMLInputElement>(null);

  // Foco automático ao entrar na Etapa 1
  useEffect(() => {
    if (etapa === 1) {
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [etapa]);

  // Foco automático ao entrar na Etapa 3 (seleção do método)
  useEffect(() => {
    if (metodo) {
      const timer = setTimeout(() => {
        codigoInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [metodo]);

  const triggerShake = (mensagem?: string) => {
    setShaking(true);
    if (mensagem) setErro(mensagem);
    setTimeout(() => setShaking(false), 450);
  };

  const handleVoltar = () => {
    setEtapa(0);
    setIdentificador('');
    setMetodo(null);
    setCodigo('');
    setErro(null);
  };

  const handleIdentificadorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIdentificador(val);
    setErro(null);

    // Quando usuário digita qualquer caractere → ETAPA 2 automático
    if (val.trim().length > 0) {
      if (etapa < 2) {
        setEtapa(2);
      }
    } else {
      // Se apagar tudo, volta para etapa 1 e reseta método/código
      setEtapa(1);
      setMetodo(null);
      setCodigo('');
    }
  };

  const handleSelectMetodo = (novoMetodo: Metodo) => {
    setMetodo(novoMetodo);
    setCodigo('');
    setErro(null);
  };

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCodigo(val);
    setErro(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Se estiver na etapa 0, avança para etapa 1
    if (etapa === 0) {
      setEtapa(1);
      return;
    }

    // Se ainda não escolheu método ou código não tem 6 dígitos, não submete
    if (!metodo || codigo.length < 6) {
      return;
    }

    setErro(null);
    setLoading(true);

    const inputLimpo = identificador.trim();
    const codigoLimpo = codigo.trim();

    // Validação Demo oficial: aceita 123456 para qualquer input
    if (codigoLimpo === '123456') {
      setSession({
        lead_id: 'demo-lead-123456',
        nome: 'Inspetor Demo — Pacote 15 e 19',
        telefone: inputLimpo || '+55 (11) 98765-4321',
        trecho_nome: 'Pacote 15 e 19',
        pacote: '15 e 19',
      });
      router.push('/home');
      return;
    }

    // Busca Supabase demo_lote15_leads
    try {
      const isEmail = inputLimpo.includes('@');
      let query = supabase
        .from('demo_lote15_leads')
        .select('id, nome, telefone, email, chave_acesso, status, trecho_nome, pacote')
        .eq('chave_acesso', codigoLimpo)
        .neq('status', 'expirado');

      if (isEmail) {
        query = query.ilike('email', inputLimpo.toLowerCase());
      } else {
        const cleanDigits = inputLimpo.replace(/\D/g, '');
        query = query.ilike('telefone', `%${cleanDigits || inputLimpo}%`);
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

      router.push('/home');
    } catch (err) {
      console.error('[login validation error]', err);
      setLoading(false);
      triggerShake('Código inválido');
    }
  };

  // Botão ativação
  const isCodigoValido = codigo.length === 6;
  const isBotaoAtivo =
    etapa === 0 ? true : metodo !== null && isCodigoValido && !loading;

  const textoBotao =
    etapa === 0
      ? 'Entrar'
      : metodo === 'codigo_unico'
      ? 'Confirmar'
      : 'Entrar';

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 48px)',
        maxWidth: '380px',
        margin: 'auto',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E5E3',
        borderRadius: '16px',
        padding: '32px 28px',
        transition: 'all 300ms ease',
        boxSizing: 'border-box',
      }}
      className={shaking ? 'animate-shake' : ''}
    >
      <form onSubmit={handleSubmit} className="w-full flex flex-col">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            LOGO CENTRAL
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="text-center select-none">
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.5px',
            }}
          >
            <span style={{ color: '#111111' }}>m</span>
            <span style={{ color: '#F5A623' }}>.</span>
          </span>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TÍTULO E SUBTÍTULO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="text-center mt-[16px]">
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '22px',
              fontWeight: 700,
              color: '#111111',
              lineHeight: 1.2,
            }}
          >
            Vistoria Cautelar
          </h1>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              color: '#9B9B9B',
              marginTop: '4px',
              lineHeight: 1.2,
            }}
          >
            Pacote 15 e 19
          </p>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ETAPA 1 — CAMPO EMAIL/TELEFONE
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {etapa >= 1 && (
          <div className="mt-[24px] animate-step-in flex flex-col">
            <input
              ref={emailInputRef}
              type="text"
              value={identificador}
              onChange={handleIdentificadorChange}
              placeholder="seu@email.com ou +55 (11) 99999"
              autoFocus
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                color: '#111111',
                border: 'none',
                borderBottom: '1px solid #E5E5E3',
                backgroundColor: 'transparent',
                outline: 'none',
                paddingBottom: '8px',
                paddingTop: '4px',
                width: '100%',
                boxSizing: 'border-box',
              }}
              className="placeholder:text-[#9B9B9B] focus:border-b-[#111111] transition-colors"
            />
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ETAPA 2 — ESCOLHA DO MÉTODO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {etapa >= 2 && identificador.trim().length > 0 && (
          <div className="mt-[20px] animate-step-in flex flex-col">
            <div className="flex gap-[8px] w-full">
              {/* Botão Entrar com chave */}
              <button
                type="button"
                onClick={() => handleSelectMetodo('chave')}
                style={{
                  height: '44px',
                  borderRadius: '8px',
                  backgroundColor: metodo === 'chave' ? '#F7F7F7' : '#FFFFFF',
                  border: `1px solid ${
                    metodo === 'chave' ? '#111111' : '#E5E5E3'
                  }`,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#111111',
                  transition: 'all 200ms ease',
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <Lock size={15} color="#111111" />
                <span>Entrar com chave</span>
              </button>

              {/* Botão Código único */}
              <button
                type="button"
                onClick={() => handleSelectMetodo('codigo_unico')}
                style={{
                  height: '44px',
                  borderRadius: '8px',
                  backgroundColor:
                    metodo === 'codigo_unico' ? '#F7F7F7' : '#FFFFFF',
                  border: `1px solid ${
                    metodo === 'codigo_unico' ? '#111111' : '#E5E5E3'
                  }`,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#111111',
                  transition: 'all 200ms ease',
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <Smartphone size={15} color="#111111" />
                <span>Código único</span>
              </button>
            </div>

            {/* Aviso Demo na Etapa 2 se método ainda não foi escolhido */}
            {!metodo && (
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  color: '#C4C4C2',
                  textAlign: 'center',
                  marginTop: '8px',
                }}
              >
                Demo: use o código 123456
              </p>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ETAPA 3A — ENTRAR COM CHAVE
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {metodo === 'chave' && (
          <div className="mt-[20px] animate-step-in flex flex-col">
            <div className="flex items-center justify-between">
              <label
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#9B9B9B',
                }}
              >
                CÓDIGO DE ACESSO
              </label>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  color: '#C4C4C2',
                }}
              >
                Demo: 123456
              </span>
            </div>

            <input
              ref={codigoInputRef}
              type="password"
              maxLength={6}
              value={codigo}
              onChange={handleCodigoChange}
              placeholder="••••••"
              autoFocus
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                color: '#111111',
                letterSpacing: '4px',
                border: 'none',
                borderBottom: '1px solid #E5E5E3',
                backgroundColor: 'transparent',
                outline: 'none',
                paddingBottom: '8px',
                paddingTop: '6px',
                width: '100%',
                boxSizing: 'border-box',
              }}
              className="placeholder:text-[#9B9B9B] focus:border-b-[#111111] transition-colors"
            />

            {erro && (
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: '#DC2626',
                  marginTop: '6px',
                }}
                className="animate-step-in"
              >
                {erro}
              </p>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ETAPA 3B — CÓDIGO ÚNICO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {metodo === 'codigo_unico' && (
          <div className="mt-[16px] animate-step-in flex flex-col">
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#6B6B6B',
                textAlign: 'center',
                marginBottom: '12px',
              }}
              className="truncate"
            >
              Código enviado para {identificador}
            </p>

            <div className="flex items-center justify-between">
              <label
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  color: '#9B9B9B',
                }}
              >
                CÓDIGO RECEBIDO
              </label>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  color: '#C4C4C2',
                }}
              >
                Demo: 123456
              </span>
            </div>

            <input
              ref={codigoInputRef}
              type="text"
              maxLength={6}
              value={codigo}
              onChange={handleCodigoChange}
              placeholder="000000"
              autoFocus
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                color: '#111111',
                letterSpacing: '6px',
                border: 'none',
                borderBottom: '1px solid #E5E5E3',
                backgroundColor: 'transparent',
                outline: 'none',
                paddingBottom: '8px',
                paddingTop: '6px',
                width: '100%',
                boxSizing: 'border-box',
              }}
              className="placeholder:text-[#C4C4C2] focus:border-b-[#111111] transition-colors text-center"
            />

            {erro && (
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: '#DC2626',
                  marginTop: '6px',
                  textAlign: 'center',
                }}
                className="animate-step-in"
              >
                {erro}
              </p>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            BOTÃO DE AÇÃO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className={etapa === 0 ? 'mt-[32px]' : 'mt-[24px]'}>
          <button
            type={etapa === 0 ? 'button' : 'submit'}
            onClick={etapa === 0 ? () => setEtapa(1) : undefined}
            disabled={!isBotaoAtivo}
            style={{
              height: '44px',
              borderRadius: '8px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              width: '100%',
              opacity: isBotaoAtivo ? 1.0 : 0.35,
              pointerEvents: isBotaoAtivo ? 'auto' : 'none',
              transition: 'all 200ms ease',
            }}
            className="flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validando...</span>
              </>
            ) : (
              <span>{textoBotao}</span>
            )}
          </button>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            LINK VOLTAR (ETAPAS 1, 2 E 3)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {etapa >= 1 && (
          <div className="text-center mt-[14px]">
            <button
              type="button"
              onClick={handleVoltar}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#9B9B9B',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
              className="cursor-pointer hover:text-[#111111] transition-colors select-none"
            >
              ← Voltar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main
      style={{
        backgroundColor: '#F0F0F0',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Suspense
        fallback={
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 48px)',
              maxWidth: '380px',
              height: '240px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E5E3',
              borderRadius: '16px',
            }}
            className="animate-pulse"
          />
        }
      >
        <LoginContent />
      </Suspense>
    </main>
  );
}
