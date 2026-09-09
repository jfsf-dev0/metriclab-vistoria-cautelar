'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Share2,
  RotateCcw,
  Loader2,
  MapPin,
  FileCheck,
  Sparkles,
} from 'lucide-react';

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
        { event: '*', schema: 'public', table: 'demo_lote15_vistorias', filter: `id=eq.${vistoriaId}` },
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
          title: 'Laudo de Vistoria Cautelar • MetricLab Lote 15',
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
      <main className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin mb-3" />
        <span className="text-xs text-slate-400">Carregando status do laudo...</span>
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
    'Vistoria técnica aprovada com integridade estrutural atestada e registro fotográfico validado.';
  const itensCriticos: string[] = iaAnalise.itens_criticos || [
    'Risco de fissura estrutural na fachada',
    'Acesso obstruído por entulho',
  ];
  const recomendacoes: string[] = iaAnalise.recomendacoes || [
    'Executar reparos antes da liberação do pavimento',
    'Realizar nova inspeção após desobstrução',
  ];

  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-between p-6">
      {/* Header Simples */}
      <header className="w-full flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#2563eb] flex items-center justify-center font-black text-xs text-white">
            ML
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            MetricLab
          </span>
        </div>
        <span className="text-xs text-slate-400">
          Imóvel Nº {vistoria?.numero_residencia || '—'}
        </span>
      </header>

      {/* Conteúdo Central */}
      <div className="flex-1 my-auto py-8 max-w-sm w-full mx-auto space-y-6">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ESTADO 1 & 2: ENVIADA / ANALISANDO (ia_aprovado = null)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isPendenteIA && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-5 shadow-2xl animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-[#2563eb] flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-[#2563eb] animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#2563eb] block">
                Processamento em Tempo Real
              </span>
              <h1 className="text-xl font-bold text-white leading-tight">
                Vistoria enviada. Aguardando análise da IA...
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Nossa IA está analisando os dados e fotografias coletados em campo. Esta tela
                atualizará automaticamente assim que o laudo for emitido.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Supabase Realtime conectado</span>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ESTADO 3: APROVADA (ia_aprovado = true)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isAprovada && (
          <div className="bg-slate-800 border border-emerald-500/50 rounded-2xl p-7 text-center space-y-6 shadow-2xl animate-fadeIn">
            {/* Ícone grande verde */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white">Vistoria Aprovada</h1>
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                Laudo Técnico em Conformidade
              </p>
            </div>

            {/* Score em número grande */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Score de Conformidade IA
              </span>
              <span className="text-5xl font-black text-emerald-400 tracking-tight block">
                {score}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">Pontuação máxima: 100</span>
            </div>

            {/* Resumo da Análise */}
            <div className="text-left bg-slate-900/60 border border-slate-700/80 rounded-xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                Resumo da Análise Técnica
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{resumo}</p>
            </div>

            {/* Botão Compartilhar Resultado */}
            <button
              onClick={handleShare}
              className="w-full min-h-[48px] bg-[#2563eb] hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{copied ? 'Link Copiado!' : 'Compartilhar Resultado'}</span>
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ESTADO 4: REPROVADA (ia_aprovado = false)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isReprovada && (
          <div className="bg-slate-800 border border-red-500/50 rounded-2xl p-7 text-center space-y-6 shadow-2xl animate-fadeIn">
            {/* Ícone grande vermelho */}
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white">Vistoria Reprovada</h1>
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">
                Não Conformidades Críticas Identificadas
              </p>
            </div>

            {/* Lista de Itens Críticos em Vermelho */}
            <div className="text-left bg-red-950/40 border border-red-800/60 rounded-xl p-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block">
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
            <div className="text-left bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                Recomendações
              </span>
              <ul className="space-y-1.5 text-xs text-amber-200">
                {recomendacoes.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botão Nova Vistoria */}
            <button
              onClick={() => router.push('/trechos')}
              className="w-full min-h-[48px] bg-slate-900 hover:bg-slate-700 active:scale-[0.98] text-white font-bold text-sm border border-slate-700 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#2563eb]" />
              <span>Nova Vistoria</span>
            </button>
          </div>
        )}

        {/* Informações Complementares do Trecho */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-xs space-y-1.5 text-slate-400">
          <div className="flex justify-between">
            <span>Trecho:</span>
            <span className="text-white font-medium">{vistoria?.trecho?.nome || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span>Responsável:</span>
            <span className="text-white font-medium">{vistoria?.responsavel_nome || '—'}</span>
          </div>
          {vistoria?.geolat && vistoria?.geolng && (
            <div className="flex justify-between">
              <span>Coordenadas:</span>
              <span className="text-slate-300 font-mono">
                {vistoria.geolat}, {vistoria.geolng}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-2 text-[11px] text-slate-500 pb-safe">
        MetricLab Vistoria Cautelar • Lote 15
      </footer>
    </main>
  );
}
