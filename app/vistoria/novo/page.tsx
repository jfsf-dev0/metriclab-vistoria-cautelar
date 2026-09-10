'use strict';
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession, UserSession } from '@/lib/auth';
import { Camera, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';

const CHECKLIST_6 = [
  'Imóvel desocupado?',
  'Apresenta danos estruturais visíveis?',
  'Acesso ao imóvel desobstruído?',
  'Medidor de energia presente?',
  'Rede de água identificada?',
  'Riscos de segurança identificados?',
];

function VistoriaFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trechoId = searchParams.get('trecho_id');

  const [session, setSessionState] = useState<UserSession | null>(null);
  const [trecho, setTrecho] = useState<any>(null);
  const [loadingTrecho, setLoadingTrecho] = useState(true);

  // Step 1 to 4
  const [passo, setPasso] = useState<1 | 2 | 3 | 4>(1);

  // Passo 1: Identificação do Imóvel
  const [numeroLote, setNumeroLote] = useState('');
  const [complemento, setComplemento] = useState('');
  const [nomeMorador, setNomeMorador] = useState('');
  const [temIdosos, setTemIdosos] = useState<boolean | null>(null);
  const [temCriancas, setTemCriancas] = useState<boolean | null>(null);
  const [imovelDesocupado, setImovelDesocupado] = useState<boolean | null>(null);
  const [acessoDisponivel, setAcessoDisponivel] = useState<boolean | null>(null);
  const [observacoesIniciais, setObservacoesIniciais] = useState('');

  // Passo 2: Checklist 6 itens
  const [checklistRespostas, setChecklistRespostas] = useState<Record<number, boolean>>({});
  const [openChecklistIdx, setOpenChecklistIdx] = useState<number | null>(null);

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

  // Auth & Trecho check
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

  // Canvas setup
  useEffect(() => {
    if (passo === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [passo]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGeoLoc({ lat: -23.5489, lng: -46.6388 });
      return;
    }
    setCapturingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoc({
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
        });
        setCapturingGeo(false);
      },
      () => {
        setGeoLoc({ lat: -23.5489, lng: -46.6388 });
        setCapturingGeo(false);
      },
      { timeout: 8000 }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFoto(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `vistorias/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('demo-lote15-fotos')
          .upload(filePath, file, { contentType: file.type });

        if (uploadError) {
          const reader = new FileReader();
          reader.onload = (re) => {
            if (re.target?.result) {
              setFotos((prev) => [...prev, re.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        } else {
          const { data } = supabase.storage
            .from('demo-lote15-fotos')
            .getPublicUrl(filePath);
          setFotos((prev) => [...prev, data.publicUrl]);
        }
      }
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Submission
  const handleSubmitVistoria = async () => {
    if (!hasSignature || !geoLoc) {
      setErroGeral('Assinatura e localização são obrigatórias.');
      return;
    }

    setSubmitting(true);
    setErroGeral(null);

    try {
      let assinaturaUrl = '';
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const path = `assinaturas/sig_${Date.now()}.png`;
        const { error: upErr } = await supabase.storage
          .from('demo-lote15-fotos')
          .upload(path, blob, { contentType: 'image/png' });

        if (!upErr) {
          const { data: assData } = supabase.storage
            .from('demo-lote15-fotos')
            .getPublicUrl(path);
          assinaturaUrl = assData?.publicUrl || '';
        } else {
          assinaturaUrl = dataUrl;
        }
      }

      const checklistPayload = CHECKLIST_6.map((pergunta, idx) => ({
        item: pergunta,
        resposta: checklistRespostas[idx] ? 'Sim' : 'Não',
        conforme: checklistRespostas[idx],
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
          observacoes: observacoesIniciais.trim() || null,
          ia_aprovado: null,
          geolat: geoLoc?.lat,
          geolng: geoLoc?.lng,
          assinatura_url: assinaturaUrl || null,
          numero_lote: numeroLote.trim(),
          numero_residencia: numeroLote.trim(),
          complemento: complemento.trim() || null,
          nome_morador: nomeMorador.trim() || null,
          tem_idosos: temIdosos,
          tem_criancas: temCriancas,
          imovel_desocupado: imovelDesocupado,
          acesso_disponivel: acessoDisponivel,
        })
        .select()
        .single();

      if (errVistoria || !newVistoria) {
        throw new Error(errVistoria?.message || 'Falha ao gravar vistoria.');
      }

      const vistoriaId = newVistoria.id;

      try {
        await supabase
          .from('demo_lote15_trechos')
          .update({ status: 'vistoria_iniciada', updated_at: new Date().toISOString() })
          .eq('id', trecho.id);
      } catch (_) {}

      // Trigger webhook
      try {
        fetch('https://n8n.metriclab.com.br/webhook/vistoria-concluida', {
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
      } catch (_) {}

      router.push(`/vistoria/${vistoriaId}/status`);
    } catch (err: any) {
      console.error(err);
      setErroGeral(err.message || 'Erro ao enviar vistoria.');
      setSubmitting(false);
    }
  };

  if (loadingTrecho) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#9B9B9B]" />
      </div>
    );
  }

  const trechoNomeCurto = trecho?.nome?.split('—')[0]?.trim() || 'Trecho';

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between">
      {/* Header: "← Voltar" | "[Trecho]" center | "[passo] de 5" */}
      <header className="h-[52px] bg-[#F7F7F5] border-b border-[#E5E5E3] px-6 flex items-center justify-between">
        <button
          onClick={() => {
            if (passo > 1) setPasso((prev) => (prev - 1) as any);
            else router.push('/trechos');
          }}
          className="text-[14px] text-[#111111] hover:underline"
        >
          ← Voltar
        </button>
        <span className="text-[16px] font-normal text-[#111111]">
          {trechoNomeCurto}
        </span>
        <span className="text-[13px] font-normal text-[#9B9B9B]">
          {passo} de 5
        </span>
      </header>

      {/* Barra progresso: height 2px, background hairline-soft, fill ink */}
      <div className="w-full h-[2px] bg-[#EFEFED]">
        <div
          className="h-full bg-[#111111] transition-all duration-500 rounded-none"
          style={{ width: `${(passo / 5) * 100}%` }}
        />
      </div>

      {/* Conteúdo com padding 24px */}
      <div className="flex-1 max-w-md w-full mx-auto p-6">
        {erroGeral && (
          <div className="mb-6 text-[13px] text-[#111111] border-b border-[#111111] pb-2">
            {erroGeral}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 1 — IDENTIFICAÇÃO DO IMÓVEL
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 1 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-8">
              IDENTIFICAÇÃO DO IMÓVEL
            </span>

            {/* Label NÚMERO / LOTE + Input underline */}
            <div className="mb-6 flex flex-col">
              <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] mb-[6px]">
                NÚMERO / LOTE *
              </label>
              <input
                type="text"
                required
                value={numeroLote}
                onChange={(e) => setNumeroLote(e.target.value)}
                placeholder="Ex: 54, 54B, Lote 12A"
                className="w-full bg-transparent border-0 border-b border-[#E5E5E3] focus:border-[#111111] py-3 text-[16px] text-[#111111] placeholder:text-[#9B9B9B] outline-none rounded-none transition-colors"
              />
            </div>

            {/* Label COMPLEMENTO */}
            <div className="mb-6 flex flex-col">
              <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] mb-[6px]">
                COMPLEMENTO
              </label>
              <input
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Casa fundos, Apto 3, Fundos..."
                className="w-full bg-transparent border-0 border-b border-[#E5E5E3] focus:border-[#111111] py-3 text-[16px] text-[#111111] placeholder:text-[#9B9B9B] outline-none rounded-none transition-colors"
              />
            </div>

            {/* Label NOME DO MORADOR */}
            <div className="mb-8 flex flex-col">
              <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] mb-[6px]">
                NOME DO MORADOR
              </label>
              <input
                type="text"
                value={nomeMorador}
                onChange={(e) => setNomeMorador(e.target.value)}
                placeholder="Nome completo"
                className="w-full bg-transparent border-0 border-b border-[#E5E5E3] focus:border-[#111111] py-3 text-[16px] text-[#111111] placeholder:text-[#9B9B9B] outline-none rounded-none transition-colors"
              />
            </div>

            <div className="w-full border-b border-[#E5E5E3] my-8" />

            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-4">
              PERFIL DOS MORADORES
            </span>

            {/* Pergunta 1: Idosos */}
            <div className="border-b border-[#E5E5E3] py-4 flex items-center justify-between">
              <span className="text-[20px] font-normal leading-none text-[#111111]">
                Há idosos no imóvel? (60+)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTemIdosos(true)}
                  className={`px-4 py-1.5 text-[14px] font-normal rounded-[4px] border transition-colors ${
                    temIdosos === true
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'border-[#E5E5E3] text-[#111111]'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setTemIdosos(false)}
                  className={`px-4 py-1.5 text-[14px] font-normal rounded-[4px] border transition-colors ${
                    temIdosos === false
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'border-[#E5E5E3] text-[#111111]'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>

            {/* Pergunta 2: Crianças */}
            <div className="border-b border-[#E5E5E3] py-4 flex items-center justify-between">
              <span className="text-[20px] font-normal leading-none text-[#111111]">
                Há crianças no imóvel? (0-12)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTemCriancas(true)}
                  className={`px-4 py-1.5 text-[14px] font-normal rounded-[4px] border transition-colors ${
                    temCriancas === true
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'border-[#E5E5E3] text-[#111111]'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setTemCriancas(false)}
                  className={`px-4 py-1.5 text-[14px] font-normal rounded-[4px] border transition-colors ${
                    temCriancas === false
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'border-[#E5E5E3] text-[#111111]'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>

            {/* Pergunta 3: Desocupado */}
            <div className="border-b border-[#E5E5E3] py-4 flex items-center justify-between">
              <span className="text-[20px] font-normal leading-none text-[#111111]">
                Imóvel desocupado?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImovelDesocupado(true)}
                  className={`px-4 py-1.5 text-[14px] font-normal rounded-[4px] border transition-colors ${
                    imovelDesocupado === true
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'border-[#E5E5E3] text-[#111111]'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setImovelDesocupado(false)}
                  className={`px-4 py-1.5 text-[14px] font-normal rounded-[4px] border transition-colors ${
                    imovelDesocupado === false
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'border-[#E5E5E3] text-[#111111]'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>

            {/* Pergunta 4: Acesso */}
            <div className="border-b border-[#E5E5E3] py-4 flex items-center justify-between">
              <span className="text-[20px] font-normal leading-none text-[#111111]">
                Acesso disponível?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAcessoDisponivel(true)}
                  className={`px-4 py-1.5 text-[14px] font-normal rounded-[4px] border transition-colors ${
                    acessoDisponivel === true
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'border-[#E5E5E3] text-[#111111]'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setAcessoDisponivel(false)}
                  className={`px-4 py-1.5 text-[14px] font-normal rounded-[4px] border transition-colors ${
                    acessoDisponivel === false
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'border-[#E5E5E3] text-[#111111]'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>

            {/* Observações Iniciais */}
            <div className="mt-8 mb-10 flex flex-col">
              <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] mb-[6px]">
                OBSERVAÇÕES INICIAIS
              </label>
              <textarea
                rows={4}
                value={observacoesIniciais}
                onChange={(e) => setObservacoesIniciais(e.target.value)}
                placeholder="Estado aparente da fachada, vizinhança, acesso, condições gerais..."
                className="w-full bg-transparent border-0 border-b border-[#E5E5E3] focus:border-[#111111] py-3 text-[16px] text-[#111111] placeholder:text-[#9B9B9B] outline-none rounded-none resize-none transition-colors"
              />
            </div>

            <button
              onClick={() => {
                if (!numeroLote.trim()) {
                  setErroGeral('Informe o número ou lote do imóvel.');
                  return;
                }
                setErroGeral(null);
                setPasso(2);
              }}
              className="w-full h-12 bg-[#111111] hover:bg-black text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
            >
              Próximo
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 2 — CHECKLIST
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 2 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              CHECKLIST DE VISTORIA
            </span>
            <p className="text-[13px] font-normal text-[#9B9B9B] mb-6">
              Responda todos os itens obrigatórios.
            </p>

            <div className="divide-y divide-[#E5E5E3] border-t border-[#E5E5E3] mb-10">
              {CHECKLIST_6.map((pergunta, idx) => {
                const resp = checklistRespostas[idx];
                const isOpen = openChecklistIdx === idx;
                const statusTexto = resp === undefined ? '—' : resp ? 'Sim' : 'Não';
                const statusCor = resp === undefined ? 'text-[#C4C4C2]' : 'text-[#6B6B6B]';

                return (
                  <div key={idx} className="border-b border-[#E5E5E3]">
                    <div
                      onClick={() => setOpenChecklistIdx(isOpen ? null : idx)}
                      className="py-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <span className="text-[20px] font-normal leading-none text-[#111111]">
                        {pergunta}
                      </span>
                      <span className={`text-[14px] ${statusCor}`}>
                        {statusTexto}
                      </span>
                    </div>

                    {isOpen && (
                      <div className="bg-white p-4 mb-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setChecklistRespostas((prev) => ({ ...prev, [idx]: true }));
                            setOpenChecklistIdx(null);
                          }}
                          className={`flex-1 py-2 text-[14px] font-medium rounded-[4px] border transition-colors ${
                            resp === true
                              ? 'bg-[#111111] text-white border-[#111111]'
                              : 'border-[#E5E5E3] text-[#111111]'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setChecklistRespostas((prev) => ({ ...prev, [idx]: false }));
                            setOpenChecklistIdx(null);
                          }}
                          className={`flex-1 py-2 text-[14px] font-medium rounded-[4px] border transition-colors ${
                            resp === false
                              ? 'bg-[#111111] text-white border-[#111111]'
                              : 'border-[#E5E5E3] text-[#111111]'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              disabled={Object.keys(checklistRespostas).length < CHECKLIST_6.length}
              onClick={() => setPasso(3)}
              className="w-full h-12 bg-[#111111] hover:bg-black disabled:opacity-40 text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
            >
              Próximo
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 3 — FOTOS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 3 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
              REGISTRO FOTOGRÁFICO
            </span>
            <p className="text-[16px] font-normal leading-[1.5] text-[#6B6B6B] mb-6">
              Fotografe o imóvel e condições identificadas.
            </p>

            {/* Área câmera */}
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#E5E5E3] rounded-none py-12 px-6 bg-[#F7F7F5] flex flex-col items-center justify-center cursor-pointer hover:border-[#111111] transition-colors mb-4"
            >
              {uploadingFoto ? (
                <Loader2 className="w-5 h-5 text-[#9B9B9B] animate-spin mb-2" />
              ) : (
                <Camera className="w-5 h-5 text-[#9B9B9B] mb-2" />
              )}
              <span className="text-[14px] font-normal text-[#6B6B6B]">
                {uploadingFoto ? 'Enviando...' : 'Adicionar foto'}
              </span>
            </div>

            {/* Grid 2 colunas fotos */}
            {fotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-10">
                {fotos.map((foto, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video bg-[#EFEFED] rounded-[4px] overflow-hidden group border border-[#E5E5E3]"
                  >
                    <img
                      src={foto}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFoto(idx);
                      }}
                      className="absolute top-1 right-1 bg-black/60 text-[#9B9B9B] hover:text-white text-[12px] w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="h-6" />

            <button
              disabled={fotos.length === 0}
              onClick={() => setPasso(4)}
              className="w-full h-12 bg-[#111111] hover:bg-black disabled:opacity-40 text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
            >
              Próximo
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 4 — ASSINATURA E LOCALIZAÇÃO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 4 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B]">
                ASSINATURA
              </span>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[13px] text-[#9B9B9B] hover:text-[#111111]"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Canvas */}
            <div className="border border-[#E5E5E3] rounded-none bg-white h-[180px] w-full overflow-hidden relative mb-8">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full touch-none cursor-crosshair"
              />
              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[13px] text-[#C4C4C2]">
                  Assine com o dedo ou mouse
                </div>
              )}
            </div>

            <div className="w-full border-b border-[#E5E5E3] mb-8" />

            {/* LOCALIZAÇÃO */}
            <div className="mb-10">
              <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#9B9B9B] block mb-2">
                LOCALIZAÇÃO
              </span>

              {geoLoc ? (
                <p className="text-[13px] font-normal text-[#9B9B9B]">
                  Lat: {geoLoc.lat} · Lng: {geoLoc.lng}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleCaptureGPS}
                  disabled={capturingGeo}
                  className="text-[14px] text-[#111111] hover:underline"
                >
                  {capturingGeo ? 'Obtendo coordenadas...' : 'Capturar localização'}
                </button>
              )}
            </div>

            <button
              disabled={!hasSignature || !geoLoc || submitting}
              onClick={handleSubmitVistoria}
              className="w-full h-12 bg-[#111111] hover:bg-black disabled:opacity-40 text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
            >
              {submitting ? 'Gravando vistoria...' : 'Enviar Vistoria'}
            </button>
          </div>
        )}
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[#9B9B9B] border-t border-[#E5E5E3]">
        MetricLab · Pacote 15 e 19
      </footer>
    </main>
  );
}

export default function VistoriaNovoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#9B9B9B]" />
        </div>
      }
    >
      <VistoriaFormContent />
    </Suspense>
  );
}
