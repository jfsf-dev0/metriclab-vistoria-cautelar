'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { setSession } from '@/lib/auth';
import { Phone, Lock, ArrowRight } from 'lucide-react';
import { MetricLabLogo } from '@/components/brand/MetricLabLogo';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';

export default function LoginPage() {
  const router = useRouter();
  const [telefone, setTelefone] = useState('');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastErro, setToastErro] = useState<string | null>(null);

  // Phone mask: +55 (00) 00000-0000
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const cleaned = digits.startsWith('55') && digits.length > 2 ? digits.slice(2) : digits;
    const ddd = cleaned.slice(0, 2);
    const part1 = cleaned.slice(2, 7);
    const part2 = cleaned.slice(7, 11);
    if (!cleaned) return '';
    if (cleaned.length <= 2) return `+55 (${cleaned}`;
    if (cleaned.length <= 7) return `+55 (${ddd}) ${part1}`;
    return `+55 (${ddd}) ${part1}-${part2}`;
  };

  const toCleanPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastErro(null);

    const cleanTel = toCleanPhone(telefone);
    const cleanKey = chaveAcesso.trim();

    if (!cleanTel || cleanTel.length < 12) {
      setToastErro('Informe um telefone válido com DDD.');
      return;
    }

    if (!cleanKey || cleanKey.length < 6) {
      setToastErro('A chave de acesso deve conter 6 dígitos.');
      return;
    }

    setLoading(true);

    try {
      // Busca em demo_lote15_leads WHERE telefone = input AND chave_acesso = input AND status != 'expirado'
      const { data, error } = await supabase
        .from('demo_lote15_leads')
        .select('id, nome, telefone, chave_acesso, status')
        .eq('telefone', cleanTel)
        .eq('chave_acesso', cleanKey)
        .neq('status', 'expirado')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        setToastErro('Telefone ou chave de acesso inválidos.');
        setLoading(false);
        return;
      }

      // Salva sessão
      setSession({
        lead_id: data.id,
        telefone: data.telefone,
        nome: data.nome,
      });

      // Redireciona para /trechos
      router.push('/trechos');
    } catch (err: any) {
      console.error('Erro de login:', err);
      setToastErro(err.message || 'Telefone ou chave de acesso inválidos.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between p-4 sm:p-6 select-none relative pb-safe">
      <div className="w-full max-w-sm mx-auto my-auto py-6">
        {/* Logo MetricLab pequeno acima do card */}
        <div className="flex justify-center mb-6">
          <MetricLabLogo size="md" showText={true} />
        </div>

        {/* Card central */}
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mx-4 space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Acesso
            </h1>
            <p className="text-sm text-gray-500">
              Use as credenciais enviadas via WhatsApp
            </p>
          </div>

          {toastErro && (
            <Toast
              message={toastErro}
              variant="error"
              onClose={() => setToastErro(null)}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Telefone */}
            <Input
              label="Telefone (+55)"
              type="tel"
              required
              value={telefone}
              onChange={(e) => setTelefone(formatPhone(e.target.value))}
              placeholder="+55 (11) 99999-0001"
              leftIcon={<Phone className="w-4 h-4" />}
            />

            {/* Campo Chave de Acesso */}
            <Input
              label="Chave de Acesso (6 dígitos)"
              type="password"
              required
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              value={chaveAcesso}
              onChange={(e) => setChaveAcesso(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            {/* Botão Primário Full-Width */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl px-6 py-3 min-h-[48px] w-full transition-all duration-200 shadow-sm"
              >
                {!loading && (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Texto auxiliar */}
          <p className="text-xs text-center text-gray-400 pt-1 leading-relaxed">
            MetricLab • Inteligência Operacional
          </p>
        </Card>
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-2 text-xs text-gray-400">
        MetricLab • Consórcio Pacote 15 e 19
      </footer>
    </main>
  );
}
