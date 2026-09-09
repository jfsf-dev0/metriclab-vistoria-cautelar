'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Camera,
  MessageSquare,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export default function VistoriaResumoPage() {
  const params = useParams();
  const router = useRouter();
  const vistoriaId = params?.id as string;

  const [vistoria, setVistoria] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!vistoriaId) return;

    async function loadData() {
      try {
        const { data: vData } = await supabase
          .from('demo_lote15_vistorias')
          .select('*, trecho:demo_lote15_trechos(*)')
          .eq('id', vistoriaId)
          .single();

        if (vData) {
          setVistoria(vData);
          if (vData.observacoes) setObservacoesGerais(vData.observacoes);
        }

        const { data: iData } = await supabase
          .from('demo_lote15_checklist_itens')
          .select('*')
          .eq('vistoria_id', vistoriaId)
          .order('created_at', { ascending: true });

        if (iData) setItens(iData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [vistoriaId]);

  const fotos = itens.filter((i) => !!i.foto_url);
  const totalConformes = itens.filter((i) => i.aprovado === true).length;
  const totalNaoConformes = itens.filter((i) => i.aprovado === false).length;

  const handleEnviarAnaliseIA = async () => {
    setEnviando(true);

    try {
      // 1. Atualiza demo_lote15_vistorias
      const { error: errVistoria } = await supabase
        .from('demo_lote15_vistorias')
        .update({
          status: 'concluida',
          observacoes: observacoesGerais.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', vistoriaId);

      if (errVistoria) throw errVistoria;

      // 2. Insere em demo_lote15_notificacoes
      await supabase.from('demo_lote15_notificacoes').insert({
        tipo: 'vistoria_concluida',
        destinatario: vistoria?.responsavel_telefone || '5511999990001',
        canal: 'whatsapp',
        status: 'pendente',
        payload: {
          vistoria_id: vistoriaId,
          trecho_id: vistoria?.trecho_id,
          responsavel: vistoria?.responsavel_nome,
        },
      });

      // 3. Dispara webhook N8N
      const n8nWebhookUrl =
        process.env.N8N_WEBHOOK_URL ||
        'https://n8n.metriclab.com.br/webhook/vistoria-concluida';

      try {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vistoria_id: vistoriaId,
            trecho_id: vistoria?.trecho_id,
            responsavel_nome: vistoria?.responsavel_nome,
            responsavel_telefone: vistoria?.responsavel_telefone,
            superior_telefone: vistoria?.trecho?.superior_telefone || '5511999990010',
          }),
        });
      } catch (e) {
        console.warn('Webhook N8N em background:', e);
      }

      // 4. Redireciona para /vistoria/[id]/status
      router.push(`/vistoria/${vistoriaId}/status`);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao submeter vistoria: ' + err.message);
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <span className="text-sm text-slate-400">Preparando resumo da inspeção...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <button
            onClick={() => router.push(`/vistoria/${vistoriaId}`)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            Editar Checklist
          </button>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Revisão Final
          </span>
        </div>

        {/* Trecho Title */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
            Vistoria Concluída em Campo
          </span>
          <h1 className="text-lg font-bold text-white">
            {vistoria?.trecho?.nome || 'Trecho Lote 15'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspetor: {vistoria?.responsavel_nome} • Km {vistoria?.trecho?.km_inicio} a{' '}
            {vistoria?.trecho?.km_fim}
          </p>

          {/* Metrics Pill */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-sm font-bold text-white block leading-none">
                  {totalConformes}
                </span>
                <span className="text-[10px] uppercase font-semibold text-emerald-400">
                  Conformes
                </span>
              </div>
            </div>

            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <div>
                <span className="text-sm font-bold text-white block leading-none">
                  {totalNaoConformes}
                </span>
                <span className="text-[10px] uppercase font-semibold text-red-400">
                  Não Conformes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery Grid */}
        {fotos.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              Evidências Fotográficas ({fotos.length})
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {fotos.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedPhoto(f.foto_url)}
                  className="aspect-square rounded-xl overflow-hidden border border-slate-700 relative group cursor-pointer focus:outline-none"
                >
                  <img
                    src={f.foto_url}
                    alt={f.item}
                    className="w-full h-full object-cover transition group-hover:scale-105"
                  />
                  <span className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-[9px] text-white truncate text-center">
                    {f.item}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items Summary list */}
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resumo dos Itens Avaliados
          </h2>

          <div className="space-y-2">
            {itens.map((it) => (
              <div
                key={it.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">{it.item}</span>
                  {it.resposta && it.resposta !== 'conforme' && it.resposta !== 'nao_conforme' && (
                    <span className="text-[11px] text-slate-400 italic block mt-0.5">
                      Obs: {it.resposta}
                    </span>
                  )}
                </div>

                <span
                  className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    it.aprovado
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {it.aprovado ? 'Conforme' : 'Não Conforme'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Observações Gerais */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Observações Gerais do Inspetor
          </label>
          <textarea
            rows={3}
            value={observacoesGerais}
            onChange={(e) => setObservacoesGerais(e.target.value)}
            placeholder="Adicione considerações finais para a análise técnica da IA..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Modal Lightbox for photo */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <img
            src={selectedPhoto}
            alt="Evidência ampliada"
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto">
          <button
            onClick={handleEnviarAnaliseIA}
            disabled={enviando}
            className="w-full min-h-[52px] bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:bg-blue-800 disabled:opacity-60 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-2xl shadow-blue-600/30 transition cursor-pointer"
          >
            {enviando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submetendo para Análise da IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-200" />
                Enviar para Análise IA
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
