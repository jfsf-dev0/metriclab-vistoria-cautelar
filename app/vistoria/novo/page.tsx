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
  ArrowRight,
} from 'lucide-react';
import { HeaderMobile } from '@/components/layout/HeaderMobile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';

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
        ctx.strokeStyle = '#1e3a5f';
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
      setErroGeral('Falha ao enviar foto: ' + (err.message || 'Erro de rede'));
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
      setErroGeral('Geolocalização não suportada no seu dispositivo.');
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
      <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <span className="text-xs text-gray-500">Carregando dados do trecho...</span>
      </main>
    );
  }

  // Progresso percentual para a barra linear
  const progressoPercent = (passo / 4) * 100;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between">
      {/* Hidden file input for camera */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Header Mobile com voltar + título + badge de progresso */}
      <HeaderMobile
        title={trecho?.nome || 'Vistoria Cautelar'}
        showLogo={false}
        leftAction={
          <button
            onClick={() => {
              if (passo > 1) setPasso((prev) => (prev - 1) as any);
              else router.push('/trechos');
            }}
            className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 transition flex items-center gap-1 text-xs cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
        }
        rightAction={
          <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold">
            Passo {passo} de 4
          </span>
        }
      />

      {/* Barra de progresso linear: bg-gray-200 rounded-full h-1.5 fill: bg-blue-600 */}
      <div className="w-full bg-gray-200 h-1.5">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressoPercent}%` }}
        />
      </div>

      {/* Container Central */}
      <div className="flex-1 py-6 max-w-md w-full mx-auto space-y-4 animate-in fade-in duration-200">
        {erroGeral && (
          <div className="px-4">
            <Toast
              message={erroGeral}
              variant="error"
              onClose={() => setErroGeral(null)}
            />
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 1: DADOS DA RESIDÊNCIA
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 1 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mx-4 mb-4 space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Dados da Residência
              </h1>
              <p className="text-xs text-gray-500">
                Informe a identificação do imóvel objeto desta vistoria
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Número da residência *"
                type="number"
                required
                value={numeroResidencia}
                onChange={(e) => setNumeroResidencia(e.target.value)}
                placeholder="Ex: 142"
              />

              <Input
                label="Complemento (opcional)"
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Ex: Casa fundos / Apto 12"
              />

              <div className="w-full space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Observações iniciais (opcional)
                </label>
                <textarea
                  rows={3}
                  value={observacaoInicial}
                  onChange={(e) => setObservacaoInicial(e.target.value)}
                  placeholder="Observações visuais preliminares sobre a fachada, vizinhança ou estado geral..."
                  className="w-full bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl p-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                disabled={!canAdvancePasso1}
                onClick={() => setPasso(2)}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl px-6 py-3 min-h-[48px] w-full transition-all duration-200 shadow-sm"
              >
                <span>Próximo: Checklist</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 2: CHECKLIST (SIM/NÃO)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200 mx-4 mb-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Checklist de Vistoria
              </h1>
              <p className="text-xs text-gray-500">
                Responda todas as 6 perguntas para validar os quesitos técnicos
              </p>
            </div>

            <div className="space-y-3">
              {CHECKLIST_PERGUNTAS.map((pergunta, idx) => {
                const resp = respostas[idx];
                return (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 transition-all"
                  >
                    <span className="text-sm font-medium text-gray-900 flex-1 pr-2 leading-relaxed">
                      {idx + 1}. {pergunta}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* SIM toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          setRespostas((prev) => ({ ...prev, [idx]: true }))
                        }
                        className={`min-h-[44px] px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                          resp === true
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Sim</span>
                      </button>

                      {/* NÃO toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          setRespostas((prev) => ({ ...prev, [idx]: false }))
                        }
                        className={`min-h-[44px] px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                          resp === false
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <X className="w-4 h-4" />
                        <span>Não</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                disabled={!canAdvancePasso2}
                onClick={() => setPasso(3)}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl px-6 py-3 min-h-[48px] w-full transition-all duration-200 shadow-sm"
              >
                <span>
                  Próximo ({Object.keys(respostas).length}/6 respondidas)
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 3: FOTOS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 3 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mx-4 mb-4 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Registro Fotográfico
                </h1>
                <p className="text-xs text-gray-500">
                  Fotografe o imóvel e eventuais manifestações patológicas
                </p>
              </div>

              {fotos.length > 0 && (
                <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold">
                  {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}
                </span>
              )}
            </div>

            {/* Botão câmera: bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFoto}
              className="w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              {uploadingFoto ? (
                <>
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="text-xs font-semibold text-gray-600">
                    Enviando foto para a nuvem...
                  </span>
                </>
              ) : (
                <>
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    Adicionar Foto
                  </span>
                  <span className="text-xs text-gray-400">
                    Toque para abrir a câmera ou galeria (mínimo 1 foto)
                  </span>
                </>
              )}
            </button>

            {/* Grid 2 colunas rounded-xl overflow-hidden com Overlay X: bg-red-500 text-white rounded-full */}
            {fotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                {fotos.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm group"
                  >
                    <img
                      src={url}
                      alt={`Registro fotográfico ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFoto(url)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center transition hover:bg-red-600 cursor-pointer shadow"
                      title="Excluir foto"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                disabled={!canAdvancePasso3}
                onClick={() => setPasso(4)}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl px-6 py-3 min-h-[48px] w-full transition-all duration-200 shadow-sm"
              >
                <span>
                  Próximo ({fotos.length} foto{fotos.length === 1 ? '' : 's'})
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 4: ASSINATURA E LOCALIZAÇÃO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200 mx-4 mb-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Assinatura e Validação
              </h1>
              <p className="text-xs text-gray-500">
                Assine no quadro abaixo e confirme sua geolocalização
              </p>
            </div>

            {/* Card Assinatura: Canvas bg-white border-2 border-gray-300 rounded-xl (traço #1e3a5f) */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Assine com o dedo *
                </span>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs text-gray-500 hover:text-red-600 transition cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="rounded-xl overflow-hidden border-2 border-gray-300 bg-white touch-none">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[180px] cursor-crosshair block"
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1">
                <span>Traço técnico (#1e3a5f) com carimbo</span>
                {hasSignature && (
                  <span className="text-green-700 font-medium inline-flex items-center gap-1">
                    <Check className="w-3 h-3" /> Assinado
                  </span>
                )}
              </div>
            </div>

            {/* GPS card: bg-gray-50 border border-gray-200 rounded-xl p-3 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Coordenadas GPS *
                </span>
                {geoLoc ? (
                  <span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-0.5 text-xs font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Confirmada
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-700 border border-gray-200 rounded-full px-3 py-0.5 text-xs font-semibold">
                    Pendente
                  </span>
                )}
              </div>

              {geoLoc ? (
                <div className="p-3 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 font-mono flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600 shrink-0" />
                  <span>
                    Lat: {geoLoc.lat} | Lng: {geoLoc.lng}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-500 leading-relaxed">
                  A captura das coordenadas geográficas é obrigatória para certificar a presença física no canteiro.
                </p>
              )}

              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handleCaptureGeo}
                loading={capturingGeo}
              >
                {!capturingGeo && (
                  <>
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{geoLoc ? 'Atualizar Localização GPS' : 'Capturar Localização GPS'}</span>
                  </>
                )}
              </Button>
            </div>

            {/* Botão Finalizar Vistoria */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canSubmitPasso4 || submitting}
                loading={submitting}
                onClick={handleSubmitVistoria}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl px-6 py-3 min-h-[48px] w-full transition-all duration-200 shadow-sm"
              >
                {!submitting && (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Finalizar Vistoria</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-4 text-xs text-gray-400 border-t border-gray-200 bg-white pb-safe">
        Consórcio Pacote 15 e 19 • MetricLab
      </footer>
    </main>
  );
}

export default function VistoriaNovoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <VistoriaFormContent />
    </Suspense>
  );
}
