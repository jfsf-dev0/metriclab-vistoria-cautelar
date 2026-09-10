'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession, UserSession } from '@/lib/auth';
import {
  Home as HomeIcon,
  ClipboardList,
  AlertTriangle,
  Search,
  X,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

const FICTITIOUS_NAMES = [
  'Ana Costa',
  'Pedro Alves',
  'Lucia Mendes',
  'Rafael Torres',
  'Camila Souza',
  'Bruno Lima',
  'Fernanda Reis',
];

const ROLES = [
  'Inspetor de Campo',
  'Assistente Social',
  'Técnico de Comunicação',
  'Supervisor de Obra',
  'Encarregado Operacional',
];

function getDeterministicFictitiousName(id: string, salt: number = 0): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i) + salt) % FICTITIOUS_NAMES.length;
  }
  return FICTITIOUS_NAMES[Math.abs(hash)];
}

function getDeterministicRole(id: string, salt: number = 0): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 17 + id.charCodeAt(i) + salt) % ROLES.length;
  }
  return ROLES[Math.abs(hash)];
}

interface FeedItem {
  id: string;
  tipoItem: 'vistoria' | 'incidente' | 'rdo';
  trechoId?: string;
  trechoNum: string;
  createdAt: string;
  dateFormatted: string;
  linha1Titulo: string;
  linha2Detalhe: string;
  raw: any;
}

interface TrechoMap {
  [id: string]: {
    nome: string;
    num: string;
  };
}

