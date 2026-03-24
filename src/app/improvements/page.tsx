import { Header } from '@/shared/ui/Header';
import { ImprovementsList } from '@/features/improvements/ui/ImprovementsList';

export default function ImprovementsPage() {
  return (
    <div>
      <Header
        title="Harness Engineering"
        subtitle="Hooks, skills, subagents, tools, and context improvements for your Claude Code harness"
        breadcrumbs={[
          { label: 'Timeline', href: '/' },
          { label: 'Harness' },
        ]}
      />
      <ImprovementsList />
    </div>
  );
}
