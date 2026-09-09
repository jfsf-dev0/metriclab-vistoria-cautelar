'use strict';
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function SplashPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-between items-center px-6 py-8 relative overflow-hidden select-none">
      {/* Subtle background glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top: Logo MetricLab centralizado */}
      <div className="w-full flex justify-center pt-8 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-blue-500/30">
            ML
          </div>
          <span className="text-sm font-extrabold uppercase tracking-widest text-slate-200">
            MetricLab
          </span>
        </div>
      </div>

      {/* Center: Números Grandes Estilizados "15 & 15" e Subtítulo */}
      <div className="flex flex-col items-center justify-center text-center z-10 my-auto">
        <div className="flex items-baseline justify-center tracking-tighter leading-none select-none">
          <span className="text-[120px] font-black text-[#2563eb] drop-shadow-[0_10px_20px_rgba(37,99,235,0.3)]">
            15
          </span>
          <span className="text-[60px] font-bold text-slate-400 mx-2 -translate-y-2">
            &
          </span>
          <span className="text-[120px] font-black text-white drop-shadow-[0_10px_20px_rgba(255,255,255,0.15)]">
            15
          </span>
        </div>

        <p className="text-base sm:text-lg uppercase tracking-[0.25em] font-semibold text-slate-400 mt-4">
          Vistoria Cautelar
        </p>
      </div>

      {/* Bottom: Botão grande ENTRAR */}
      <div className="w-full max-w-[400px] flex flex-col items-center pb-12 z-10">
        <button
          onClick={() => router.push('/login')}
          className="w-full min-h-[56px] bg-[#2563eb] hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-base uppercase tracking-wider rounded-xl shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-3 transition duration-200 cursor-pointer"
        >
          <span>ENTRAR</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </main>
  );
}
