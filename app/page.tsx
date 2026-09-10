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
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between items-center px-4 py-8 select-none pb-safe">
      {/* Top: Logo MetricLab SVG azul centralizado */}
      <div className="w-full flex justify-center pt-6">
        <MetricLabLogo size="lg" showText={true} />
      </div>

      {/* Center: Tipografia display centralizada */}
      <div className="flex flex-col items-center justify-center text-center my-auto px-4 w-full">
        <div className="flex items-baseline justify-center tracking-tight leading-none select-none">
          <span className="text-8xl font-black text-blue-600 font-sans">
            15
          </span>
          <span className="text-5xl font-light text-gray-400 mx-4 font-sans">
            &
          </span>
          <span className="text-8xl font-black text-gray-900 font-sans">
            15
          </span>
        </div>

        {/* Subtítulo */}
        <p className="text-gray-500 text-lg font-medium mt-2">
          Vistoria Cautelar
        </p>

        {/* Linha divisória */}
        <div className="border-t border-gray-200 my-8 w-full max-w-sm" />

        {/* Botão ENTRAR */}
        <div className="w-full max-w-sm">
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl py-4 text-base min-h-[48px] shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>ENTRAR</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Rodapé */}
      <footer className="text-gray-400 text-xs text-center pb-8">
        MetricLab Inteligência Operacional
      </footer>
    </main>
  );
}
