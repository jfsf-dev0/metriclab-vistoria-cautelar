'use strict';
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Compass,
  MapPin,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Play,
  User,
  Phone,
  ShieldCheck,
  ChevronDown,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface Trecho {
  id: string;
  nome: string;
  km_inicio: number;
  km_fim: number;
  status: string;
  etapa_planejamento: string;
  responsavel_nome: string;
  responsavel_telefone: string;
  superior_nome: string;
  superior_telefone: string;
}

function VistoriaHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramTrechoId = searchParams.get('trecho_id');

  const [trechos, setTrechos] = useState<Trecho[]>([]);
  const [selectedTrecho, setSelectedTrecho] = useState<Trecho | null>(null);
  const [responsavelNome, setResponsavelNome] = useState('');
  const [responsavelTelefone, setResponsavelTelefone] = useState('');
  const [loading, setLoading] = useState(true);
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrechos() {
      try {
        const { data, error } = await supabase
          .from('demo_lote15_trechos')
          .select('*')
          .order('km_inicio', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setTrechos(data);
          const current = paramTrechoId
            ? data.find((t) => t.id === paramTrechoId) || data[0]
            : data[0];
          setSelectedTrecho(current);
          setResponsavelNome(current.responsavel_nome || '');
          setResponsavelTelefone(current.responsavel_telefone || '');
        }
      } catch (err: any) {
        console.error('Erro ao carregar trechos:', err);
        setErro('Falha ao carregar informações dos trechos.');
      } finally {
        setLoading(false);
      }
    }
    loadTrechos();
  }, [paramTrechoId]);

  const handleSelectTrecho = (trecho: Trecho) => {
    setSelectedTrecho(trecho);
    setResponsavelNome(trecho.responsavel_nome || '');
    setResponsavelTelefone(trecho.responsavel_telefone || '');
    router.replace(`/?trecho_id=${trecho.id}`);
  };

  const handleIniciarVistoria = async () => {
    if (!selectedTrecho) return;
    if (selectedTrecho.status !== 'liberado') return;

    setIniciando(true);
    setErro(null);

    try {
      // 1. Criar vistoria em demo_lote15_vistorias
      const { data: vistoria, error: errVistoria } = await supabase
        .from('demo_lote15_vistorias')
        .insert({
          trecho_id: selectedTrecho.id,
          responsavel_nome: responsavelNome.trim() || selectedTrecho.responsavel_nome,
          responsavel_telefone: responsavelTelefone.trim() || selectedTrecho.responsavel_telefone,
          status: 'em_andamento',
          checklist: [],
          fotos: [],
        })
        .select()
        .single();

      if (errVistoria || !vistoria) {
        throw new Error(errVistoria?.message || 'Falha ao criar registro de vistoria.');
      }

      // 2. Criar itens padrão do checklist chamando a RPC SQL
      const { error: errRpc } = await supabase.rpc('demo_lote15_criar_checklist', {
        p_vistoria_id: vistoria.id,
      });

      if (errRpc) {
        console.warn('RPC retorno:', errRpc);
      }

      // 3. Atualizar status do trecho para vistoria_iniciada
      await supabase
        .from('demo_lote15_trechos')
        .update({ status: 'vistoria_iniciada' })
        .eq('id', selectedTrecho.id);

      // 4. Redirecionar para o checklist
      router.push(`/vistoria/${vistoria.id}`);
    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Erro ao iniciar vistoria.');
      setIniciando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <span className="text-sm text-slate-400">Carregando trecho do Lote 15...</span>
      </div>
    );
  }

  const isLiberado = selectedTrecho?.status === 'liberado';

  return (
    <div className="flex-1 flex flex-col justify-between p-5 sm:p-6">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
                MetricLab Vistoria
              </span>
              <span className="text-xs text-slate-300 font-medium">Lote 15 • Campo & Rodovias</span>
            </div>
          </div>

          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            PWA Mobile
          </span>
        </div>

        {/* Trecho Selector */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Selecione o Trecho da Rodovia
          </label>
          <div className="relative">
            <select
              value={selectedTrecho?.id || ''}
              onChange={(e) => {
                const found = trechos.find((t) => t.id === e.target.value);
                if (found) handleSelectTrecho(found);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white font-medium appearance-none focus:outline-none focus:border-blue-500 transition cursor-pointer"
            >
              {trechos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} (Km {t.km_inicio} a {t.km_fim})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Trecho Detail Card */}
        {selectedTrecho && (
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-white leading-snug">
                  {selectedTrecho.nome}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    Km {selectedTrecho.km_inicio} até Km {selectedTrecho.km_fim}
                  </span>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase ${
                  isLiberado
                    ? 'bg-amber-950/80 text-amber-400 border-amber-700'
                    : selectedTrecho.status === 'aprovado'
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {selectedTrecho.status === 'liberado'
                  ? 'Liberado'
                  : selectedTrecho.status === 'aprovado'
                  ? 'Aprovado'
                  : selectedTrecho.status === 'vistoria_iniciada'
                  ? 'Em Vistoria'
                  : 'Em Execução'}
              </span>
            </div>

            {/* Etapa do Planejamento */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-0.5">
                Etapa do Planejamento
              </span>
              <p className="text-xs text-slate-200 font-medium">
                {selectedTrecho.etapa_planejamento || 'Etapa não descrita'}
              </p>
            </div>

            {/* Inspetor info */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1">
                  Responsável pela Inspeção
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    placeholder="Nome do inspetor de campo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1">
                  Telefone de Contato (+55)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={responsavelTelefone}
                    onChange={(e) => setResponsavelTelefone(e.target.value)}
                    placeholder="5511999990001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Motivo de Bloqueio se status != liberado */}
        {!isLiberado && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                Trecho Bloqueado para Vistoria
              </h3>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                {selectedTrecho?.status === 'aprovado'
                  ? 'Este trecho já foi vistoriado e aprovado com laudo emitido pela IA.'
                  : selectedTrecho?.status === 'vistoria_iniciada'
                  ? 'Uma vistoria já está em andamento para este trecho.'
                  : `Trecho em fase de "${selectedTrecho?.etapa_planejamento}". A vistoria só poderá ser realizada após a liberação formal pelo engenheiro de planejamento.`}
              </p>
            </div>
          </div>
        )}

        {erro && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
            {erro}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-6 pb-2">
        <button
          onClick={handleIniciarVistoria}
          disabled={!isLiberado || iniciando}
          className={`w-full min-h-[52px] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition cursor-pointer ${
            isLiberado
              ? 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white shadow-blue-600/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          {iniciando ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Iniciando Checklist Cautelar...
            </>
          ) : isLiberado ? (
            <>
              <Play className="w-4 h-4 fill-current" />
              Iniciar Vistoria Cautelar
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Aguardando Liberação do Trecho
            </>
          )}
        </button>

        <span className="text-[11px] text-center text-slate-500 block mt-3">
          Sistema de Inspeção Cautelar em Campo • MetricLab
        </span>
      </div>
    </div>
  );
}

export default function VistoriaHomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-6">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <VistoriaHomeContent />
    </Suspense>
  );
}
