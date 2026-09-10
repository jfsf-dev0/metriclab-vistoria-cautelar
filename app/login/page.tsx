'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { setSession } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const [telefone, setTelefone] = useState('');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastErro, setToastErro] = useState<string | null>(null);

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
    setToastErro(null);

    const cleanTel = toCleanPhone(telefone);
    const cleanKey = chaveAcesso.trim();

    if (!cleanTel || cleanTel.length < 12) {
      setToastErro('Informe um telefone válido com DDD.');
      return;
    }

    if (!cleanKey || cleanKey.length < 6) {
      setToastErro('A chave de acesso deve conter 6 dígitos.');
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
        setToastErro('Telefone ou chave de acesso inválidos.');
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
      setToastErro(err.message || 'Telefone ou chave de acesso inválidos.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between p-6 select-none relative pb-safe">
      <div className="w-full max-w-sm mx-auto my-auto py-6">
        {/* Logo "m." topo centralizado */}
        <div className="flex justify-center">
          <span
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#111111',
              letterSpacing: '-0.5px',
              lineHeight: 1,
            }}
          >
            m<span style={{ color: '#F5A623' }}>.</span>
          </span>
        </div>

        <div className="h-12" />

        {/* Heading + Subtitle */}
        <div className="text-left">
          <h1 className="text-[28px] font-medium text-[#111111] tracking-[-0.5px] leading-[1.1]">
            Acesso
          </h1>
          <p className="text-[15px] font-normal text-[#6B6B6B] mt-1.5 leading-[1.5]">
            Use as credenciais enviadas via WhatsApp
          </p>
        </div>

        <div className="h-10" />

        {toastErro && (
          <div className="mb-6">
            <Toast
              message={toastErro}
              variant="error"
              onClose={() => setToastErro(null)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Label: TELEFONE + Input underline */}
          <Input
            label="TELEFONE"
            type="tel"
            required
            value={telefone}
            onChange={(e) => setTelefone(formatPhone(e.target.value))}
            placeholder="+55 (11) 99999-0001"
          />

          <div className="h-8" />

          {/* Label: CHAVE DE ACESSO + Input underline */}
          <Input
            label="CHAVE DE ACESSO"
            type="password"
            required
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
            value={chaveAcesso}
            onChange={(e) => setChaveAcesso(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
          />

          <div className="h-10" />

          {/* Botão Entrar preto full-width 48px */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
          >
            Entrar
          </Button>
        </form>

        <div className="h-4" />

        <p className="text-[11px] font-normal text-[#9B9B9B] text-center">
          MetricLab · Consórcio Pacote 15 e 19
        </p>
      </div>

      <footer className="w-full text-center py-2 text-[11px] text-[#9B9B9B]">
        MetricLab Inteligência Operacional
      </footer>
    </main>
  );
}
