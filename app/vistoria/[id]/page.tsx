import { redirect } from 'next/navigation';

export default function VistoriaIdPage({ params }: { params: { id: string } }) {
  redirect(`/vistoria/${params.id}/status`);
}
