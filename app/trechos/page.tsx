'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession, UserSession } from '@/lib/auth';
import { ChevronRight, MapPin, Inbox } from 'lucide-react';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrechoCardSkeleton } from '@/components/ui/loading-skeleton';

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
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col justify-between">
      {/* Header Mobile Padrão: h-14, logo ML, Trechos Disponíveis, saudação */}
      <HeaderMobile
        title="Trechos Disponíveis"
        showLogo={true}
        rightAction={
          <span className="text-xs font-medium text-slate-300">
            Olá, <strong className="text-white">{session?.nome?.split(' ')[0] || 'Inspetor'}</strong>
          </span>
        }
      />

      {/* Corpo da página */}
      <div className="flex-1 px-4 py-6 max-w-md w-full mx-auto space-y-5 animate-in fade-in duration-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Trechos Liberados
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consorcio Pacote 15 e 19 • Selecione o trecho para vistoriar
          </p>
        </div>

        {/* Loading com Skeleton Loaders */}
        {loading ? (
          <div className="space-y-3">
            <TrechoCardSkeleton />
            <TrechoCardSkeleton />
            <TrechoCardSkeleton />
          </div>
        ) : trechos.length === 0 ? (
          /* Estado vazio no padrão mlab */
          <Card className="p-8 text-center flex flex-col items-center justify-center space-y-3 mt-4 border-dashed border-slate-700">
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 shadow-inner">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">
              Nenhum trecho liberado no momento
            </h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Aguarde a liberação das etapas pelo planejamento no painel de gestão para iniciar novas vistorias.
            </p>
          </Card>
        ) : (
          /* Lista de Cards com design system */
          <div className="space-y-3">
            {trechos.map((trecho) => (
              <Card
                key={trecho.id}
                hoverable
                onClick={() => handleSelectTrecho(trecho.id)}
                className="cursor-pointer flex items-center justify-between gap-3 active:scale-[0.98] transition-all duration-200"
              >
                <div className="space-y-2 flex-1 pr-2">
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {trecho.nome}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Km {trecho.km_inicio} → {trecho.km_fim}
                    </span>

                    {trecho.etapa_planejamento && (
                      <Badge variant="azul">
                        {trecho.etapa_planejamento}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 shrink-0">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-4 text-xs text-slate-500 border-t border-slate-700/50 pb-safe">
        MetricLab • Consorcio Pacote 15 e 19
      </footer>
    </main>
  );
}
