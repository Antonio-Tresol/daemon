import { HarnessContent } from '@/features/harness/ui/HarnessContent';
import { Header } from '@/shared/ui/Header';

export default function HarnessPage() {
  return (
    <div>
      <Header
        title="Harness Engineering"
        subtitle="Failures, improvements, and optimization suggestions for your Claude Code harness"
        breadcrumbs={[{ label: 'Timeline', href: '/' }, { label: 'Harness' }]}
      />
      <HarnessContent />
    </div>
  );
}
