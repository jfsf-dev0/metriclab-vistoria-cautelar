'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function VistoriaStatusPage() {
  const params = useParams();
  const router = useRouter();
  const vistoriaId = params?.id as string;

  const [vistoria, setVistoria] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadVistoria = async () => {
    try {
      const { data, error } = await supabase
        .from('demo_lote15_vistorias')
        .select('*, trecho:demo_lote15_trechos(*)')
        .eq('id', vistoriaId)
        .single();

      if (error) throw error;
      if (data) setVistoria(data);
    } catch (err) {
      console.error('Erro ao buscar vistoria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!vistoriaId) return;
    loadVistoria();

    const channel = supabase
      .channel(`vistoria-status-${vistoriaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demo_lote15_vistorias',
          filter: `id=eq.${vistoriaId}`,
        },
        (payload) => {
          if (payload.new) {
            setVistoria((prev: any) => ({ ...prev, ...payload.new }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vistoriaId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-[#9B9B9B] text-[13px]">
        Aguardando laudo...
      </main>
    );
  }

  const isAnalisando = vistoria?.ia_aprovado === null;
  const isAprovada = vistoria?.ia_aprovado === true || vistoria?.status === 'concluida';
  const isReprovada = vistoria?.ia_aprovado === false;

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] p-6 flex flex-col justify-between max-w-md mx-auto select-none">
      <div className="flex-1 flex flex-col justify-center">
        {/* ANALISANDO */}
        {isAnalisando && !vistoria?.status && (
          <div className="text-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] animate-pulse block mb-2">
              ANALISANDO
            </span>
            <p className="text-[16px] font-normal leading-[1.5] text-[#6B6B6B]">
              Aguardando análise da IA.
            </p>
          </div>
        )}

        {/* APROVADA */}
        {isAprovada && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              APROVADA
            </span>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-[72px] font-medium text-[#111111] tracking-[-1.2px] leading-none">
                94
              </span>
              <span className="text-[16px] font-normal text-[#9B9B9B]">
                de 100
              </span>
            </div>

            <div className="w-full border-b border-[#E5E5E3] mb-6" />

            {/* Resumo lista flat */}
            <div className="divide-y divide-[#E5E5E3] border-t border-[#E5E5E3] mb-10">
              <div className="py-3 text-[16px] text-[#111111]">
                Imóvel identificado
              </div>
              <div className="py-3 text-[16px] text-[#111111]">
                Checklist concluído
              </div>
              <div className="py-3 text-[16px] text-[#111111]">
                Fotos registradas
              </div>
              <div className="py-3 text-[16px] text-[#111111]">
                Assinatura coletada
              </div>
              <div className="py-3 text-[16px] text-[#111111]">
                Georreferenciado
              </div>
            </div>

            <button
              onClick={() => router.push('/trechos')}
              className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer mb-4"
            >
              Concluir
            </button>
          </div>
        )}

        {/* REPROVADA */}
        {isReprovada && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              REPROVADA
            </span>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-[72px] font-medium text-[#111111] tracking-[-1.2px] leading-none">
                61
              </span>
              <span className="text-[16px] font-normal text-[#9B9B9B]">
                de 100
              </span>
            </div>

            <div className="w-full border-b border-[#E5E5E3] mb-6" />

            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              ITENS CRÍTICOS
            </span>
            <div className="divide-y divide-[#E5E5E3] border-t border-[#E5E5E3] mb-10">
              <div className="py-3 text-[16px] text-[#111111]">
                Danos estruturais identificados
              </div>
              <div className="py-3 text-[16px] text-[#111111]">
                Registro fotográfico insuficiente
              </div>
            </div>

            <button
              onClick={() => router.push('/trechos')}
              className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer mb-4"
            >
              Voltar aos Trechos
            </button>
          </div>
        )}
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B]">
        MetricLab · Pacote 15 e 19
      </footer>
    </main>
  );
}
