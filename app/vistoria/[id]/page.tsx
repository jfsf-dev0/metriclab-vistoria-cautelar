'use strict';
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Camera,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  vistoria_id: string;
  item: string;
  categoria: string;
  obrigatorio: boolean;
  resposta: string | null; // 'conforme' | 'nao_conforme' | null
  foto_obrigatoria: boolean;
  foto_url: string | null;
  aprovado: boolean | null;
}

export default function VistoriaChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const vistoriaId = params?.id as string;

  const [itens, setItens] = useState<ChecklistItem[]>([]);
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadItemId, setActiveUploadItemId] = useState<string | null>(null);

  // Load items
  useEffect(() => {
    if (!vistoriaId) return;

    async function loadChecklist() {
      try {
        let { data, error } = await supabase
          .from('demo_lote15_checklist_itens')
          .select('*')
          .eq('vistoria_id', vistoriaId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // If no items exist, call RPC
        if (!data || data.length === 0) {
          await supabase.rpc('demo_lote15_criar_checklist', { p_vistoria_id: vistoriaId });
          const res = await supabase
            .from('demo_lote15_checklist_itens')
            .select('*')
            .eq('vistoria_id', vistoriaId)
            .order('created_at', { ascending: true });
          data = res.data;
        }

        if (data) {
          setItens(data);
          const obsMap: Record<string, string> = {};
          data.forEach((it: any) => {
            if (it.resposta && it.resposta !== 'conforme' && it.resposta !== 'nao_conforme') {
              obsMap[it.id] = it.resposta;
            }
          });
          setObservacoes(obsMap);
        }
      } catch (err: any) {
        console.error(err);
        setErro('Erro ao carregar itens do checklist.');
      } finally {
        setLoading(false);
      }
    }

    loadChecklist();
  }, [vistoriaId]);

  // Toggle Conforme / Não Conforme
  const handleToggleResposta = async (itemId: string, aprovado: boolean) => {
    const nextAprovado = aprovado;
    const nextResposta = aprovado ? 'conforme' : 'nao_conforme';

    setItens((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, aprovado: nextAprovado, resposta: nextResposta } : it
      )
    );

    await supabase
      .from('demo_lote15_checklist_itens')
      .update({
        aprovado: nextAprovado,
        resposta: nextResposta,
      })
      .eq('id', itemId);
  };

  // Change observation
  const handleObsChange = async (itemId: string, text: string) => {
    setObservacoes((prev) => ({ ...prev, [itemId]: text }));
  };

  const handleObsBlur = async (itemId: string) => {
    const text = observacoes[itemId] || '';
    await supabase
      .from('demo_lote15_checklist_itens')
      .update({ resposta: text || 'conforme' })
      .eq('id', itemId);
  };

  // Trigger Camera / File Upload
  const handleCameraClick = (itemId: string) => {
    setActiveUploadItemId(itemId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle Photo File Selection & Upload to demo-lote15-fotos bucket
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadItemId) return;

    setUploadingItemId(activeUploadItemId);
    const itemId = activeUploadItemId;

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `vistoria-${vistoriaId}/${itemId}-${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('demo-lote15-fotos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('demo-lote15-fotos')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Update in DB
      await supabase
        .from('demo_lote15_checklist_itens')
        .update({ foto_url: publicUrl })
        .eq('id', itemId);

      setItens((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, foto_url: publicUrl } : it))
      );
    } catch (err: any) {
      console.error('Erro no upload da foto:', err);
      alert('Falha ao enviar foto: ' + (err.message || 'Erro de rede'));
    } finally {
      setUploadingItemId(null);
      setActiveUploadItemId(null);
    }
  };

  // Progress calculation
  const totalObrigatorios = itens.filter((i) => i.obrigatorio).length;
  const respondidosObrigatorios = itens.filter(
    (i) => i.obrigatorio && i.aprovado !== null && (!i.foto_obrigatoria || !!i.foto_url)
  ).length;

  const totalGeral = itens.length;
  const totalRespondidos = itens.filter((i) => i.aprovado !== null).length;
  const progressPercent = totalGeral > 0 ? Math.round((totalRespondidos / totalGeral) * 100) : 0;

  const canFinish =
    totalObrigatorios > 0 && respondidosObrigatorios >= totalObrigatorios;

  // Group items by category
  const categories = Array.from(new Set(itens.map((i) => i.categoria || 'Geral')));

  const handleFinalizar = () => {
    if (!canFinish) return;
    router.push(`/vistoria/${vistoriaId}/resumo`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <span className="text-sm text-slate-400">Carregando checklist operacional...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 pb-24">
      {/* Hidden file input for camera/storage */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Top Sticky Header with Progress Bar */}
      <div className="sticky top-0 z-20 bg-[#0f172a]/95 backdrop-blur-md pb-4 pt-1 border-b border-slate-800 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <span className="text-xs font-bold text-blue-400">
            {totalRespondidos} de {totalGeral} itens respondidos
          </span>
          <span className="text-xs font-semibold text-slate-300">{progressPercent}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Cards by Category */}
      <div className="mt-6 space-y-6 flex-1">
        {categories.map((cat) => {
          const categoryItens = itens.filter((i) => (i.categoria || 'Geral') === cat);

          return (
            <div key={cat} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {cat}
              </h2>

              <div className="space-y-3">
                {categoryItens.map((item) => {
                  const isAprovado = item.aprovado === true;
                  const isReprovado = item.aprovado === false;
                  const isUploading = uploadingItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-white leading-snug">
                            {item.item}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {item.obrigatorio && (
                              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                                Obrigatório
                              </span>
                            )}
                            {item.foto_obrigatoria && (
                              <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Camera className="w-2.5 h-2.5" /> Foto Obrigatória
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Toggles Aprovado / Reprovado (min 48px target) */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleResposta(item.id, true)}
                          className={`min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                            isAprovado
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          Conforme
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleResposta(item.id, false)}
                          className={`min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                            isReprovado
                              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <X className="w-4 h-4" />
                          Não Conforme
                        </button>
                      </div>

                      {/* Photo Section */}
                      <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                        {item.foto_url ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={item.foto_url}
                              alt="Foto vistoria"
                              className="w-12 h-12 object-cover rounded-lg border border-slate-700 shadow"
                            />
                            <button
                              type="button"
                              onClick={() => handleCameraClick(item.id)}
                              className="text-xs text-blue-400 underline font-medium"
                            >
                              Trocar foto
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {item.foto_obrigatoria
                              ? 'Foto necessária para aprovação'
                              : 'Foto opcional'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCameraClick(item.id)}
                          disabled={isUploading}
                          className="min-h-[44px] px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          ) : (
                            <Camera className="w-4 h-4 text-blue-400" />
                          )}
                          {item.foto_url ? 'Foto OK' : 'Capturar Foto'}
                        </button>
                      </div>

                      {/* Observação */}
                      <div>
                        <input
                          type="text"
                          value={observacoes[item.id] || ''}
                          onChange={(e) => handleObsChange(item.id, e.target.value)}
                          onBlur={() => handleObsBlur(item.id)}
                          placeholder="Observação técnica (opcional)..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto">
          <button
            onClick={handleFinalizar}
            disabled={!canFinish}
            className={`w-full min-h-[52px] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-2xl transition cursor-pointer ${
              canFinish
                ? 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white shadow-blue-600/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-80'
            }`}
          >
            {canFinish ? (
              <>
                Finalizar Vistoria
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Responda todos os itens obrigatórios ({respondidosObrigatorios}/{totalObrigatorios})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
