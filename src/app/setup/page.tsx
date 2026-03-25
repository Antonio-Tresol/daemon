import { Header } from '@/shared/ui/Header';
import { LatentDivergence } from '@/shared/ui/LatentDivergence';

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="border border-border bg-depth-1 rounded-md border-l-2 border-l-ember overflow-hidden">
      {title && (
        <div className="border-b border-border px-4 py-2">
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-text-muted">{title}</span>
        </div>
      )}
      <pre className="px-4 py-3 text-xs text-text-primary/80 font-mono overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
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
        subtitle="Instrument your Claude Code sessions to monitor them in the Command Center"
        breadcrumbs={[
          { label: 'Timeline', href: '/' },
          { label: 'Setup' },
        ]}
      />

      {/* Hero art */}
      <div className="relative mb-8 overflow-hidden rounded-lg border border-border">
        <LatentDivergence variant="hero" height={200} agentCount={300} />
        <div className="absolute inset-0 bg-gradient-to-t from-depth-0 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4">
          <p className="font-serif italic text-sm text-text-primary/80">Latent Divergence</p>
          <p className="font-mono text-[9px] text-text-muted">Neural agents in feature space — alignment is a landscape, not a switch</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-8">
        <div className="border border-ember/20 bg-ember/5 rounded-lg p-4">
          <p className="text-xs text-text-primary/80 leading-relaxed">
            The Command Center monitors Claude Code sessions by installing lightweight HTTP hooks
            that post events to this server. Your existing hooks and settings are preserved — the
            install merges safely. Uninstall removes only Command Center hooks.
          </p>
        </div>

        <Step number={1} title="Start the Command Center">
          <p>Make sure this server is running. If you&apos;re reading this, it already is.</p>
          <CodeBlock title="Terminal">{`cd /path/to/Claude-Command-Center\nnpm run dev`}</CodeBlock>
        </Step>

        <Step number={2} title="Install hooks">
          <p>
            Run the onboard script from the Command Center directory. This merges HTTP hooks into
            your global Claude Code settings without touching your existing hooks.
          </p>
          <CodeBlock title="Terminal">{`bash scripts/onboard.sh`}</CodeBlock>
          <p className="text-[10px] text-text-muted">
            This runs setup-hooks.sh + setup-otel.sh and verifies the server is reachable.
            A backup of your settings is created automatically.
          </p>
        </Step>

        <Step number={3} title="Restart Claude Code">
          <p>
            Hooks are loaded at session start. Open a new Claude Code session in any terminal
            and your events will start flowing into the Command Center automatically.
          </p>
          <CodeBlock title="Any terminal, any directory">{`claude`}</CodeBlock>
        </Step>

        <Step number={4} title="Verify">
          <p>Run the verification script to confirm everything is connected:</p>
          <CodeBlock title="Terminal">{`bash scripts/verify-setup.sh`}</CodeBlock>
          <p>You should see all three checks pass: hooks installed, OTel configured, server reachable.</p>
        </Step>

        <div className="border-t border-border pt-8 space-y-4">
          <h3 className="text-sm font-medium text-text-primary">Uninstall</h3>
          <p className="text-xs text-text-primary/70 leading-relaxed">
            To remove Command Center monitoring, run the uninstall script. This surgically removes
            only the Command Center hooks — your other hooks and settings are untouched.
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
            <code className="mx-1 bg-depth-1 rounded-sm px-1.5 py-0.5 text-ember font-mono text-[10px]">/harness</code>
            skill to read failures and improvement suggestions, or curl the API directly:
          </p>
          <CodeBlock title="Agent-friendly endpoints">{`# Discovery\ncurl localhost:3000/api/agent\n\n# Sessions\ncurl localhost:3000/api/agent/sessions\n\n# Timeline (with Matryoshka levels)\ncurl 'localhost:3000/api/agent/timeline?sessionId=SESSION_ID&level=0'\n\n# Failures\ncurl 'localhost:3000/api/agent/failures?sessionId=SESSION_ID'\n\n# Improvements\ncurl 'localhost:3000/api/agent/improvements?sessionId=SESSION_ID'`}</CodeBlock>
        </div>
      </div>
    </div>
  );
}
