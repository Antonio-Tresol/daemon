import { Header } from '@/shared/ui/Header';
import { TimelineContent } from '@/app/timeline/timeline-content';

export default function TimelinePage() {
  return (
    <div>
      <Header
        title="Matryoshka Timelines"
        subtitle="Nested views of session activity — zoom from events to narrative"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Timeline' },
        ]}
      />
      <TimelineContent />
    </div>
  );
}
