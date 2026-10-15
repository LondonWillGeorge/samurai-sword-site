import { useState, ReactNode } from 'react';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VideoSeries } from '@/lib/publicVideos';

interface VideoSeriesMenuProps {
  series: VideoSeries[];
  counts: Record<string, number>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  // Admin page hooks: extra controls beside each title, a replacement for a
  // title row (e.g. while renaming), and content below the list.
  renderActions?: (series: VideoSeries, index: number) => ReactNode;
  renderOverride?: (series: VideoSeries, index: number) => ReactNode | null;
  footer?: ReactNode;
}

// Collapsible list of video series. On desktop it is a left-hand panel that
// shrinks to a narrow strip; on mobile it sits above the videos as a dropdown.
export const VideoSeriesMenu = ({
  series,
  counts,
  selectedId,
  onSelect,
  renderActions,
  renderOverride,
  footer,
}: VideoSeriesMenuProps) => {
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const selectedTitle = series.find(s => s.id === selectedId)?.title;
  const headerLabel = open ? 'CLICK HERE TO COLLAPSE' : 'CLICK FOR FULL VIDEOS MENU';

  const handleSelect = (id: string) => {
    onSelect(id);
    if (!window.matchMedia('(min-width: 768px)').matches) setOpen(false);
  };

  return (
    <aside
      className={cn(
        'w-full shrink-0 self-start md:sticky md:top-24 transition-[width] duration-300',
        open ? 'md:w-64' : 'md:w-12',
      )}
    >
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          title={open ? 'Hide series menu' : 'Show series menu'}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-primary transition-colors',
            !open && 'md:flex-col md:px-0 md:py-4',
          )}
        >
          {/* Mobile header */}
          <span className="md:hidden flex-1 min-w-0 text-left">
            <span className="block text-primary tracking-[0.3em] text-xs">{headerLabel}</span>
            {!open && selectedTitle && (
              <span className="block text-sm tracking-wider text-foreground truncate mt-1">{selectedTitle}</span>
            )}
          </span>
          <ChevronDown size={16} className={cn('md:hidden transition-transform duration-200', open && 'rotate-180')} />

          {/* Desktop header */}
          {open ? (
            <>
              <span className="hidden md:block flex-1 text-left text-primary tracking-[0.3em] text-xs">{headerLabel}</span>
              <PanelLeftClose size={16} className="hidden md:block" />
            </>
          ) : (
            <>
              <PanelLeftOpen size={16} className="hidden md:block" />
              <span className="hidden md:block text-primary tracking-[0.3em] text-xs [writing-mode:vertical-rl]">
                {headerLabel}
              </span>
            </>
          )}
        </button>

        {open && (
          <div className="border-t border-border py-2">
            {series.length === 0 && (
              <p className="px-4 py-2 text-sm text-muted-foreground tracking-wider">No series yet.</p>
            )}
            <ul>
              {series.map((s, index) => {
                const override = renderOverride?.(s, index);
                if (override) return <li key={s.id}>{override}</li>;
                const active = s.id === selectedId;
                return (
                  <li
                    key={s.id}
                    className={cn(
                      'group flex items-center border-l-2 transition-colors',
                      active ? 'border-primary bg-secondary' : 'border-transparent hover:bg-secondary',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(s.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex-1 min-w-0 flex items-baseline gap-2 px-4 py-2 text-left text-sm tracking-wider transition-colors',
                        active ? 'text-primary' : 'text-muted-foreground hover:text-primary',
                      )}
                    >
                      <span className="flex-1 min-w-0 break-words">{s.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{counts[s.id] ?? 0}</span>
                    </button>
                    {renderActions && <div className="shrink-0 flex items-center pr-2">{renderActions(s, index)}</div>}
                  </li>
                );
              })}
            </ul>
            {footer && <div className="border-t border-border mt-2 pt-3 px-3 pb-1">{footer}</div>}
          </div>
        )}
      </div>
    </aside>
  );
};
