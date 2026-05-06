import type { Tweaks as TweaksType, SetTweak } from '@/types';
import { TweaksPanel, TweakSection, TweakRadio, TweakToggle } from './TweaksPanel';

export function Tweaks({ tweaks, setTweak }: { tweaks: TweaksType; setTweak: SetTweak }) {
  return (
    <TweaksPanel title="Cockpit Tweaks">
      <TweakSection label="Layout">
        <TweakRadio
          label="Density"
          value={tweaks.density}
          onChange={(v) => setTweak('density', v)}
          options={[
            { value: 'dense', label: 'Dense' },
            { value: 'comfortable', label: 'Comfort' },
            { value: 'loose', label: 'Loose' },
          ]}
        />
        <TweakRadio
          label="Sidebar"
          value={tweaks.sidebarGroup}
          onChange={(v) => setTweak('sidebarGroup', v)}
          options={[
            { value: 'by-status', label: 'Status' },
            { value: 'by-agent', label: 'Agents' },
          ]}
        />
      </TweakSection>
      <TweakSection label="Race surface">
        <TweakRadio
          label="Race style"
          value={tweaks.raceStyle}
          onChange={(v) => setTweak('raceStyle', v)}
          options={[
            { value: 'lanes', label: 'Lanes' },
            { value: 'cards', label: 'Cards' },
            { value: 'tape', label: 'Tape only' },
          ]}
        />
        <TweakRadio
          label="Accent"
          value={tweaks.accent}
          onChange={(v) => setTweak('accent', v)}
          options={[
            { value: 'restrained', label: 'Calm' },
            { value: 'confident', label: 'Confident' },
            { value: 'loud', label: 'Loud' },
          ]}
        />
      </TweakSection>
      <TweakSection label="Motion">
        <TweakToggle label="Live racing" value={tweaks.racing} onChange={(v) => setTweak('racing', v)} />
        <TweakToggle label="Cockpit scanline" value={tweaks.scanline} onChange={(v) => setTweak('scanline', v)} />
      </TweakSection>
      <TweakSection label="Issue state">
        <TweakToggle label="Has worktree" value={tweaks.hasWorktree} onChange={(v) => setTweak('hasWorktree', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}
