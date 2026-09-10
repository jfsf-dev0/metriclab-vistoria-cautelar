'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Share2,
  RotateCcw,
  Check,
  X,
  MapPin,
} from 'lucide-react';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

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

    // Supabase Realtime Listener
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
          title: 'Laudo de Vistoria Cautelar • Consorcio Pacote 15 e 19',
          text: `Confira o laudo da vistoria cautelar para o imóvel nº ${vistoria?.numero_residencia || ''} no ${vistoria?.trecho?.nome || ''}`,
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
      <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between">
        <HeaderMobile title="Laudo de Vistoria" showLogo={true} />
        <div className="flex-1 p-6 max-w-sm w-full mx-auto space-y-4 my-auto">
          <LoadingSkeleton variant="card" className="h-64" />
          <LoadingSkeleton variant="text" className="h-6 w-full" />
          <LoadingSkeleton variant="button" />
        </div>
        <footer className="w-full text-center py-4 text-xs text-gray-400 bg-white border-t border-gray-200 pb-safe">
          MetricLab • Carregando laudo...
        </footer>
      </main>
    );
  }

  const iaAprovado = vistoria?.ia_aprovado;
  const isAprovada = iaAprovado === true;
  const isReprovada = iaAprovado === false;
  const isPendenteIA = iaAprovado === null || iaAprovado === undefined;

  const iaAnalise = vistoria?.ia_analise || {};
  const score = iaAnalise.score ?? 95;
  const resumo =
    iaAnalise.resumo ||
    'Vistoria técnica aprovada com integridade estrutural atestada e conformidade fotográfica validada.';
  const itensCriticos: string[] = iaAnalise.itens_criticos || [
    'Risco de fissura estrutural na fachada',
    'Acesso obstruído por entulho',
  ];
  const recomendacoes: string[] = iaAnalise.recomendacoes || [
    'Executar reparos antes da liberação do pavimento',
    'Realizar nova inspeção após desobstrução',
  ];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between">
      {/* Header Mobile Padrão */}
      <HeaderMobile
        title="Laudo de Vistoria"
        showLogo={true}
        rightAction={
          <span className="bg-gray-100 text-gray-700 border border-gray-200 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            Nº {vistoria?.numero_residencia || '—'}
          </span>
        }
      />

      {/* Conteúdo Central */}
      <div className="flex-1 my-auto py-6 max-w-md w-full mx-auto space-y-4 animate-in fade-in duration-200">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ESTADO 1: PENDENTE IA (ia_aprovado = null)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isPendenteIA && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mx-4 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-8 h-8 text-blue-600 animate-spin" />
            </div>

            <div className="space-y-2">
              <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold">
                Processamento em Tempo Real
              </span>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                Vistoria enviada. Aguardando análise da IA...
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed pt-1">
                Nossos modelos de visão computacional estão analisando os dados e fotografias coletados em campo. O laudo atualizará automaticamente.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gray-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              <span>Supabase Realtime ativo</span>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ESTADO 2: APROVADA (ia_aprovado = true)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isAprovada && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mx-4 text-center space-y-5">
            {/* Banner Aprovada */}
            <div className="border border-green-200 bg-green-50 rounded-2xl p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>

              <div className="space-y-0.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Vistoria Aprovada
                </h1>
                <p className="text-xs text-green-700 font-semibold uppercase tracking-wider">
                  Laudo Técnico em Conformidade
                </p>
              </div>

              {/* Score: text-gray-900 font-black text-6xl */}
              <div className="pt-2">
                <span className="text-xs uppercase font-bold text-gray-500 tracking-wider block mb-1">
                  Score de Conformidade IA
                </span>
                <span className="text-6xl leading-none font-black text-gray-900 tracking-tight block">
                  {score}
                </span>
                <span className="text-xs text-gray-400 block mt-2">
                  Índice global de conformidade técnica
                </span>
              </div>
            </div>

            {/* Resumo da Análise */}
            <div className="text-left bg-gray-50 border border-gray-200 rounded-xl p-4">
              <span className="text-xs uppercase font-bold text-gray-500 tracking-wider block mb-1.5">
                Parecer Técnico IA
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{resumo}</p>
            </div>

            {/* Checklist de Itens com Badges */}
            {Array.isArray(vistoria?.checklist) && vistoria.checklist.length > 0 && (
              <div className="text-left space-y-2 pt-1">
                <span className="text-xs uppercase font-bold text-gray-500 tracking-wider block px-1">
                  Quesitos Inspecionados
                </span>
                <div className="space-y-1.5">
                  {vistoria.checklist.map((c: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-700 pr-2 truncate">
                        {c.item}
                      </span>
                      {c.conforme ? (
                        <span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 font-semibold inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Sim
                        </span>
                      ) : (
                        <span className="bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5 font-semibold inline-flex items-center gap-1">
                          <X className="w-3 h-3" /> Não
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botão Compartilhar */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleShare}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl px-6 py-3 min-h-[48px] w-full transition-all duration-200 shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Link do Laudo Copiado!' : 'Compartilhar Laudo'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ESTADO 3: REPROVADA (ia_aprovado = false)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isReprovada && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mx-4 text-center space-y-5">
            {/* Banner Reprovada */}
            <div className="border border-red-200 bg-red-50 rounded-2xl p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>

              <div className="space-y-0.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Vistoria Reprovada
                </h1>
                <p className="text-xs text-red-700 font-semibold uppercase tracking-wider">
                  Não Conformidades Críticas Identificadas
                </p>
              </div>

              {/* Score */}
              <div className="pt-2">
                <span className="text-xs uppercase font-bold text-gray-500 tracking-wider block mb-1">
                  Score de Conformidade IA
                </span>
                <span className="text-6xl leading-none font-black text-gray-900 tracking-tight block">
                  {score}
                </span>
              </div>
            </div>

            {/* Itens Críticos Reprovados */}
            <div className="text-left bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <span className="text-xs uppercase font-bold text-red-700 tracking-wider block">
                Itens Críticos Reprovados
              </span>
              <ul className="space-y-1.5 text-xs text-red-800">
                {itensCriticos.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-red-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recomendações: bg-amber-50 border-amber-200 rounded-xl p-3 */}
            <div className="text-left bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="uppercase tracking-wider">
                  Recomendações Técnicas
                </span>
              </div>
              <ul className="space-y-1 text-xs text-amber-900">
                {recomendacoes.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botão Nova Vistoria */}
            <div className="pt-2">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => router.push('/trechos')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl px-6 py-3 min-h-[48px] w-full"
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
                <span>Nova Vistoria</span>
              </Button>
            </div>
          </div>
        )}

        {/* Informações Complementares do Trecho */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mx-4 space-y-2 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>Trecho Operacional:</span>
            <span className="text-gray-900 font-semibold">
              {vistoria?.trecho?.nome || '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Responsável Técnico:</span>
            <span className="text-gray-900 font-medium">
              {vistoria?.responsavel_nome || '—'}
            </span>
          </div>
          {vistoria?.geolat && vistoria?.geolng && (
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> Coordenadas:
              </span>
              <span className="text-gray-700 font-mono text-[11px]">
                {vistoria.geolat}, {vistoria.geolng}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-4 text-xs text-gray-400 border-t border-gray-200 bg-white pb-safe">
        Consórcio Pacote 15 e 19 • MetricLab
      </footer>
    </main>
  );
}
