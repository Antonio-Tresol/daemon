import { Header } from '@/shared/ui/Header';
import { ImprovementsList } from '@/features/improvements/ui/ImprovementsList';

export default function ImprovementsPage() {
  return (
    <div>
      <Header
        title="Improvements"
        subtitle="Suggestions to optimize your Claude Code workflow"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Improvements' },
        ]}
      />
      <ImprovementsList />
    </div>
  );
}
