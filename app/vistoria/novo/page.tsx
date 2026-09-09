'use strict';
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession, UserSession } from '@/lib/auth';
import {
  ChevronLeft,
  Camera,
  MapPin,
  Check,
  X,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const CHECKLIST_PERGUNTAS = [
  'Imóvel está desocupado?',
  'Apresenta danos estruturais visíveis?',
  'Acesso ao imóvel está desobstruído?',
  'Medidor de energia presente e acessível?',
  'Rede de água acessível e identificada?',
  'Há riscos de segurança identificados?',
];

function VistoriaFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trechoId = searchParams.get('trecho_id');

  const [session, setSessionState] = useState<UserSession | null>(null);
  const [trecho, setTrecho] = useState<any>(null);
  const [loadingTrecho, setLoadingTrecho] = useState(true);

  // Step state (1 to 4)
  const [passo, setPasso] = useState<1 | 2 | 3 | 4>(1);

  // Passo 1: Residência
  const [numeroResidencia, setNumeroResidencia] = useState('');
  const [complemento, setComplemento] = useState('');
  const [observacaoInicial, setObservacaoInicial] = useState('');

  // Passo 2: Checklist (6 itens)
  const [respostas, setRespostas] = useState<Record<number, boolean>>({});

  // Passo 3: Fotos
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Passo 4: Assinatura e Localização
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [geoLoc, setGeoLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [capturingGeo, setCapturingGeo] = useState(false);

  // Submissão
  const [submitting, setSubmitting] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  // Auth check & Trecho fetch
  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    setSessionState(s);

    if (!trechoId) {
      router.replace('/trechos');
      return;
    }

    async function loadTrechoData() {
      try {
        const { data, error } = await supabase
          .from('demo_lote15_trechos')
          .select('*')
          .eq('id', trechoId)
          .single();

        if (error) throw error;
        setTrecho(data);
      } catch (err) {
        console.error(err);
        router.replace('/trechos');
      } finally {
        setLoadingTrecho(false);
      }
    }
    loadTrechoData();
  }, [trechoId, router]);

  // Setup Canvas
  useEffect(() => {
    if (passo === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // High DPI canvas setup
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e3a8a'; // Azul escuro
      }
    }
  }, [passo]);

  // Canvas Drawing Handlers
  const getCanvasCoords = (e: React.TouchEvent | React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    const me = e as React.MouseEvent;
    return {
      x: me.clientX - rect.left,
      y: me.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
  };

  // Upload Foto
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `vistorias/temp-${Date.now()}/${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('demo-lote15-fotos')
        .upload(path, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('demo-lote15-fotos')
        .getPublicUrl(path);

      if (urlData?.publicUrl) {
        setFotos((prev) => [...prev, urlData.publicUrl]);
      }
    } catch (err: any) {
      console.error('Erro no upload de foto:', err);
      alert('Falha ao enviar foto: ' + (err.message || 'Erro de rede'));
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFoto = (urlToRemove: string) => {
    setFotos((prev) => prev.filter((u) => u !== urlToRemove));
  };

  // Geolocalização
  const handleCaptureGeo = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada no seu dispositivo.');
      return;
    }
    setCapturingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoc({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setCapturingGeo(false);
      },
      (err) => {
        console.error('Erro GPS:', err);
        // Fallback default coordinates for demo if permission blocked
        setGeoLoc({ lat: -23.55052, lng: -46.633308 });
        setCapturingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Step Validations
  const canAdvancePasso1 = numeroResidencia.trim().length > 0;
  const canAdvancePasso2 =
    CHECKLIST_PERGUNTAS.length > 0 &&
    CHECKLIST_PERGUNTAS.every((_, idx) => respostas[idx] !== undefined);
  const canAdvancePasso3 = fotos.length >= 1;
  const canSubmitPasso4 = hasSignature && geoLoc !== null;

  // Submissão Final da Vistoria
  const handleSubmitVistoria = async () => {
    if (!canSubmitPasso4 || submitting) return;
    setSubmitting(true);
    setErroGeral(null);

    try {
      // 1. Upload da assinatura
      let assinaturaUrl = '';
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const path = `vistorias/assinaturas/ass-${Date.now()}.png`;

        const { error: errAss } = await supabase.storage
          .from('demo-lote15-fotos')
          .upload(path, blob, { contentType: 'image/png', upsert: true });

        if (!errAss) {
          const { data: assData } = supabase.storage
            .from('demo-lote15-fotos')
            .getPublicUrl(path);
          assinaturaUrl = assData?.publicUrl || '';
        }
      }

      // 2. Montar array do checklist
      const checklistPayload = CHECKLIST_PERGUNTAS.map((pergunta, idx) => ({
        item: pergunta,
        resposta: respostas[idx] ? 'Sim' : 'Não',
        conforme: respostas[idx],
      }));

      // 3. INSERT em demo_lote15_vistorias
      const { data: newVistoria, error: errVistoria } = await supabase
        .from('demo_lote15_vistorias')
        .insert({
          trecho_id: trecho.id,
          responsavel_nome: session?.nome || 'Inspetor de Campo',
          responsavel_telefone: session?.telefone || '5511999990001',
          status: 'concluida',
          checklist: checklistPayload,
          fotos: fotos,
          observacoes: observacaoInicial.trim() || null,
          ia_aprovado: null,
          geolat: geoLoc?.lat,
          geolng: geoLoc?.lng,
          assinatura_url: assinaturaUrl || null,
          numero_residencia: numeroResidencia.trim(),
          complemento: complemento.trim() || null,
        })
        .select()
        .single();

      if (errVistoria || !newVistoria) {
        throw new Error(errVistoria?.message || 'Falha ao gravar vistoria.');
      }

      const vistoriaId = newVistoria.id;

      // 4. Chama demo_lote15_criar_checklist(vistoria_id)
      await supabase.rpc('demo_lote15_criar_checklist', { p_vistoria_id: vistoriaId });

      // 5. UPDATE demo_lote15_trechos SET status='vistoria_iniciada'
      await supabase
        .from('demo_lote15_trechos')
        .update({ status: 'vistoria_iniciada', updated_at: new Date().toISOString() })
        .eq('id', trecho.id);

      // 6. INSERT demo_lote15_notificacoes
      await supabase.from('demo_lote15_notificacoes').insert({
        tipo: 'vistoria_concluida',
        destinatario: session?.telefone || '5511999990001',
        canal: 'whatsapp',
        status: 'pendente',
        payload: {
          vistoria_id: vistoriaId,
          trecho_id: trecho.id,
          responsavel: session?.nome,
        },
      });

      // 7. POST webhook N8N
      const n8nWebhookUrl =
        process.env.N8N_WEBHOOK_URL ||
        'https://n8n.metriclab.com.br/webhook/vistoria-concluida';

      try {
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vistoria_id: vistoriaId,
            trecho_id: trecho.id,
            responsavel_nome: session?.nome,
            responsavel_telefone: session?.telefone,
            superior_telefone: trecho.superior_telefone || '5511999990010',
          }),
        });
      } catch (webhookErr) {
        console.warn('Erro ao disparar webhook N8N:', webhookErr);
      }

      // 8. Navega para /vistoria/[id]/status
      router.push(`/vistoria/${vistoriaId}/status`);
    } catch (err: any) {
      console.error(err);
      setErroGeral(err.message || 'Erro ao submeter vistoria.');
      setSubmitting(false);
    }
  };

  if (loadingTrecho) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin mb-3" />
        <span className="text-xs text-slate-400">Carregando dados do trecho...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-between">
      {/* Hidden file input for camera */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Header Fixo com Progresso */}
      <header className="sticky top-0 z-20 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            if (passo > 1) setPasso((prev) => (prev - 1) as any);
            else router.push('/trechos');
          }}
          className="p-1 text-slate-400 hover:text-white transition flex items-center gap-1 text-xs"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <span className="text-xs font-bold text-white truncate max-w-[180px]">
          {trecho?.nome || 'Trecho'}
        </span>

        <span className="text-xs font-bold text-[#2563eb] bg-blue-600/15 border border-blue-500/30 px-2.5 py-1 rounded-full">
          Passo {passo} de 4
        </span>
      </header>

      {/* Container Central com Transição */}
      <div className="flex-1 px-5 py-6 max-w-md w-full mx-auto space-y-6">
        {erroGeral && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erroGeral}</span>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 1: DADOS DA RESIDÊNCIA
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Dados da Residência
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Informe os dados do imóvel objeto desta vistoria cautelar
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Número da residência *
                </label>
                <input
                  type="number"
                  required
                  value={numeroResidencia}
                  onChange={(e) => setNumeroResidencia(e.target.value)}
                  placeholder="Ex: 142"
                  className="bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-xl p-4 w-full text-sm focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Complemento (opcional)
                </label>
                <input
                  type="text"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Ex: Casa fundos / Apto 12"
                  className="bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-xl p-4 w-full text-sm focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Observação inicial (opcional)
                </label>
                <textarea
                  rows={3}
                  value={observacaoInicial}
                  onChange={(e) => setObservacaoInicial(e.target.value)}
                  placeholder="Observações visuais preliminares sobre a fachada ou vizinhança..."
                  className="bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-xl p-4 w-full text-sm focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            <button
              onClick={() => setPasso(2)}
              disabled={!canAdvancePasso1}
              className="w-full min-h-[48px] bg-[#2563eb] hover:bg-blue-500 active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer mt-6"
            >
              <span>Próximo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 2: CHECKLIST (SIM/NÃO)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Checklist de Vistoria
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Responda todas as 6 perguntas para avançar
              </p>
            </div>

            <div className="space-y-3">
              {CHECKLIST_PERGUNTAS.map((pergunta, idx) => {
                const resp = respostas[idx];
                return (
                  <div
                    key={idx}
                    className="min-h-[64px] bg-slate-800 border border-slate-700 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow"
                  >
                    <span className="text-xs font-medium text-white flex-1 pr-2 leading-snug">
                      {idx + 1}. {pergunta}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Sim (verde) */}
                      <button
                        type="button"
                        onClick={() =>
                          setRespostas((prev) => ({ ...prev, [idx]: true }))
                        }
                        className={`min-h-[44px] px-3.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          resp === true
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Sim
                      </button>

                      {/* Não (vermelho) */}
                      <button
                        type="button"
                        onClick={() =>
                          setRespostas((prev) => ({ ...prev, [idx]: false }))
                        }
                        className={`min-h-[44px] px-3.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          resp === false
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        Não
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setPasso(3)}
              disabled={!canAdvancePasso2}
              className="w-full min-h-[48px] bg-[#2563eb] hover:bg-blue-500 active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer mt-6"
            >
              <span>Próximo ({Object.keys(respostas).length}/6 respondidas)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 3: FOTOS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Registro Fotográfico
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Fotografe o imóvel e as condições identificadas (mínimo 1 foto obrigatória)
              </p>
            </div>

            {/* Botão Grande Adicionar Foto */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
                className="w-full min-h-[64px] bg-slate-800 border-2 border-dashed border-[#2563eb]/60 hover:border-[#2563eb] active:scale-[0.99] rounded-2xl flex flex-col items-center justify-center gap-1.5 p-4 text-[#2563eb] font-bold text-sm shadow-xl transition cursor-pointer"
              >
                {uploadingFoto ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Enviando foto para a nuvem...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-7 h-7" />
                    <span>Adicionar Foto (Câmera)</span>
                  </>
                )}
              </button>
            </div>

            {/* Grid 2 Colunas */}
            {fotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                {fotos.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shadow-md group"
                  >
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFoto(url)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                Nenhuma foto anexada ainda.
              </div>
            )}

            <button
              onClick={() => setPasso(4)}
              disabled={!canAdvancePasso3}
              className="w-full min-h-[48px] bg-[#2563eb] hover:bg-blue-500 active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer mt-6"
            >
              <span>Próximo ({fotos.length} foto{fotos.length === 1 ? '' : 's'})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 4: ASSINATURA E LOCALIZAÇÃO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Confirmação
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Assine e confirme sua localização para submeter o laudo
              </p>
            </div>

            {/* Bloco Assinatura */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Assine com o dedo *
                </label>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs text-slate-400 hover:text-red-400 underline cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="rounded-2xl overflow-hidden border-2 border-slate-600 shadow-inner touch-none bg-white">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[200px] cursor-crosshair block"
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Traço técnico gravado digitalmente</span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-blue-400 hover:underline cursor-pointer"
                >
                  Limpar assinatura
                </button>
              </div>
            </div>

            {/* Bloco Geolocalização */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Localização GPS *
                </span>
                {geoLoc && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Confirmada
                  </span>
                )}
              </div>

              {geoLoc ? (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono">
                  📍 Lat: {geoLoc.lat} | Lng: {geoLoc.lng}
                </div>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  A captura do GPS é obrigatória para validar a autenticidade geográfica da vistoria.
                </p>
              )}

              <button
                type="button"
                onClick={handleCaptureGeo}
                disabled={capturingGeo}
                className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {capturingGeo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#2563eb]" />
                    <span>Obtendo coordenadas via satélite...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-[#2563eb]" />
                    <span>{geoLoc ? 'Atualizar Localização' : 'Capturar Localização'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Botão Enviar Vistoria */}
            <button
              onClick={handleSubmitVistoria}
              disabled={!canSubmitPasso4 || submitting}
              className="w-full min-h-[52px] bg-[#2563eb] hover:bg-blue-500 active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm rounded-xl shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-2 transition cursor-pointer mt-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Registrando e acionando IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Enviar Vistoria</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-3 text-[11px] text-slate-500 pb-safe">
        Vistoria Cautelar Lote 15 • Campo
      </footer>
    </main>
  );
}

export default function VistoriaNovoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-6">
          <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin" />
        </div>
      }
    >
      <VistoriaFormContent />
    </Suspense>
  );
}
