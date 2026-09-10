'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { setSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [telefone, setTelefone] = useState('');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const cleanTel = toCleanPhone(telefone);
    const cleanKey = chaveAcesso.trim();

    if (!cleanTel || cleanTel.length < 12) {
      setErro('Informe um telefone válido com DDD.');
      return;
    }

    if (!cleanKey || cleanKey.length < 6) {
      setErro('A chave de acesso deve conter 6 dígitos.');
      return;
    }

    setLoading(true);

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
      setErro(err.message || 'Telefone ou chave de acesso inválidos.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] p-6 flex flex-col justify-center max-w-md mx-auto select-none">
      {/* "m." centralizado 28px */}
      <div className="flex justify-center mb-12">
        <span className="text-[28px] font-bold text-[#111111] leading-none tracking-tight">
          m<span className="text-[#F5A623]">.</span>
        </span>
      </div>

      {/* Título & Subtítulo */}
      <div className="mb-10">
        <h1 className="text-[20px] font-normal leading-none text-[#111111] mb-1">
          Acesso
        </h1>
        <p className="text-[16px] font-normal leading-[1.5] text-[#6B6B6B]">
          Credenciais enviadas via WhatsApp
        </p>
      </div>

      {erro && (
        <div className="mb-6 text-[13px] text-[#111111] border-b border-[#111111] pb-2 font-normal">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Label TELEFONE + Input underline */}
        <div className="mb-8 flex flex-col">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] mb-[6px]">
            TELEFONE
          </label>
          <input
            type="tel"
            required
            value={telefone}
            onChange={(e) => setTelefone(formatPhone(e.target.value))}
            placeholder="+55 (11) 99999-0001"
            className="w-full bg-transparent border-0 border-b border-[#E5E5E3] focus:border-[#111111] py-3 text-[16px] text-[#111111] placeholder:text-[#9B9B9B] outline-none rounded-none transition-colors"
          />
        </div>

        {/* Label CHAVE DE ACESSO + Input underline */}
        <div className="mb-10 flex flex-col">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] mb-[6px]">
            CHAVE DE ACESSO
          </label>
          <input
            type="password"
            required
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
            value={chaveAcesso}
            onChange={(e) => setChaveAcesso(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="w-full bg-transparent border-0 border-b border-[#E5E5E3] focus:border-[#111111] py-3 text-[16px] text-[#111111] placeholder:text-[#9B9B9B] outline-none rounded-none transition-colors tracking-widest"
          />
        </div>

        {/* Botão Entrar preto */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center disabled:opacity-50 cursor-pointer mb-4"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {/* Rodapé do form */}
      <p className="text-[11px] text-[#9B9B9B] text-center">
        MetricLab · Pacote 15 e 19
      </p>
    </main>
  );
}
