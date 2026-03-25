import { SessionList } from '@/features/session/ui/SessionList';
import { Header } from '@/shared/ui/Header';

export default function SessionsPage() {
  return (
    <div>
      <Header
        title="Sessions"
        subtitle="All Claude Code sessions"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Sessions' }]}
      />
      <SessionList />
    </div>
  );
}
