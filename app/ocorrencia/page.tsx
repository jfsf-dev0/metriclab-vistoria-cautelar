'use client';

import { useEffect } from 'react';

export default function OcorrenciaBridgePage() {
  useEffect(() => {
    window.location.href = 'https://rdo.metriclab.com.br/ocorrencia';
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[14px] text-[#111111] font-medium">Abrindo Registro de Ocorrência...</p>
      <a
        href="https://rdo.metriclab.com.br/ocorrencia"
        className="mt-4 text-[13px] text-[#9B9B9B] underline"
      >
        Clique aqui se não redirecionar automaticamente
      </a>
    </div>
  );
}
