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

import { useDesktopBlock } from '@/hooks/useDesktopBlock';
import { useGeolocation } from '@/hooks/useGeolocation';

function VistoriaFormContent() {
  useDesktopBlock();
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
  const { latitude, longitude, accuracy, error: geoError, loading: geoLoading } = useGeolocation();

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
    if (!hasSignature) {
      setErroGeral('A assinatura é obrigatória.');
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
          geolat: latitude,
          geolng: longitude,
          latitude,
          longitude,
          accuracy,
          geolocated_at: new Date().toISOString(),
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

  const stepTitles: Record<number, string> = {
    1: 'Identificação do Imóvel',
    2: 'Checklist de Vistoria',
    3: 'Fotos da Vistoria',
    4: 'Assinatura e Localização',
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col justify-between font-sans">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BARRA DE PROGRESSO MULTI-STEP (2PX)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="w-full h-[2px] bg-[#E2E2DC] sticky top-0 z-30">
        <div
          className="h-full bg-[#111111] transition-all duration-300 rounded-full"
          style={{ width: `${(passo / 4) * 100}%` }}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HEADER UNIFICADO (56PX)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="h-[56px] bg-white border-b border-[#E2E2DC] px-4 flex items-center justify-between sticky top-[2px] z-20 select-none">
        <button
          type="button"
          onClick={() => {
            if (passo > 1) setPasso((prev) => (prev - 1) as any);
            else router.push('/home');
          }}
          className="min-w-[44px] min-h-[44px] flex items-center text-[14px] font-medium text-[#111111] hover:opacity-80 transition-opacity"
        >
          ← Voltar
        </button>
        <h1 className="text-[18px] font-semibold text-[#111111] tracking-[-0.3px] truncate px-2">
          {stepTitles[passo]}
        </h1>
        <div className="min-w-[44px] min-h-[44px]" />
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CONTEÚDO DO FORMULÁRIO (ESPAÇAMENTO 24PX)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 max-w-md w-full mx-auto px-5 py-6 pb-32">
        {erroGeral && (
          <div className="mb-6 p-4 bg-white border border-[#DC2626] rounded-[8px] text-[13px] text-[#DC2626]">
            {erroGeral}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 1 — IDENTIFICAÇÃO DO IMÓVEL
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                NÚMERO / LOTE *
              </label>
              <input
                type="text"
                required
                value={numeroLote}
                onChange={(e) => setNumeroLote(e.target.value)}
                placeholder="Ex: 154, Lote 12A"
                className="w-full h-[48px] px-4 bg-white border border-[#E2E2DC] rounded-[8px] text-[15px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                COMPLEMENTO
              </label>
              <input
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Ex: Casa fundos, Apto 3..."
                className="w-full h-[48px] px-4 bg-white border border-[#E2E2DC] rounded-[8px] text-[15px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                NOME DO MORADOR
              </label>
              <input
                type="text"
                value={nomeMorador}
                onChange={(e) => setNomeMorador(e.target.value)}
                placeholder="Nome completo do residente"
                className="w-full h-[48px] px-4 bg-white border border-[#E2E2DC] rounded-[8px] text-[15px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>

            {/* Perfil dos moradores */}
            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                PERFIL DOS MORADORES
              </span>
              <div className="bg-white border border-[#E2E2DC] divide-y divide-[#E2E2DC] rounded-[12px] overflow-hidden">
                {/* Idosos */}
                <div className="p-4 flex items-center justify-between">
                  <span className="text-[15px] text-[#111111]">
                    Há idosos no imóvel? (60+)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTemIdosos(true)}
                      className={`h-[40px] px-4 text-[14px] font-medium rounded-[8px] border transition-colors ${
                        temIdosos === true
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white border-[#E2E2DC] text-[#111111] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemIdosos(false)}
                      className={`h-[40px] px-4 text-[14px] font-medium rounded-[8px] border transition-colors ${
                        temIdosos === false
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white border-[#E2E2DC] text-[#111111] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* Crianças */}
                <div className="p-4 flex items-center justify-between">
                  <span className="text-[15px] text-[#111111]">
                    Há crianças no imóvel? (0-12)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTemCriancas(true)}
                      className={`h-[40px] px-4 text-[14px] font-medium rounded-[8px] border transition-colors ${
                        temCriancas === true
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white border-[#E2E2DC] text-[#111111] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemCriancas(false)}
                      className={`h-[40px] px-4 text-[14px] font-medium rounded-[8px] border transition-colors ${
                        temCriancas === false
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white border-[#E2E2DC] text-[#111111] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* Desocupado */}
                <div className="p-4 flex items-center justify-between">
                  <span className="text-[15px] text-[#111111]">
                    Imóvel desocupado?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImovelDesocupado(true)}
                      className={`h-[40px] px-4 text-[14px] font-medium rounded-[8px] border transition-colors ${
                        imovelDesocupado === true
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white border-[#E2E2DC] text-[#111111] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setImovelDesocupado(false)}
                      className={`h-[40px] px-4 text-[14px] font-medium rounded-[8px] border transition-colors ${
                        imovelDesocupado === false
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white border-[#E2E2DC] text-[#111111] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* Acesso */}
                <div className="p-4 flex items-center justify-between">
                  <span className="text-[15px] text-[#111111]">
                    Acesso disponível?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAcessoDisponivel(true)}
                      className={`h-[40px] px-4 text-[14px] font-medium rounded-[8px] border transition-colors ${
                        acessoDisponivel === true
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white border-[#E2E2DC] text-[#111111] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setAcessoDisponivel(false)}
                      className={`h-[40px] px-4 text-[14px] font-medium rounded-[8px] border transition-colors ${
                        acessoDisponivel === false
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white border-[#E2E2DC] text-[#111111] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Observações Iniciais */}
            <div>
              <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                OBSERVAÇÕES INICIAIS
              </label>
              <textarea
                rows={3}
                value={observacoesIniciais}
                onChange={(e) => setObservacoesIniciais(e.target.value)}
                placeholder="Estado aparente da fachada, vizinhança, acesso e condições gerais..."
                className="w-full bg-white border border-[#E2E2DC] rounded-[8px] p-3.5 text-[15px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none transition-all"
              />
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 2 — CHECKLIST
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 2 && (
          <div className="space-y-4">
            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-1">
                ITENS OBRIGATÓRIOS
              </span>
              <p className="text-[13px] text-[#9CA3AF]">
                Responda a conformidade de todos os itens de inspeção.
              </p>
            </div>

            <div className="bg-white border border-[#E2E2DC] divide-y divide-[#E2E2DC] rounded-[12px] overflow-hidden">
              {CHECKLIST_6.map((pergunta, idx) => {
                const resp = checklistRespostas[idx];
                const isOpen = openChecklistIdx === idx;
                const statusTexto = resp === undefined ? 'Pendente' : resp ? 'Conforme' : 'Não conforme';

                return (
                  <div key={idx} className="p-4 space-y-3">
                    <div
                      onClick={() => setOpenChecklistIdx(isOpen ? null : idx)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <span className="text-[15px] font-semibold text-[#111111]">
                        {idx + 1}. {pergunta}
                      </span>
                      <span
                        className={`text-[12px] font-medium ${
                          resp === undefined
                            ? 'text-[#9CA3AF]'
                            : resp
                            ? 'text-[#111111]'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        {statusTexto}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setChecklistRespostas((prev) => ({ ...prev, [idx]: true }));
                          setOpenChecklistIdx(null);
                        }}
                        className={`flex-1 h-[44px] text-[14px] font-medium rounded-[8px] border transition-colors ${
                          resp === true
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white border-[#E2E2DC] text-[#111111] hover:bg-[#F7F7F5]'
                        }`}
                      >
                        Sim / Conforme
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChecklistRespostas((prev) => ({ ...prev, [idx]: false }));
                          setOpenChecklistIdx(null);
                        }}
                        className={`flex-1 h-[44px] text-[14px] font-medium rounded-[8px] border transition-colors ${
                          resp === false
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white border-[#E2E2DC] text-[#111111] hover:bg-[#F7F7F5]'
                        }`}
                      >
                        Não / Irregular
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 3 — FOTOS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 3 && (
          <div className="space-y-6">
            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-1">
                REGISTRO FOTOGRÁFICO
              </span>
              <p className="text-[13px] text-[#9CA3AF]">
                Fotografe a fachada, patologias e condições estruturais do imóvel.
              </p>
            </div>

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
              className="border border-dashed border-[#E2E2DC] bg-white rounded-[12px] py-10 px-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#111111] transition-colors"
            >
              {uploadingFoto ? (
                <Loader2 className="w-6 h-6 text-[#111111] animate-spin mb-2" />
              ) : (
                <Camera className="w-6 h-6 text-[#111111] mb-2" />
              )}
              <span className="text-[14px] font-medium text-[#111111]">
                {uploadingFoto ? 'Enviando imagem...' : 'Capturar ou selecionar foto'}
              </span>
              <span className="text-[12px] text-[#9CA3AF] mt-1">
                Suporta JPG, PNG e WebP
              </span>
            </div>

            {/* Grid 3 colunas fotos */}
            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square bg-[#F7F7F5] rounded-[8px] overflow-hidden group border border-[#E2E2DC]"
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
                      className="absolute top-1 right-1 bg-[#111111]/80 text-white text-[12px] w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PASSO 4 — ASSINATURA E LOCALIZAÇÃO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {passo === 4 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                  ASSINATURA DO VISTORIADOR OU MORADOR
                </span>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[12px] text-[#6B7280] hover:text-[#111111] underline"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="border border-[#E2E2DC] rounded-[12px] bg-white h-[180px] w-full overflow-hidden relative">
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
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[13px] text-[#9CA3AF]">
                    Assine com o dedo ou mouse
                  </div>
                )}
              </div>
            </div>

            {/* LOCALIZAÇÃO */}
            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                GEOLOCALIZAÇÃO
              </span>
              <div className="bg-white border border-[#E2E2DC] rounded-[12px] p-4">
                {geoLoading ? (
                  <p className="text-[12px] font-normal text-[#9CA3AF]">
                    Obtendo localização...
                  </p>
                ) : geoError !== null ? (
                  <p className="text-[12px] font-normal text-[#DC2626]">
                    Localização indisponível — verifique as permissões do celular
                  </p>
                ) : (
                  <p className="text-[12px] font-normal text-[#6B7280]">
                    Localização capturada
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BOTÃO FIXO INFERIOR (52PX, FULL-WIDTH, RAIO 8PX)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#F7F7F5] border-t border-[#E2E2DC] z-30">
        <div className="max-w-md mx-auto">
          {passo === 1 && (
            <button
              type="button"
              onClick={() => {
                if (!numeroLote.trim()) {
                  setErroGeral('Informe o número ou lote do imóvel.');
                  return;
                }
                setErroGeral(null);
                setPasso(2);
              }}
              className="w-full h-[52px] bg-[#111111] hover:bg-black active:opacity-85 text-white text-[15px] font-semibold rounded-[8px] transition-opacity flex items-center justify-center cursor-pointer"
            >
              Próximo
            </button>
          )}

          {passo === 2 && (
            <button
              type="button"
              onClick={() => {
                setPasso(3);
              }}
              className="w-full h-[52px] bg-[#111111] hover:bg-black active:opacity-85 text-white text-[15px] font-semibold rounded-[8px] transition-opacity flex items-center justify-center cursor-pointer"
            >
              Próximo
            </button>
          )}

          {passo === 3 && (
            <button
              type="button"
              onClick={() => setPasso(4)}
              className="w-full h-[52px] bg-[#111111] hover:bg-black active:opacity-85 text-white text-[15px] font-semibold rounded-[8px] transition-opacity flex items-center justify-center cursor-pointer"
            >
              Próximo
            </button>
          )}

          {passo === 4 && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitVistoria}
              className="w-full h-[52px] bg-[#111111] hover:bg-black active:opacity-85 text-white text-[15px] font-semibold rounded-[8px] transition-opacity flex items-center justify-center cursor-pointer disabled:opacity-40"
            >
              {submitting ? 'Gravando vistoria...' : 'Concluir e Enviar'}
            </button>
          )}
        </div>
      </div>
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
