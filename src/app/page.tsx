import { Header } from '@/shared/ui/Header';
import { DashboardContent } from '@/app/dashboard-content';

export default function DashboardPage() {
  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Monitor your Claude Code sessions in real-time"
      />
      <DashboardContent />
    </div>
  );
}
