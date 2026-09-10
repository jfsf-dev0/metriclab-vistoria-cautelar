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
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between">
      {/* Header branco fixo */}
      <HeaderMobile
        title="Trechos Disponíveis"
        showLogo={true}
        rightAction={
          <span className="text-xs font-medium text-gray-500">
            Olá, <strong className="text-gray-900">{session?.nome?.split(' ')[0] || 'Inspetor'}</strong>
          </span>
        }
      />

      {/* Corpo da página */}
      <div className="flex-1 py-6 max-w-md w-full mx-auto space-y-4 animate-in fade-in duration-200">
        {/* Título seção */}
        <div className="px-4">
          <h1 className="text-lg font-bold text-gray-900">
            Trechos Disponíveis
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Consórcio Pacote 15 e 19 • Selecione o trecho para vistoriar
          </p>
        </div>

        {/* Loading com Skeleton Loaders */}
        {loading ? (
          <div className="space-y-3 px-4">
            <TrechoCardSkeleton />
            <TrechoCardSkeleton />
            <TrechoCardSkeleton />
          </div>
        ) : trechos.length === 0 ? (
          /* Empty state: ícone cinza + "Nenhum trecho disponível" text-gray-500 */
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 mx-4 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-500">
              Nenhum trecho disponível
            </h3>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Aguarde a liberação das etapas pelo planejamento para iniciar novas vistorias.
            </p>
          </div>
        ) : (
          /* Cards trecho */
          <div className="space-y-3">
            {trechos.map((trecho) => (
              <div
                key={trecho.id}
                onClick={() => handleSelectTrecho(trecho.id)}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mx-4 mb-3 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                <div className="space-y-1.5 flex-1 pr-2">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug">
                    {trecho.nome}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-500 text-sm inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      Km {trecho.km_inicio} → {trecho.km_fim}
                    </span>

                    {trecho.etapa_planejamento && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold">
                        {trecho.etapa_planejamento}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-4 text-xs text-gray-400 border-t border-gray-200 bg-white pb-safe">
        MetricLab • Consórcio Pacote 15 e 19
      </footer>
    </main>
  );
}
