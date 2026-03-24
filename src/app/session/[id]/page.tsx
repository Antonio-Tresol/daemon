import { Header } from '@/shared/ui/Header';
import { SessionDetailContent } from '@/app/session/[id]/session-detail-content';

type SessionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = await params;

  return (
    <div>
      <Header
        title={`Session ${id.slice(0, 8)}`}
        subtitle="Session details, events, and console"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sessions', href: '/sessions' },
          { label: id.slice(0, 8) },
        ]}
      />
      <SessionDetailContent sessionId={id} />
    </div>
  );
}
