import { Header } from '@/shared/ui/Header';
import { FailureTimeline } from '@/features/failures/ui/FailureTimeline';

export default function FailuresPage() {
  return (
    <div>
      <Header
        title="Failures"
        subtitle="Identified errors and their root causes"
        breadcrumbs={[
          { label: 'Timeline', href: '/' },
          { label: 'Failures' },
        ]}
      />
      <FailureTimeline />
    </div>
  );
}
