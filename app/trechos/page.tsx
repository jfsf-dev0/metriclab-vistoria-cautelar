'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession, UserSession } from '@/lib/auth';
import { ChevronRight, ChevronDown } from 'lucide-react';

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
  const [openTrechoId, setOpenTrechoId] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    setSessionState(s);
  }, [router]);

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

  const toggleAccordion = (id: string) => {
    setOpenTrechoId((prev) => (prev === id ? null : id));
  };

  const handleIniciarVistoria = (trechoId: string) => {
    router.push(`/vistoria/novo?trecho_id=${trechoId}`);
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      {/* Header (52px): Logo "m." | "Trechos" center | "Olá, [Nome]" */}
      <header className="h-[52px] bg-[#F7F7F5] border-b border-[#E5E5E3] px-6 flex items-center justify-between">
        <span className="text-[20px] font-bold text-[#111111] leading-none">
          m<span className="text-[#F5A623]">.</span>
        </span>
        <span className="text-[16px] font-normal text-[#111111]">
          Trechos
        </span>
        <span className="text-[13px] font-normal text-[#9B9B9B]">
          Olá, {session?.nome?.split(' ')[0] || 'Inspetor'}
        </span>
      </header>

      {/* Conteúdo padding 24px */}
      <div className="flex-1 max-w-md w-full mx-auto p-6">
        {/* Eyebrow */}
        <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
          TRECHOS DISPONÍVEIS
        </span>

        {/* Lista accordion */}
        {loading ? (
          <div className="divide-y divide-[#E5E5E3]">
            <div className="py-4 animate-pulse">
              <div className="h-5 bg-[#E5E5E3] w-3/4 mb-2" />
            </div>
            <div className="py-4 animate-pulse">
              <div className="h-5 bg-[#E5E5E3] w-2/3 mb-2" />
            </div>
          </div>
        ) : trechos.length === 0 ? (
          <div className="py-8">
            <p className="text-[16px] font-normal leading-[1.5] text-[#6B6B6B]">
              Nenhum trecho disponível.
            </p>
          </div>
        ) : (
          <div>
            {trechos.map((trecho) => {
              const isOpen = openTrechoId === trecho.id;
              return (
                <div key={trecho.id} className="border-b border-[#E5E5E3]">
                  {/* Cabeçalho do item */}
                  <div
                    onClick={() => toggleAccordion(trecho.id)}
                    className="py-4 flex items-center justify-between cursor-pointer select-none transition-colors"
                  >
                    <span className="text-[20px] font-normal leading-none text-[#111111]">
                      {trecho.nome}
                    </span>
                    {isOpen ? (
                      <ChevronDown className="w-5 h-5 text-[#C4C4C2]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[#C4C4C2]" />
                    )}
                  </div>

                  {/* Conteúdo expandido inline */}
                  {isOpen && (
                    <div className="bg-white p-4 mb-4 rounded-none">
                      <p className="text-[16px] font-normal leading-[1.5] text-[#6B6B6B]">
                        Km {trecho.km_inicio} → {trecho.km_fim}
                      </p>
                      {trecho.etapa_planejamento && (
                        <p className="text-[13px] font-normal text-[#9B9B9B] mt-1">
                          {trecho.etapa_planejamento}
                        </p>
                      )}
                      <div className="h-4" />
                      <button
                        onClick={() => handleIniciarVistoria(trecho.id)}
                        className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
                      >
                        Iniciar Vistoria
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3]">
        MetricLab · Pacote 15 e 19
      </footer>
    </main>
  );
}