export default function HomePage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [session, setSessionState] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Counters
  const [countVistorias, setCountVistorias] = useState<number>(0);
  const [countIncidentes, setCountIncidentes] = useState<number>(0);
  const [countRDOs, setCountRDOs] = useState<number>(0);

  // Feed items & raw data
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [trechosMap, setTrechosMap] = useState<TrechoMap>({});

  // Search filter
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bottom sheet modal
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);

  // Check authentication
  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    setSessionState(s);
  }, [router]);

  // Focus search input when toggled
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [showSearch]);

  // Load Trechos, Counters and Feed Data
  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Trechos
      const { data: trechosData } = await supabase
        .from('demo_lote15_trechos')
        .select('id, nome');

      const tMap: TrechoMap = {};
      let defaultTrechoId = '132b2313-eb1c-4e54-960a-24aa39f01456';

      if (trechosData && trechosData.length > 0) {
        trechosData.forEach((t) => {
          const match = t.nome.match(/Trecho\s*(\d+)/i);
          const num = match ? match[1].padStart(2, '0') : '01';
          tMap[t.id] = { nome: t.nome, num };
        });
        if (!tMap[defaultTrechoId]) {
          defaultTrechoId = trechosData[0].id;
        }
      }
      setTrechosMap(tMap);

      // Determine active user & trecho IDs
      const s = getSession();
      let userTrechoId = defaultTrechoId;
      if (s?.trecho_nome && trechosData) {
        const found = trechosData.find(
          (t) =>
            t.nome.toLowerCase().includes(s.trecho_nome?.toLowerCase() || '') ||
            (s.trecho_nome?.toLowerCase() || '').includes(t.nome.toLowerCase())
        );
        if (found) userTrechoId = found.id;
      }

      const activeUserId =
        s?.lead_id && s.lead_id.length > 20
          ? s.lead_id
          : 'e022000d-db0c-4788-b50b-d2f6984fee60';

      // 2. Fetch Pendências Counts
      // Vistorias: WHERE status != 'aprovada' AND trecho_id = trecho do usuário
      const { count: vCount } = await supabase
        .from('demo_lote15_vistorias')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'aprovada')
        .eq('trecho_id', userTrechoId);
      setCountVistorias(vCount || 0);

      // Incidentes: WHERE status = 'aberta' AND trecho_id = trecho do usuário
      const { count: iCount } = await supabase
        .from('demo_rdo_ocorrencias')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'aberta')
        .eq('trecho_id', userTrechoId);
      setCountIncidentes(iCount || 0);

      // RDOs: WHERE status = 'rascunho' AND usuario_id = usuário logado
      const { count: rCount } = await supabase
        .from('demo_rdo_registros')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'rascunho')
        .eq('usuario_id', activeUserId);
      setCountRDOs(rCount || 0);

      // 3. Fetch Feed Records (Vistorias, Incidentes, RDOs)
      const [vRes, iRes, rRes] = await Promise.all([
        supabase
          .from('demo_lote15_vistorias')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('demo_rdo_ocorrencias')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('demo_rdo_registros')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      const items: FeedItem[] = [];

      // Process Vistorias
      if (vRes.data) {
        vRes.data.forEach((v) => {
          const tInfo = tMap[v.trecho_id] || { nome: 'Trecho 01', num: '01' };
          const d = new Date(v.created_at);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');

          const rua = (v.rua || v.numero_lote || '').trim();
          const num = v.numero_residencia ? `N${v.numero_residencia}` : '';
          const detalhe = [rua, num].filter(Boolean).join(' ') || 'Rua das Palmeiras';

          items.push({
            id: v.id,
            tipoItem: 'vistoria',
            trechoId: v.trecho_id,
            trechoNum: tInfo.num,
            createdAt: v.created_at,
            dateFormatted: `${dd}/${mm}`,
            linha1Titulo: `V. Cautelar - Tr. ${tInfo.num}`,
            linha2Detalhe: detalhe,
            raw: v,
          });
        });
      }

      // Process Incidentes
      if (iRes.data) {
        iRes.data.forEach((inc) => {
          const tInfo = tMap[inc.trecho_id] || { nome: 'Trecho 01', num: '01' };
          const d = new Date(inc.created_at);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');

          const tipoCap = inc.tipo
            ? inc.tipo.charAt(0).toUpperCase() + inc.tipo.slice(1)
            : 'Patrimonial';
          let gravCap = 'Geral';
          if (inc.gravidade === 'alta') gravCap = 'Alta gravidade';
          else if (inc.gravidade === 'media') gravCap = 'Média gravidade';
          else if (inc.gravidade === 'baixa') gravCap = 'Baixa gravidade';
          else if (inc.gravidade) {
            gravCap = inc.gravidade.charAt(0).toUpperCase() + inc.gravidade.slice(1);
          }

          items.push({
            id: inc.id,
            tipoItem: 'incidente',
            trechoId: inc.trecho_id,
            trechoNum: tInfo.num,
            createdAt: inc.created_at,
            dateFormatted: `${dd}/${mm}`,
            linha1Titulo: `Incidente - Tr. ${tInfo.num}`,
            linha2Detalhe: `${tipoCap} · ${gravCap}`,
            raw: inc,
          });
        });
      }

      // Process RDOs
      if (rRes.data) {
        rRes.data.forEach((rdo) => {
          const tInfo = tMap[rdo.trecho_id] || { nome: 'Trecho 01', num: '01' };
          const d = new Date(rdo.created_at || rdo.data);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');

          const resp = getDeterministicFictitiousName(rdo.id);
          const partCount =
            Array.isArray(rdo.equipe) && rdo.equipe.length > 0
              ? rdo.equipe.length
              : ((rdo.id.charCodeAt(0) % 4) + 2);

          items.push({
            id: rdo.id,
            tipoItem: 'rdo',
            trechoId: rdo.trecho_id,
            trechoNum: tInfo.num,
            createdAt: rdo.created_at,
            dateFormatted: `${dd}/${mm}`,
            linha1Titulo: `RDO Comunicação - Tr. ${tInfo.num}`,
            linha2Detalhe: `${resp} · ${partCount} participantes`,
            raw: rdo,
          });
        });
      }

      // Sort merged feed by created_at DESC
      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setFeedItems(items);
    } catch (err) {
      console.error('[loadData error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup realtime subscription for instant updates
    const chVistorias = supabase
      .channel('home-vistorias-ch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demo_lote15_vistorias' },
        () => loadData()
      )
      .subscribe();

    const chOcorrencias = supabase
      .channel('home-ocorrencias-ch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demo_rdo_ocorrencias' },
        () => loadData()
      )
      .subscribe();

    const chRegistros = supabase
      .channel('home-registros-ch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demo_rdo_registros' },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chVistorias);
      supabase.removeChannel(chOcorrencias);
      supabase.removeChannel(chRegistros);
    };
  }, []);

  // Filtered feed based on search
  const filteredFeed = useMemo(() => {
    if (!searchQuery.trim()) return feedItems;
    const q = searchQuery.toLowerCase().trim();
    return feedItems.filter((item) => {
      const matchTitulo = item.linha1Titulo.toLowerCase().includes(q);
      const matchDetalhe = item.linha2Detalhe.toLowerCase().includes(q);
      const matchDate = item.dateFormatted.includes(q);
      let matchDesc = false;

      if (item.tipoItem === 'vistoria') {
        matchDesc =
          (item.raw?.observacoes || '').toLowerCase().includes(q) ||
          (item.raw?.nome_morador || '').toLowerCase().includes(q);
      } else if (item.tipoItem === 'incidente') {
        matchDesc = (item.raw?.descricao || '').toLowerCase().includes(q);
      } else if (item.tipoItem === 'rdo') {
        matchDesc = (item.raw?.atividades || '').toLowerCase().includes(q);
      }

      return matchTitulo || matchDetalhe || matchDate || matchDesc;
    });
  }, [feedItems, searchQuery]);

  // Header texts
  const userName = session?.nome || 'Inspetor Demo';
  const trechoNome = session?.trecho_nome || 'Trecho 01 — Acesso Norte';

  return (
    <main className="min-h-screen bg-[#F0F0F0] text-[#111111] flex flex-col justify-between font-sans">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HEADER
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="bg-white border-b border-[#E5E5E3] px-5 py-4 shrink-0">
        <h1 className="text-[22px] font-bold text-[#111111] leading-tight tracking-[-0.5px]">
          Olá, {userName}.
        </h1>
        <p className="text-[13px] font-normal text-[#9B9B9B] mt-0.5">
          Consórcio Lote 15 · {trechoNome}
        </p>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CAMPO DE BUSCA (QUANDO ABERTO)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {showSearch && (
        <div className="bg-white border-b border-[#E5E5E3] px-5 py-3 flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-2 duration-150 shrink-0">
          <Search className="w-4 h-4 text-[#9B9B9B] shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar vistorias, incidentes, RDOs..."
            className="w-full bg-transparent text-[14px] text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#9B9B9B] hover:text-[#111111] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PENDÊNCIAS
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white border-b border-[#E5E5E3] px-5 py-3 shrink-0">
        <div className="flex flex-row justify-between items-center max-w-md mx-auto">
          {/* Vistorias */}
          <div className="flex flex-col items-center justify-center flex-1">
            <span className="text-[24px] font-bold text-[#111111] leading-none">
              {countVistorias}
            </span>
            <span className="text-[11px] font-normal text-[#9B9B9B] mt-1">
              Vistorias
            </span>
          </div>

          <div className="w-px h-7 bg-[#E5E5E3]" />

          {/* Incidentes */}
          <div className="flex flex-col items-center justify-center flex-1">
            <span className="text-[24px] font-bold text-[#111111] leading-none">
              {countIncidentes}
            </span>
            <span className="text-[11px] font-normal text-[#9B9B9B] mt-1">
              Incidentes
            </span>
          </div>

          <div className="w-px h-7 bg-[#E5E5E3]" />

          {/* RDOs */}
          <div className="flex flex-col items-center justify-center flex-1">
            <span className="text-[24px] font-bold text-[#111111] leading-none">
              {countRDOs}
            </span>
            <span className="text-[11px] font-normal text-[#9B9B9B] mt-1">
              RDOs
            </span>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FEED — ÚLTIMAS AÇÕES
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="flex-1 bg-[#F0F0F0] pb-24 overflow-y-auto">
        {loading && feedItems.length === 0 ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="bg-white p-4 border-b border-[#E5E5E3] animate-pulse h-[68px]"
              />
            ))}
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[14px] text-[#6B6B6B]">
              {searchQuery
                ? 'Nenhum registro encontrado para a busca.'
                : 'Nenhuma ação registrada ainda.'}
            </p>
          </div>
        ) : (
          <div className="divide-y-0">
            {filteredFeed.map((item) => (
              <div
                key={`${item.tipoItem}-${item.id}`}
                onClick={() => setSelectedItem(item)}
                className="bg-white px-5 py-3.5 border-b border-[#E5E5E3] cursor-pointer active:bg-[#F7F7F7] hover:bg-[#FAFAFA] transition-colors select-none"
              >
                {/* Linha 1 */}
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-medium text-[#111111]">
                    {item.linha1Titulo}
                  </span>
                  <span className="text-[13px] font-normal text-[#9B9B9B]">
                    {item.dateFormatted}
                  </span>
                </div>

                {/* Linha 2 */}
                <p className="text-[13px] font-normal text-[#6B6B6B] mt-0.5 truncate">
                  {item.linha2Detalhe}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BOTTOM SHEET MODAL
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {selectedItem && (
        <div className="fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in-0 duration-200"
          />

          {/* Modal Container */}
          <div className="fixed inset-x-0 bottom-0 z-50 h-[85%] max-w-lg mx-auto bg-white rounded-t-[16px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Handle bar */}
            <div
              onClick={() => setSelectedItem(null)}
              className="w-full pt-3 pb-2 flex justify-center cursor-pointer select-none"
            >
              <div className="w-10 h-1 bg-[#E5E5E3] rounded-full" />
            </div>

            {/* Conteúdo rolável */}
            <div className="flex-1 overflow-y-auto px-5 py-3 pb-16">
              {/* ─────────────────────────
                  CONTEÚDO: VISTORIA
                  ───────────────────────── */}
              {selectedItem.tipoItem === 'vistoria' && (
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-[18px] font-semibold text-[#111111]">
                        V. Cautelar - Tr. {selectedItem.trechoNum}
                      </h2>
                      <p className="text-[14px] text-[#6B6B6B] mt-1">
                        {(selectedItem.raw.rua ||
                          selectedItem.raw.numero_lote ||
                          'Rua das Palmeiras') +
                          (selectedItem.raw.numero_residencia
                            ? ` · N${selectedItem.raw.numero_residencia}`
                            : '')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="text-[#9B9B9B] hover:text-[#111111] p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="h-px bg-[#E5E5E3] mt-4 mb-2" />

                  {/* Lista flat de dados */}
                  <div className="divide-y divide-[#E5E5E3]">
                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px]">
                        CEP
                      </span>
                      <span className="text-[14px] text-[#111111]">
                        {selectedItem.raw.cep || '04571-010'}
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px]">
                        Morador
                      </span>
                      <span className="text-[14px] text-[#111111]">
                        {selectedItem.raw.nome_morador || 'Não informado'}
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px]">
                        Idosos
                      </span>
                      <span className="text-[14px] text-[#111111]">
                        {selectedItem.raw.tem_idosos ? 'Sim' : 'Não'}
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px]">
                        Crianças
                      </span>
                      <span className="text-[14px] text-[#111111]">
                        {selectedItem.raw.tem_criancas ? 'Sim' : 'Não'}
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px]">
                        Desocupado
                      </span>
                      <span className="text-[14px] text-[#111111]">
                        {selectedItem.raw.imovel_desocupado ? 'Sim' : 'Não'}
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px]">
                        Acesso
                      </span>
                      <span className="text-[14px] text-[#111111]">
                        {selectedItem.raw.acesso_disponivel !== false
                          ? 'Sim'
                          : 'Não'}
                      </span>
                    </div>

                    <div className="py-3 flex items-start justify-between gap-4">
                      <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px] shrink-0 mt-0.5">
                        Observações
                      </span>
                      <span className="text-[14px] text-[#111111] text-right">
                        {selectedItem.raw.observacoes ||
                          'Nenhuma observação registrada.'}
                      </span>
                    </div>
                  </div>

                  {/* Fotos */}
                  {Array.isArray(selectedItem.raw.fotos) &&
                    selectedItem.raw.fotos.length > 0 && (
                      <div className="mt-4 pt-2">
                        <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px] block mb-2">
                          FOTOS
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedItem.raw.fotos.map(
                            (fotoUrl: string, fIdx: number) => (
                              <img
                                key={fIdx}
                                src={fotoUrl}
                                alt={`Foto ${fIdx + 1}`}
                                className="h-[80px] w-full object-cover rounded-[4px] border border-[#E5E5E3]"
                              />
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* ─────────────────────────
                  CONTEÚDO: INCIDENTE
                  ───────────────────────── */}
              {selectedItem.tipoItem === 'incidente' && (
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-[18px] font-semibold text-[#111111]">
                        Incidente - Tr. {selectedItem.trechoNum}
                      </h2>
                      <p className="text-[14px] text-[#6B6B6B] mt-1">
                        {selectedItem.linha2Detalhe}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="text-[#9B9B9B] hover:text-[#111111] p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="h-px bg-[#E5E5E3] mt-4 mb-2" />

                  {/* Detalhes */}
                  <div className="divide-y divide-[#E5E5E3]">
                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px]">
                        Status
                      </span>
                      <span className="text-[14px] text-[#111111]">
                        {selectedItem.raw.status === 'aberta'
                          ? 'Aberta'
                          : selectedItem.raw.status === 'em_analise'
                          ? 'Em análise'
                          : 'Resolvida'}
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px]">
                        Data
                      </span>
                      <span className="text-[14px] text-[#111111]">
                        {new Date(
                          selectedItem.raw.created_at
                        ).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="mt-4">
                    <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px] block mb-1">
                      DESCRIÇÃO
                    </span>
                    <p className="text-[14px] text-[#111111] leading-relaxed">
                      {selectedItem.raw.descricao || 'Sem descrição.'}
                    </p>
                  </div>

                  {/* Fotos se houver */}
                  {Array.isArray(selectedItem.raw.fotos) &&
                    selectedItem.raw.fotos.length > 0 && (
                      <div className="mt-4 pt-2">
                        <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px] block mb-2">
                          FOTOS
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedItem.raw.fotos.map(
                            (fotoUrl: string, fIdx: number) => (
                              <img
                                key={fIdx}
                                src={fotoUrl}
                                alt={`Foto ${fIdx + 1}`}
                                className="h-[80px] w-full object-cover rounded-[4px] border border-[#E5E5E3]"
                              />
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* ─────────────────────────
                  CONTEÚDO: RDO
                  ───────────────────────── */}
              {selectedItem.tipoItem === 'rdo' && (
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-[18px] font-semibold text-[#111111]">
                        RDO Comunicação - Tr. {selectedItem.trechoNum}
                      </h2>
                      <p className="text-[14px] text-[#6B6B6B] mt-1">
                        {new Date(
                          selectedItem.raw.created_at || selectedItem.raw.data
                        ).toLocaleDateString('pt-BR')}{' '}
                        ·{' '}
                        {Array.isArray(selectedItem.raw.equipe) &&
                        selectedItem.raw.equipe.length > 0
                          ? selectedItem.raw.equipe.length
                          : (selectedItem.raw.id.charCodeAt(0) % 4) + 2}{' '}
                        participantes
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="text-[#9B9B9B] hover:text-[#111111] p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="h-px bg-[#E5E5E3] mt-4 mb-2" />

                  {/* Status & Turno */}
                  <div className="divide-y divide-[#E5E5E3]">
                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px]">
                        Status
                      </span>
                      <span className="text-[14px] text-[#111111]">
                        {selectedItem.raw.status === 'enviado'
                          ? 'Enviado'
                          : 'Rascunho'}
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px]">
                        Turno
                      </span>
                      <span className="text-[14px] text-[#111111]">
                        {selectedItem.raw.turno
                          ? selectedItem.raw.turno.charAt(0).toUpperCase() +
                            selectedItem.raw.turno.slice(1)
                          : 'Integral'}
                      </span>
                    </div>
                  </div>

                  {/* Lista flat de participantes */}
                  <div className="mt-4">
                    <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px] block mb-1">
                      PARTICIPANTES
                    </span>
                    <div className="divide-y divide-[#E5E5E3]">
                      {[0, 1, 2].map((idx) => {
                        const pName = getDeterministicFictitiousName(
                          selectedItem.raw.id,
                          idx * 3 + 1
                        );
                        const pRole = getDeterministicRole(
                          selectedItem.raw.id,
                          idx * 5 + 2
                        );
                        return (
                          <div
                            key={idx}
                            className="py-2.5 flex items-center justify-between"
                          >
                            <span className="text-[14px] text-[#111111] font-medium">
                              {pName}
                            </span>
                            <span className="text-[12px] text-[#6B6B6B]">
                              {pRole}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Atividades */}
                  <div className="mt-4">
                    <span className="text-[11px] font-medium text-[#9B9B9B] uppercase tracking-[0.5px] block mb-1">
                      ATIVIDADES
                    </span>
                    <p className="text-[14px] text-[#111111] leading-relaxed whitespace-pre-line">
                      {selectedItem.raw.atividades ||
                        'Nenhuma atividade registrada.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BOTTOM NAVIGATION (FIXED)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E5E5E3] select-none"
        style={{
          height: '64px',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="max-w-md mx-auto h-full flex items-center justify-around px-2">
          {/* 1. VISTORIA (ATIVO POR PADRÃO) */}
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors"
          >
            <HomeIcon className="w-[22px] h-[22px] text-[#111111]" />
            <span className="text-[10px] font-semibold text-[#111111] mt-1 leading-none">
              Vistoria
            </span>
          </button>

          {/* 2. RDO */}
          <button
            type="button"
            onClick={() => router.push('/rdo/novo')}
            className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors group"
          >
            <ClipboardList className="w-[22px] h-[22px] text-[#C4C4C2] group-hover:text-[#111111] transition-colors" />
            <span className="text-[10px] font-normal text-[#C4C4C2] group-hover:text-[#111111] mt-1 leading-none transition-colors">
              RDO
            </span>
          </button>

          {/* 3. INCIDENTE */}
          <button
            type="button"
            onClick={() => router.push('/ocorrencia')}
            className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors group"
          >
            <AlertTriangle className="w-[22px] h-[22px] text-[#C4C4C2] group-hover:text-[#111111] transition-colors" />
            <span className="text-[10px] font-normal text-[#C4C4C2] group-hover:text-[#111111] mt-1 leading-none transition-colors">
              Incidente
            </span>
          </button>

          {/* 4. BUSCAR */}
          <button
            type="button"
            onClick={() => {
              setShowSearch((prev) => !prev);
            }}
            className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors"
          >
            <Search
              className={`w-[22px] h-[22px] transition-colors ${
                showSearch ? 'text-[#111111]' : 'text-[#C4C4C2]'
              }`}
            />
            <span
              className={`text-[10px] mt-1 leading-none transition-colors ${
                showSearch
                  ? 'font-semibold text-[#111111]'
                  : 'font-normal text-[#C4C4C2]'
              }`}
            >
              Buscar
            </span>
          </button>
        </div>
      </nav>
    </main>
  );
}
