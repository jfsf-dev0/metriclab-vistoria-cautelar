'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession, UserSession } from '@/lib/auth';
import { ChevronRight, Compass, MapPin, Loader2, Inbox } from 'lucide-react';

interface Trecho {
  id: string;
  nome: string;
  km_inicio: number;
  km_fim: number;
  status: string;
  etapa_planejamento: string;
  responsavel_nome: string;
}

export default function TrechosPage() {
  const router = useRouter();
  const [session, setSessionState] = useState<UserSession | null>(null);
  const [trechos, setTrechos] = useState<Trecho[]>([]);
  const [loading, setLoading] = useState(true);

  // Check auth
  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    setSessionState(s);
  }, [router]);

  // Load trechos liberados
  const loadTrechos = async () => {
    try {
      const { data, error } = await supabase
        .from('demo_lote15_trechos')
        .select('*')
        .eq('status', 'liberado')
        .order('km_inicio', { ascending: true });

      if (error) throw error;
      setTrechos(data || []);
    } catch (err) {
      console.error('Erro ao buscar trechos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrechos();

    // Supabase Realtime Listener on demo_lote15_trechos
    const channel = supabase
      .channel('trechos-liberados-ch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demo_lote15_trechos' },
        () => {
          loadTrechos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectTrecho = (trechoId: string) => {
    router.push(`/vistoria/novo?trecho_id=${trechoId}`);
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-between">
      {/* Header Fixo */}
      <header className="sticky top-0 z-20 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#2563eb] flex items-center justify-center font-black text-xs text-white">
            ML
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            MetricLab
          </span>
        </div>

        <span className="text-xs font-medium text-slate-300">
          Olá, <strong className="text-white">{session?.nome?.split(' ')[0] || 'Inspetor'}</strong>
        </span>
      </header>

      {/* Corpo */}
      <div className="flex-1 px-5 py-6 max-w-md w-full mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Trechos Disponíveis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Selecione o trecho para iniciar a vistoria
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin" />
            <span className="text-xs text-slate-400">Verificando trechos liberados...</span>
          </div>
        ) : trechos.length === 0 ? (
          /* Lista vazia: ilustração simples */
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3 mt-4">
            <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">
              Nenhum trecho disponível no momento
            </h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Aguarde a liberação do planejamento no sistema de obras para iniciar novas vistorias.
            </p>
          </div>
        ) : (
          /* Lista de Cards */
          <div className="space-y-3">
            {trechos.map((trecho) => (
              <div
                key={trecho.id}
                onClick={() => handleSelectTrecho(trecho.id)}
                className="min-h-[80px] bg-slate-800 border border-slate-700 hover:border-[#2563eb] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg active:scale-[0.99] transition cursor-pointer"
              >
                <div className="space-y-1.5 flex-1 pr-2">
                  <h3 className="text-base font-bold text-white leading-snug">
                    {trecho.nome}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">
                      Km {trecho.km_inicio} → {trecho.km_fim}
                    </span>

                    {trecho.etapa_planejamento && (
                      <span className="bg-blue-600/20 text-[#2563eb] border border-blue-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        {trecho.etapa_planejamento}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 shrink-0">
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-4 text-[11px] text-slate-500 border-t border-slate-800/80 pb-safe">
        MetricLab Vistoria Cautelar • Lote 15
      </footer>
    </main>
  );
}
