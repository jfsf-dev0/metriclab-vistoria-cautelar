'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrechosPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
