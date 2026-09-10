'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession, UserSession } from '@/lib/auth';
import { ChevronRight } from 'lucide-react';
import { HeaderMobile } from '@/components/layout/HeaderMobile';

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
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      {/* Header: logo + "Trechos" + "Olá, [Nome]" */}
      <HeaderMobile
        title="Trechos"
        showLogo={true}
        rightAction={
          <span className="text-[13px] font-normal text-[#9B9B9B]">
            Olá, <span className="text-[#111111]">{session?.nome?.split(' ')[0] || 'Inspetor'}</span>
          </span>
        }
      />

      <div className="flex-1 max-w-md w-full mx-auto px-5 py-5">
        {/* Eyebrow label */}
        <div className="pt-2 pb-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
            TRECHOS DISPONÍVEIS
          </span>
        </div>

        {/* Loading ou lista sem cards */}
        {loading ? (
          <div className="divide-y divide-[#E5E5E3]">
            <div className="py-4 animate-pulse">
              <div className="h-4 bg-[#E5E5E3] w-3/4 rounded mb-2" />
              <div className="h-3 bg-[#EFEFED] w-1/2 rounded" />
            </div>
            <div className="py-4 animate-pulse">
              <div className="h-4 bg-[#E5E5E3] w-2/3 rounded mb-2" />
              <div className="h-3 bg-[#EFEFED] w-1/3 rounded" />
            </div>
          </div>
        ) : trechos.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[14px] text-[#6B6B6B]">
              Nenhum trecho liberado no momento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E3]">
            {trechos.map((trecho) => (
              <div
                key={trecho.id}
                onClick={() => handleSelectTrecho(trecho.id)}
                className="py-4 flex items-center justify-between gap-4 cursor-pointer transition-colors hover:bg-[#EFEFED] -mx-5 px-5"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-[#111111] leading-snug truncate">
                    {trecho.nome}
                  </div>
                  <div className="text-[13px] text-[#9B9B9B] mt-0.5 flex items-center gap-2">
                    <span>
                      Km {trecho.km_inicio} → {trecho.km_fim}
                    </span>
                    {trecho.etapa_planejamento && (
                      <>
                        <span>·</span>
                        <span>{trecho.etapa_planejamento}</span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#C4C4C2] shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3] bg-[#F7F7F5] pb-safe">
        MetricLab · Consórcio Pacote 15 e 19
      </footer>
    </main>
  );
}
