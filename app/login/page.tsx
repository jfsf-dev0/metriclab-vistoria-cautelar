'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { setSession } from '@/lib/auth';
import { Phone, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

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
      // Busca em demo_lote15_leads WHERE telefone = input AND chave_acesso = input AND status != 'expirado'
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
        setToastErro('Telefone ou chave inválidos');
        setLoading(false);
        return;
      }

      // Salva sessão
      setSession({
        lead_id: data.id,
        telefone: data.telefone,
        nome: data.nome,
      });

      // Redireciona para /trechos
      router.push('/trechos');
    } catch (err: any) {
      console.error('Erro de login:', err);
      setToastErro(err.message || 'Telefone ou chave inválidos');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-between p-6 relative">
      {/* Header Pequeno: Logo MetricLab + Lote 15 */}
      <header className="w-full flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#2563eb] flex items-center justify-center font-black text-xs text-white">
            ML
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            MetricLab
          </span>
        </div>
        <span className="text-xs font-medium text-slate-400">Lote 15</span>
      </header>

      {/* Card Centralizado */}
      <div className="w-full max-w-sm mx-auto my-auto py-8">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Identificação
            </h1>
            <p className="text-xs text-slate-400">
              Acesse sua conta para conduzir a vistoria cautelar
            </p>
          </div>

          {toastErro && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{toastErro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Telefone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Telefone (+55)
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  placeholder="+55 (11) 99999-0001"
                  className="w-full bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-xl p-4 pl-11 text-sm focus:outline-none focus:border-[#2563eb] transition"
                />
              </div>
            </div>

            {/* Campo Chave de Acesso */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Chave de Acesso (6 dígitos)
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={chaveAcesso}
                  onChange={(e) => setChaveAcesso(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-xl p-4 pl-11 text-sm tracking-widest focus:outline-none focus:border-[#2563eb] transition"
                />
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] mt-2 bg-[#2563eb] hover:bg-blue-500 active:scale-[0.98] disabled:bg-blue-900 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando credenciais...
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Texto Pequeno */}
          <p className="text-[11px] text-center text-slate-400 pt-1 leading-relaxed">
            Suas credenciais foram enviadas via WhatsApp
          </p>
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-2 text-[11px] text-slate-500 pb-safe">
        MetricLab Tecnologia & Automação de Canteiro
      </footer>
    </main>
  );
}
