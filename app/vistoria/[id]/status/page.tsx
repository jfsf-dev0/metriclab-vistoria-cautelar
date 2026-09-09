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
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col justify-between">
        <HeaderMobile title="Laudo de Vistoria" showLogo={true} />
        <div className="flex-1 p-6 max-w-sm w-full mx-auto space-y-4 my-auto">
          <LoadingSkeleton variant="card" className="h-64" />
          <LoadingSkeleton variant="text" className="h-6 w-full" />
          <LoadingSkeleton variant="button" />
        </div>
        <footer className="w-full text-center py-4 text-xs text-slate-500 pb-safe">
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
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col justify-between">
      {/* Header Mobile Padrão */}
      <HeaderMobile
        title="Laudo de Vistoria"
        showLogo={true}
        rightAction={
          <Badge variant="slate">
            Nº {vistoria?.numero_residencia || '—'}
          </Badge>
        }
      />

      {/* Conteúdo Central */}
      <div className="flex-1 my-auto py-6 px-4 max-w-md w-full mx-auto space-y-5 animate-in fade-in duration-200">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ESTADO 1: PENDENTE IA (ia_aprovado = null)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isPendenteIA && (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-7 text-center space-y-5 shadow-2xl backdrop-blur-sm animate-pulse">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
              <Clock className="w-8 h-8 text-blue-400" />
            </div>

            <div className="space-y-2">
              <Badge variant="azul">Processamento em Tempo Real</Badge>
              <h1 className="text-xl font-bold text-white leading-tight">
                Vistoria enviada. Aguardando análise da IA...
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                Nossos modelos de visão computacional estão analisando os dados e fotografias coletados em campo. O laudo atualizará automaticamente.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Supabase Realtime ativo</span>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ESTADO 2: APROVADA (ia_aprovado = true)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isAprovada && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-7 text-center space-y-6 shadow-2xl backdrop-blur-sm animate-in fade-in duration-200">
            {/* Ícone grande verde */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Vistoria Aprovada
              </h1>
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                Laudo Técnico em Conformidade
              </p>
            </div>

            {/* Score em destaque (72px) */}
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5 shadow-inner">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Score de Conformidade IA
              </span>
              <span className="text-[72px] leading-none font-black text-emerald-400 tracking-tight block">
                {score}
              </span>
              <span className="text-xs text-slate-500 block mt-2">
                Índice global de conformidade técnica
              </span>
            </div>

            {/* Resumo da Análise */}
            <div className="text-left bg-slate-900/60 border border-slate-700/60 rounded-xl p-4">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                Parecer Técnico IA
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{resumo}</p>
            </div>

            {/* Checklist de Itens com Badges */}
            {Array.isArray(vistoria?.checklist) && vistoria.checklist.length > 0 && (
              <div className="text-left space-y-2 pt-1">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block px-1">
                  Quesitos Inspecionados
                </span>
                <div className="space-y-1.5">
                  {vistoria.checklist.map((c: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-900/50 border border-slate-700/40 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-300 pr-2 truncate">
                        {c.item}
                      </span>
                      {c.conforme ? (
                        <Badge variant="verde">
                          <Check className="w-3 h-3" /> Sim
                        </Badge>
                      ) : (
                        <Badge variant="vermelho">
                          <X className="w-3 h-3" /> Não
                        </Badge>
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
                className="font-bold shadow-lg shadow-blue-600/30"
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
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-7 text-center space-y-6 shadow-2xl backdrop-blur-sm animate-in fade-in duration-200">
            {/* Ícone grande vermelho */}
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Vistoria Reprovada
              </h1>
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">
                Não Conformidades Críticas Identificadas
              </p>
            </div>

            {/* Itens Críticos Reprovados */}
            <div className="text-left bg-red-950/40 border border-red-800/60 rounded-xl p-4 space-y-2">
              <span className="text-xs uppercase font-bold text-red-400 tracking-wider block">
                Itens Críticos Reprovados
              </span>
              <ul className="space-y-1.5 text-xs text-red-200">
                {itensCriticos.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-red-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recomendações em Amarelo */}
            <div className="text-left bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="uppercase tracking-wider">
                  Recomendações Técnicas
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {recomendacoes.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-amber-400 font-bold">•</span>
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
                className="font-semibold"
              >
                <RotateCcw className="w-4 h-4 text-blue-400" />
                <span>Nova Vistoria</span>
              </Button>
            </div>
          </div>
        )}

        {/* Informações Complementares do Trecho */}
        <Card className="p-4 space-y-2 text-xs text-slate-400">
          <div className="flex justify-between items-center">
            <span>Trecho Operacional:</span>
            <span className="text-white font-semibold">
              {vistoria?.trecho?.nome || '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Responsável Técnico:</span>
            <span className="text-white font-medium">
              {vistoria?.responsavel_nome || '—'}
            </span>
          </div>
          {vistoria?.geolat && vistoria?.geolng && (
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" /> Coordenadas:
              </span>
              <span className="text-slate-300 font-mono text-[11px]">
                {vistoria.geolat}, {vistoria.geolng}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-4 text-xs text-slate-500 border-t border-slate-700/50 pb-safe">
        Consorcio Pacote 15 e 19 • MetricLab
      </footer>
    </main>
  );
}
