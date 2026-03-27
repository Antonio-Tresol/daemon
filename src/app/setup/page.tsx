import { Header } from '@/shared/ui/Header';
import { LatentDivergence } from '@/shared/ui/LatentDivergence';

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="border border-border bg-depth-1 rounded-md border-l-2 border-l-ember overflow-hidden">
      {title && (
        <div className="border-b border-border px-4 py-2">
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-text-muted">
            {title}
          </span>
        </div>
      )}
      <pre className="px-4 py-3 text-xs text-text-primary/80 font-mono overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-depth-0 rounded-md border border-ember/30 text-sm font-mono font-bold text-ember">
        {number}
      </div>
      <div className="flex-1 space-y-3">
        <h3 className="text-base font-serif italic text-text-primary">{title}</h3>
        <div className="space-y-2 text-xs text-text-primary/70 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <div>
      <Header
        title="Setup"
        subtitle="Instrument your Claude Code sessions to monitor them in daemon"
        breadcrumbs={[{ label: 'Timeline', href: '/' }, { label: 'Setup' }]}
      />

      {/* Hero art */}
      <div className="relative mb-8 overflow-hidden rounded-lg border border-border">
        <LatentDivergence variant="hero" height={200} agentCount={300} />
        <div className="absolute inset-0 bg-gradient-to-t from-depth-0 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4">
          <p className="font-serif italic text-sm text-text-primary/80">Latent Divergence</p>
          <p className="font-mono text-[9px] text-text-muted">
            Neural agents in feature space — alignment is a landscape, not a switch
          </p>
        </div>
      </div>

      <div className="max-w-2xl space-y-8">
        <div className="border border-ember/20 bg-ember/5 rounded-lg p-4">
          <p className="text-xs text-text-primary/80 leading-relaxed">
            daemon monitors Claude Code sessions via a plugin that installs lightweight HTTP hooks.
            Events stream to this server automatically. Your existing hooks and settings are
            preserved. To stop monitoring, just stop loading the plugin.
          </p>
        </div>

        <Step number={1} title="Start daemon">
          <p>Make sure this server is running. If you&apos;re reading this, it already is.</p>
          <CodeBlock title="Terminal">{`cd /path/to/daemon\nnpm run dev`}</CodeBlock>
        </Step>

        <Step number={2} title="Install the plugin">
          <p>
            Load the daemon plugin to auto-install hooks and skills. No manual configuration
            needed — hooks activate immediately.
          </p>
          <CodeBlock title="Terminal">{`claude --plugin-dir /path/to/daemon/plugin`}</CodeBlock>
          <p className="text-[10px] text-text-muted">
            This registers 7 HTTP hooks and 3 skills (/daemon:harness, /daemon:analyze,
            /daemon:session). Your existing hooks and settings are preserved.
          </p>
          <p className="text-[10px] text-text-muted mt-1">
            Alternative: run <code className="bg-depth-1 rounded-sm px-1 py-0.5 text-ember">bash scripts/onboard.sh</code> to
            install hooks globally without the plugin.
          </p>
        </Step>

        <Step number={3} title="Start a session">
          <p>
            Open a Claude Code session with the plugin loaded. Events flow to daemon automatically.
          </p>
          <CodeBlock title="Any terminal, any directory">{`claude --plugin-dir /path/to/daemon/plugin`}</CodeBlock>
          <p className="text-[10px] text-text-muted">
            Use /daemon:analyze to trigger session analysis, /daemon:harness to review improvements.
          </p>
        </Step>

        <Step number={4} title="Verify">
          <p>Check that events are arriving:</p>
          <CodeBlock title="Terminal">{`curl -s localhost:3000/api/agent/sessions | jq '.data'`}</CodeBlock>
          <p>
            You should see your session with events. Open the daemon UI at localhost:3000 to
            visualize your session timeline.
          </p>
        </Step>

        <div className="border-t border-border pt-8 space-y-4">
          <h3 className="text-sm font-medium text-text-primary">Uninstall</h3>
          <p className="text-xs text-text-primary/70 leading-relaxed">
            Simply stop using the --plugin-dir flag. If you installed hooks globally via the
            onboard script, run the uninstall script to remove them:
          </p>
          <CodeBlock title="Terminal">{`bash scripts/uninstall-hooks.sh`}</CodeBlock>
        </div>

        <div className="border-t border-border pt-8 space-y-4">
          <h3 className="text-sm font-medium text-text-primary">What gets captured</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { event: 'SessionStart', desc: 'Session begins' },
              { event: 'SessionEnd', desc: 'Session terminates' },
              { event: 'PostToolUse', desc: 'Every tool call (Read, Edit, Bash, etc.)' },
              { event: 'PostToolUseFailure', desc: 'Tool failures and errors' },
              { event: 'Stop', desc: 'Claude finishes responding' },
              { event: 'SubagentStart/Stop', desc: 'Agent team activity' },
            ].map((item) => (
              <div key={item.event} className="border border-border bg-depth-1 rounded-lg p-3">
                <p className="text-[10px] font-mono text-ember">{item.event}</p>
                <p className="mt-0.5 text-[10px] text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-8 space-y-4">
          <h3 className="text-sm font-medium text-text-primary">Agent API</h3>
          <p className="text-xs text-text-primary/70 leading-relaxed">
            Claude Code sessions can query their own monitoring data programmatically. Use the
            <code className="mx-1 bg-depth-1 rounded-sm px-1.5 py-0.5 text-ember font-mono text-[10px]">
              /daemon:harness
            </code>
            skill to read failures and improvement suggestions, or curl the API directly:
          </p>
          <CodeBlock title="Agent-friendly endpoints">{`# Discovery\ncurl localhost:3000/api/agent\n\n# Sessions\ncurl localhost:3000/api/agent/sessions\n\n# Timeline (with Matryoshka levels)\ncurl 'localhost:3000/api/agent/timeline?sessionId=SESSION_ID&level=0'\n\n# Failures\ncurl 'localhost:3000/api/agent/failures?sessionId=SESSION_ID'\n\n# Improvements\ncurl 'localhost:3000/api/agent/improvements?sessionId=SESSION_ID'`}</CodeBlock>
        </div>
      </div>
    </div>
  );
}
