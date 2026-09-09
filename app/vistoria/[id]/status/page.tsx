'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Share2,
  Home,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  RotateCcw,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export default function VistoriaStatusPage() {
  const params = useParams();
  const router = useRouter();
  const vistoriaId = params?.id as string;

  const [vistoria, setVistoria] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sharedToast, setSharedToast] = useState(false);

  const loadVistoria = async () => {
    try {
      const { data } = await supabase
        .from('demo_lote15_vistorias')
        .select('*, trecho:demo_lote15_trechos(*)')
        .eq('id', vistoriaId)
        .single();

      if (data) setVistoria(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!vistoriaId) return;
    loadVistoria();

    // Supabase Realtime Listener on demo_lote15_vistorias
    const channel = supabase
      .channel(`vistoria-${vistoriaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demo_lote15_vistorias', filter: `id=eq.${vistoriaId}` },
        (payload) => {
          const updated = payload.new;
          if (updated) {
            setVistoria((prev: any) => ({ ...prev, ...updated }));
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
          title: `Laudo de Vistoria • MetricLab Lote 15`,
          text: `Resultado da vistoria cautelar no ${vistoria?.trecho?.nome || 'trecho'}`,
          url,
        });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(url);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <span className="text-sm text-slate-400">Consultando avaliação da IA...</span>
      </div>
    );
  }

  const status = vistoria?.status || 'concluida';
  const isAnalisando = status === 'concluida' || status === 'ia_analisando';
  const isAprovada = status === 'aprovada' || vistoria?.ia_aprovado === true;
  const isReprovada = status === 'reprovada' || vistoria?.ia_aprovado === false;

  const iaAnalise = vistoria?.ia_analise || {};
  const score = iaAnalise.score ?? 95;
  const resumo = iaAnalise.resumo || 'Vistoria cautelar concluída conforme os padrões operacionais do Lote 15.';
  const recomendacoes = iaAnalise.recomendacoes || [];
  const itensCriticos = iaAnalise.itens_criticos || [];

  return (
    <div className="flex-1 flex flex-col justify-between p-5 sm:p-6">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <Home className="w-4 h-4" />
            Início
          </Link>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Laudo Técnico IA
          </span>
        </div>

        {/* Realtime Status Display */}
        {isAnalisando && (
          <div className="bg-slate-900/90 border border-blue-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl mb-6 backdrop-blur">
            <div className="w-16 h-16 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400 block mb-1">
                Processamento Autônomo
              </span>
              <h1 className="text-xl font-bold text-white">IA Analisando Evidências</h1>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                Nossos modelos de visão computacional e normativas de engenharia estão avaliando as
                fotos e respostas de campo. O resultado atualizará automaticamente nesta tela.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Supabase Realtime ativo
            </div>
          </div>
        )}

        {isAprovada && (
          <div className="bg-gradient-to-b from-emerald-950/70 to-slate-900 border border-emerald-500/60 rounded-3xl p-6 shadow-2xl mb-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> Vistoria Aprovada
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                  Score IA
                </span>
                <span className="text-xl font-black text-emerald-400">{score}/100</span>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-white leading-snug">
                {vistoria?.trecho?.nome || 'Trecho Aprovado'}
              </h1>
              <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed">{resumo}</p>
            </div>

            {recomendacoes.length > 0 && (
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-emerald-900/50 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Recomendações Técnicas
                </span>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {recomendacoes.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t border-emerald-900/50 flex items-center justify-between text-[11px] text-emerald-400/80">
              <span>Notificações enviadas via WhatsApp</span>
              <span className="font-bold">Trecho Liberado</span>
            </div>
          </div>
        )}

        {isReprovada && (
          <div className="bg-gradient-to-b from-red-950/70 to-slate-900 border border-red-500/60 rounded-3xl p-6 shadow-2xl mb-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider">
                <XCircle className="w-4 h-4" /> Vistoria Reprovada
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                  Score IA
                </span>
                <span className="text-xl font-black text-red-400">{score}/100</span>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-white leading-snug">
                {vistoria?.trecho?.nome || 'Trecho Reprovado'}
              </h1>
              <p className="text-xs text-red-200/90 mt-1 leading-relaxed">{resumo}</p>
            </div>

            {itensCriticos.length > 0 && (
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-red-900/50 space-y-2">
                <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Itens Críticos Reprovados
                </span>
                <ul className="space-y-1 text-xs text-red-300 list-disc list-inside">
                  {itensCriticos.map((crit: string, i: number) => (
                    <li key={i}>{crit}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t border-red-900/50 text-[11px] text-red-300">
              Correções necessárias antes de submeter nova vistoria.
            </div>
          </div>
        )}

        {/* General Info Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Inspetor Responsável:</span>
            <span className="text-white font-medium">{vistoria?.responsavel_nome}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Extensão do Trecho:</span>
            <span className="text-white font-medium">
              Km {vistoria?.trecho?.km_inicio} → Km {vistoria?.trecho?.km_fim}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Protocolo Supabase:</span>
            <span className="font-mono text-slate-300">{vistoriaId?.slice(0, 13)}...</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="space-y-3 pt-6">
        <button
          onClick={handleShare}
          className="w-full min-h-[48px] bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-blue-400" />
          {sharedToast ? 'Link do Laudo Copiado!' : 'Compartilhar Laudo'}
        </button>

        <Link
          href="/"
          className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Realizar Nova Vistoria
        </Link>
      </div>
    </div>
  );
}
