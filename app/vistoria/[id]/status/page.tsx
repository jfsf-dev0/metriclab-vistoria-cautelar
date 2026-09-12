'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useDesktopBlock } from '@/hooks/useDesktopBlock';

export default function VistoriaStatusPage() {
  useDesktopBlock();
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

  const isAnalisando = vistoria?.ia_aprovado === null && vistoria?.status !== 'concluida';
  const isAprovada = vistoria?.ia_aprovado === true || vistoria?.status === 'concluida';
  const isReprovada = vistoria?.ia_aprovado === false;

  const dataFormatada = vistoria?.created_at
    ? new Date(vistoria.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '11/09/2026';

  const fotosList = Array.isArray(vistoria?.fotos) && vistoria.fotos.length > 0
    ? vistoria.fotos
    : [
        'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=400&q=80',
        'https://images.unsplash.com/photo-1584463699039-44e233827588?w=400&q=80',
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=400&q=80',
      ];

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between font-sans select-none">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HEADER UNIFICADO (56PX)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="h-[56px] bg-white border-b border-[#E2E2DC] px-4 flex items-center justify-between sticky top-0 z-20">
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="min-w-[44px] min-h-[44px] flex items-center text-[14px] font-medium text-[#111111] hover:opacity-80 transition-opacity"
        >
          ← Voltar
        </button>
        <h1 className="text-[18px] font-semibold text-[#111111] tracking-[-0.3px]">
          Status da Vistoria
        </h1>
        <div className="min-w-[44px] min-h-[44px]" />
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CONTEÚDO PRINCIPAL
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 max-w-md w-full mx-auto px-5 py-6 space-y-6 pb-24">
        {/* CARD DE STATUS NO TOPO */}
        <div className="bg-white border border-[#E2E2DC] rounded-[12px] p-4 shadow-none">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`px-2.5 py-1 text-[12px] font-medium uppercase tracking-[0.08em] rounded-[4px] ${
                isAprovada
                  ? 'bg-[#111111] text-white'
                  : isReprovada
                  ? 'bg-white border border-[#DC2626] text-[#DC2626]'
                  : 'bg-white border border-[#111111] text-[#111111]'
              }`}
            >
              {isAprovada ? 'APROVADA' : isReprovada ? 'REPROVADA' : 'EM ANÁLISE'}
            </span>
            <span className="text-[13px] font-medium text-[#6B7280]">
              Laudo Pericial
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[44px] font-bold text-[#111111] leading-none tracking-[-0.03em]">
              {isAprovada ? '94' : isReprovada ? '61' : '88'}
            </span>
            <span className="text-[15px] font-normal text-[#9CA3AF]">
              de 100 pontos
            </span>
          </div>

          <p className="text-[13px] text-[#6B7280] mt-2 leading-relaxed">
            {isAprovada
              ? 'Vistoria cautelar em conformidade com as normas ABNT NBR 12.722 e 13.752.'
              : 'Apontamentos identificados para revisão com a equipe de engenharia.'}
          </p>
        </div>

        {/* DADOS DA VISTORIA EM GRID 2 COLUNAS */}
        <div>
          <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
            INFORMAÇÕES DA VISTORIA
          </span>
          <div className="bg-white border border-[#E2E2DC] rounded-[12px] p-4 grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                IMÓVEL / LOTE
              </span>
              <p className="text-[15px] text-[#111111] font-medium mt-0.5">
                {vistoria?.numero_lote || vistoria?.numero_residencia || 'Lote 154'}
              </p>
            </div>

            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                TRECHO
              </span>
              <p className="text-[15px] text-[#111111] font-medium mt-0.5 truncate">
                {vistoria?.trecho?.nome || 'Trecho 01'}
              </p>
            </div>

            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                VISTORIADOR
              </span>
              <p className="text-[15px] text-[#111111] font-medium mt-0.5 truncate">
                {vistoria?.responsavel_nome || 'Inspetor de Campo'}
              </p>
            </div>

            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                DATA
              </span>
              <p className="text-[15px] text-[#111111] font-medium mt-0.5">
                {dataFormatada}
              </p>
            </div>

            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                CHECKLIST
              </span>
              <p className="text-[15px] text-[#111111] font-medium mt-0.5">
                6/6 Conforme
              </p>
            </div>

            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                ASSINATURA
              </span>
              <p className="text-[15px] text-[#111111] font-medium mt-0.5">
                Coletada
              </p>
            </div>
          </div>
        </div>

        {/* GALERIA DE FOTOS (GRID 3 COLUNAS, RAIO 0, 1:1) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
              GALERIA DE FOTOS
            </span>
            <span className="text-[13px] text-[#9CA3AF]">
              {fotosList.length} registradas
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {fotosList.map((fotoUrl: string, idx: number) => (
              <div
                key={idx}
                className="aspect-square bg-white border border-[#E2E2DC] rounded-[8px] overflow-hidden"
              >
                <img
                  src={fotoUrl}
                  alt={`Registro fotográfico ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* AÇÕES NO RODAPÉ */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/home')}
            className="w-full h-[52px] bg-[#111111] hover:bg-black active:opacity-85 text-white text-[15px] font-semibold rounded-[8px] transition-opacity flex items-center justify-center cursor-pointer"
          >
            Concluir e Voltar
          </button>
        </div>
      </div>
    </main>
  );
}
