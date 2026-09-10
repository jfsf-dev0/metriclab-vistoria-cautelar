'use strict';
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession, UserSession } from '@/lib/auth';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  }, [router, trechoId]);

  // Canvas Setup
  useEffect(() => {
    if (passo === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [passo]);

  const getCanvasCoords = (e: React.TouchEvent | React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `vistorias/temp-${Date.now()}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
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
        setGeoLoc({ lat: -23.55052, lng: -46.633308 });
        setCapturingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const canAdvancePasso1 = numeroResidencia.trim().length > 0;
  const canAdvancePasso2 =
    CHECKLIST_PERGUNTAS.length > 0 &&
    CHECKLIST_PERGUNTAS.every((_, idx) => respostas[idx] !== undefined);
  const canAdvancePasso3 = fotos.length >= 1;
  const canSubmitPasso4 = hasSignature && geoLoc !== null;

  const handleSubmitVistoria = async () => {
    if (!canSubmitPasso4 || submitting) return;
    setSubmitting(true);
    setErroGeral(null);

    try {
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

      const checklistPayload = CHECKLIST_PERGUNTAS.map((pergunta, idx) => ({
        item: pergunta,
        resposta: respostas[idx] ? 'Sim' : 'Não',
        conforme: respostas[idx],
      }));

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

      await supabase.rpc('demo_lote15_criar_checklist', { p_vistoria_id: vistoriaId });

      await supabase
        .from('demo_lote15_trechos')
        .update({ status: 'vistoria_iniciada', updated_at: new Date().toISOString() })
        .eq('id', trecho.id);

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

      router.push(`/vistoria/${vistoriaId}/status`);
    } catch (err: any) {
      console.error(err);
      setErroGeral(err.message || 'Erro ao submeter vistoria.');
      setSubmitting(false);
    }
  };

  const handleVoltar = () => {
    if (passo === 1) {
      router.push('/trechos');
    } else {
      setPasso((prev) => (prev - 1) as any);
    }
  };

  const progressPercentage = (passo / 4) * 100;

  if (loadingTrecho) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-[#9B9B9B] text-[13px]">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      {/* Header */}
      <header className="sticky top-0 z-30 h-[52px] w-full bg-[#F7F7F5] border-b border-[#E5E5E3] px-5 flex items-center justify-between select-none">
        <button
          onClick={handleVoltar}
          className="text-[14px] font-normal text-[#111111] hover:text-black cursor-pointer bg-transparent border-none p-0"
        >
          ← Voltar
        </button>

        <div className="text-[14px] font-medium text-[#111111] truncate px-2 max-w-[200px]">
          {trecho?.nome || 'Vistoria'}
        </div>

        <div className="text-[13px] font-normal text-[#9B9B9B]">
          {passo} de 4
        </div>
      </header>

      {/* Barra de progresso: 2px hairline-soft -> fill ink */}
      <div className="w-full bg-[#EFEFED] h-[2px]">
        <div
          className="bg-[#111111] h-[2px] transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex-1 max-w-md w-full mx-auto px-5 py-6">
        {erroGeral && (
          <div className="mb-4 text-[13px] text-[#111111] bg-[#EFEFED] p-3 border border-[#E5E5E3]">
            {erroGeral}
          </div>
        )}

        {/* PASSO 1: DADOS DA RESIDÊNCIA */}
        {passo === 1 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
              DADOS DA RESIDÊNCIA
            </span>
            <div className="h-6" />

            <div className="space-y-6">
              <Input
                label="NÚMERO"
                type="text"
                required
                value={numeroResidencia}
                onChange={(e) => setNumeroResidencia(e.target.value)}
                placeholder="Ex: 142"
              />

              <Input
                label="COMPLEMENTO"
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Ex: Casa dos fundos, Bloco B"
              />

              <div className="w-full text-left">
                <label className="block text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px] mb-2">
                  OBSERVAÇÕES
                </label>
                <textarea
                  rows={3}
                  value={observacaoInicial}
                  onChange={(e) => setObservacaoInicial(e.target.value)}
                  placeholder="Observações prévias do imóvel..."
                  className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b border-[#E5E5E3] rounded-none py-2 text-[15px] text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-b-[#111111] resize-none"
                />
              </div>
            </div>

            <div className="h-10" />

            <Button
              onClick={() => setPasso(2)}
              disabled={!canAdvancePasso1}
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
            >
              Próximo
            </Button>
          </div>
        )}

        {/* PASSO 2: CHECKLIST */}
        {passo === 2 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
              CHECKLIST
            </span>
            <div className="h-4" />

            <div className="divide-y divide-[#E5E5E3]">
              {CHECKLIST_PERGUNTAS.map((pergunta, idx) => {
                const answer = respostas[idx];
                return (
                  <div
                    key={idx}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <span className="text-[15px] text-[#111111] leading-snug flex-1">
                      {pergunta}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setRespostas((prev) => ({ ...prev, [idx]: true }))
                        }
                        className={`h-[32px] w-[48px] rounded-[4px] border text-[13px] font-medium transition-colors cursor-pointer ${
                          answer === true
                            ? 'bg-[#111111] border-[#111111] text-white'
                            : 'bg-transparent border-[#E5E5E3] text-[#111111]'
                        }`}
                      >
                        Sim
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setRespostas((prev) => ({ ...prev, [idx]: false }))
                        }
                        className={`h-[32px] w-[48px] rounded-[4px] border text-[13px] font-medium transition-colors cursor-pointer ${
                          answer === false
                            ? 'bg-[#111111] border-[#111111] text-white'
                            : 'bg-transparent border-[#E5E5E3] text-[#111111]'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-8" />

            <Button
              onClick={() => setPasso(3)}
              disabled={!canAdvancePasso2}
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
            >
              Próximo
            </Button>
          </div>
        )}

        {/* PASSO 3: FOTOS */}
        {passo === 3 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
              FOTOS
            </span>
            <div className="h-4" />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Área câmera */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#E5E5E3] rounded-[8px] p-8 bg-[#F7F7F5] flex flex-col items-center justify-center cursor-pointer hover:bg-[#EFEFED] transition-colors"
            >
              {uploadingFoto ? (
                <Loader2 className="w-5 h-5 text-[#9B9B9B] animate-spin mb-2" />
              ) : (
                <Camera className="w-5 h-5 text-[#9B9B9B] mb-2" />
              )}
              <span className="text-[13px] text-[#9B9B9B]">
                {uploadingFoto ? 'Enviando foto...' : 'Adicionar foto'}
              </span>
            </div>

            {/* Grid 2 colunas fotos */}
            {fotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {fotos.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-[4px] overflow-hidden border border-[#E5E5E3] bg-[#EFEFED]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFoto(url);
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-[#9B9B9B] hover:text-white flex items-center justify-center text-[12px]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="h-8" />

            <Button
              onClick={() => setPasso(4)}
              disabled={!canAdvancePasso3}
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
            >
              Próximo
            </Button>
          </div>
        )}

        {/* PASSO 4: ASSINATURA */}
        {passo === 4 && (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
                ASSINATURA
              </span>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[13px] text-[#9B9B9B] hover:text-[#111111] bg-transparent border-none p-0 cursor-pointer"
              >
                Limpar
              </button>
            </div>
            <div className="h-3" />

            {/* Canvas: border 1px solid hairline, border-radius 0, bg white, sem sombra */}
            <div className="w-full h-44 bg-white border border-[#E5E5E3] touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full block cursor-crosshair"
              />
            </div>

            <div className="h-6" />

            {/* GPS */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
                LOCALIZAÇÃO
              </span>
              <div className="flex items-center justify-between py-2 border-b border-[#E5E5E3]">
                <span className="text-[13px] text-[#6B6B6B]">
                  {geoLoc
                    ? `${geoLoc.lat.toFixed(5)}, ${geoLoc.lng.toFixed(5)}`
                    : 'GPS pendente'}
                </span>
                <button
                  type="button"
                  onClick={handleCaptureGeo}
                  disabled={capturingGeo}
                  className="text-[13px] text-[#111111] underline cursor-pointer bg-transparent border-none p-0"
                >
                  {capturingGeo
                    ? 'Capturando...'
                    : geoLoc
                    ? 'Confirmada (atualizar)'
                    : 'Capturar'}
                </button>
              </div>
            </div>

            <div className="h-10" />

            <Button
              onClick={handleSubmitVistoria}
              disabled={!canSubmitPasso4 || submitting}
              loading={submitting}
              className="w-full bg-[#111111] text-white text-[14px] font-medium rounded-[6px] h-[48px]"
            >
              Enviar Vistoria
            </Button>
          </div>
        )}
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3] bg-[#F7F7F5] pb-safe">
        MetricLab · Consórcio Pacote 15 e 19
      </footer>
    </main>
  );
}

export default function VistoriaNovoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-[#9B9B9B] text-[13px]">
          Carregando...
        </main>
      }
    >
      <VistoriaFormContent />
    </Suspense>
  );
}
