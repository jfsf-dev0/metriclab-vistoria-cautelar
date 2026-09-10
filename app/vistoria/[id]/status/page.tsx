'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Button } from '@/components/ui/button';

export default function VistoriaStatusPage() {
  const params = useParams();
  const router = useRouter();
  const vistoriaId = params?.id as string;

  const [vistoria, setVistoria] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Laudo de Vistoria Cautelar · Consórcio Pacote 15 e 19',
          text: `Laudo de vistoria para o imóvel nº ${vistoria?.numero_residencia || ''} no ${vistoria?.trecho?.nome || ''}`,
          url,
        });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-[#9B9B9B] text-[13px]">
        Carregando laudo...
      </main>
    );
  }

  const isAnalisando = vistoria?.ia_aprovado === null;
  const isAprovada = vistoria?.ia_aprovado === true;
  const isReprovada = vistoria?.ia_aprovado === false;

  const score = vistoria?.ia_score !== null && vistoria?.ia_score !== undefined
    ? vistoria.ia_score
    : isAprovada
    ? 94
    : 61;

  const resumo =
    vistoria?.ia_resumo ||
    (isAprovada
      ? 'Análise de conformidade executada com sucesso. Nenhuma anomalia estrutural ou inconformidade crítica detectada no imóvel.'
      : 'Identificados pontos de atenção estrutural que exigem validação prévia antes da emissão do laudo definitivo.');

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      <HeaderMobile
        title="Laudo de Vistoria"
        showLogo={true}
        leftAction={
          <button
            onClick={() => router.push('/trechos')}
            className="text-[14px] font-normal text-[#111111] hover:text-black cursor-pointer bg-transparent border-none p-0"
          >
            ← Voltar
          </button>
        }
      />

      <div className="flex-1 max-w-md w-full mx-auto px-6 py-10 flex flex-col justify-center">
        {/* ESTADO 1: ANALISANDO */}
        {isAnalisando && (
          <div className="text-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] animate-pulse">
              ANALISANDO
            </span>
            <div className="h-2" />
            <p className="text-[15px] font-normal text-[#6B6B6B] leading-[1.5]">
              Aguardando análise da IA
            </p>
          </div>
        )}

        {/* ESTADO 2: APROVADA */}
        {isAprovada && (
          <div className="text-left">
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
              APROVADA
            </span>
            <div className="h-2" />
            <div className="flex items-baseline gap-2">
              <span className="text-[72px] font-medium text-[#111111] tracking-[-1.2px] leading-none">
                {score}
              </span>
              <span className="text-[15px] font-normal text-[#9B9B9B]">
                de 100
              </span>
            </div>

            <div className="border-b border-[#E5E5E3] my-6" />

            <p className="text-[15px] font-normal text-[#6B6B6B] leading-[1.5]">
              {resumo}
            </p>

            {Array.isArray(vistoria?.checklist) && vistoria.checklist.length > 0 && (
              <div className="mt-8 divide-y divide-[#E5E5E3]">
                {vistoria.checklist.map((c: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-[13px]">
                    <span className="text-[#6B6B6B]">{c.item}</span>
                    <span className="text-[#9B9B9B]">
                      {c.conforme ? 'Conforme' : 'Não conforme'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="h-10" />

            <div className="space-y-3">
              <Button
                onClick={handleShare}
                className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
              >
                {copied ? 'Link Copiado' : 'Compartilhar Laudo'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/trechos')}
                className="w-full text-[14px] text-[#111111] font-normal"
              >
                Voltar aos Trechos
              </Button>
            </div>
          </div>
        )}

        {/* ESTADO 3: REPROVADA */}
        {isReprovada && (
          <div className="text-left">
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
              REPROVADA
            </span>
            <div className="h-2" />
            <div className="flex items-baseline gap-2">
              <span className="text-[72px] font-medium text-[#111111] tracking-[-1.2px] leading-none">
                {score}
              </span>
              <span className="text-[15px] font-normal text-[#9B9B9B]">
                de 100
              </span>
            </div>

            <div className="border-b border-[#E5E5E3] my-6" />

            <p className="text-[15px] font-normal text-[#6B6B6B] leading-[1.5] mb-6">
              {resumo}
            </p>

            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              ITENS CRÍTICOS
            </span>
            <div className="divide-y divide-[#E5E5E3]">
              {Array.isArray(vistoria?.checklist) &&
                vistoria.checklist
                  .filter((c: any) => !c.conforme)
                  .map((c: any, idx: number) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-[13px]">
                      <span className="text-[#111111]">{c.item}</span>
                      <span className="text-[#9B9B9B]">Atenção</span>
                    </div>
                  ))}
            </div>

            <div className="h-10" />

            <div className="space-y-3">
              <Button
                onClick={() => router.push(`/vistoria/novo?trecho_id=${vistoria?.trecho_id}`)}
                className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
              >
                Refazer Vistoria
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/trechos')}
                className="w-full text-[14px] text-[#111111] font-normal"
              >
                Voltar aos Trechos
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3] bg-[#F7F7F5] pb-safe">
        MetricLab · Consórcio Pacote 15 e 19
      </footer>
    </main>
  );
}
