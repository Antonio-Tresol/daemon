import { Header } from '@/shared/ui/Header';
import { TimelineContent } from '@/app/timeline/timeline-content';

export default function TimelinePage() {
  return (
    <div>
      <Header
        title="Timeline"
        subtitle="Structured view of session plans and tasks"
      />
      <TimelineContent />
    </div>
  );
}
