'use strict';
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { MetricLabLogo } from '@/components/brand/MetricLabLogo';
import { Button } from '@/components/ui/button';

export default function SplashPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden select-none pb-safe">
      {/* Glow radial sutil */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top: Logo MetricLab em SVG elegante */}
      <div className="w-full flex justify-center pt-6 z-10">
        <MetricLabLogo size="md" showText={true} />
      </div>

      {/* Center: "15 & 15" com tipografia refinada */}
      <div className="flex flex-col items-center justify-center text-center z-10 my-auto px-4">
        <div className="flex items-baseline justify-center tracking-tighter leading-none select-none">
          <span className="text-[110px] sm:text-[130px] font-black text-blue-500 drop-shadow-[0_0_35px_rgba(59,130,246,0.35)]">
            15
          </span>
          <span className="text-[52px] sm:text-[64px] font-bold text-slate-400 mx-2 sm:mx-3 -translate-y-2 opacity-80">
            &
          </span>
          <span className="text-[110px] sm:text-[130px] font-black text-white drop-shadow-[0_10px_25px_rgba(255,255,255,0.12)]">
            15
          </span>
        </div>

        {/* Subtítulo atualizado conforme solicitado: "Consorcio Pacote 15 e 19" */}
        <p className="text-sm sm:text-base uppercase tracking-[0.25em] font-semibold text-slate-400 mt-5">
          Consorcio Pacote 15 e 19
        </p>
        <span className="text-xs text-slate-500 font-medium tracking-wider uppercase mt-1">
          Vistoria Cautelar Inteligente
        </span>
      </div>

      {/* Bottom: Botão primário centralizado */}
      <div className="w-full max-w-[400px] flex flex-col items-center pb-8 z-10 px-2">
        <Button
          onClick={() => router.push('/login')}
          size="lg"
          fullWidth
          className="shadow-2xl shadow-blue-600/30"
        >
          <span>ENTRAR</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </main>
  );
}
