import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const buttonClass =
  'inline-flex items-center justify-center h-9 min-w-9 px-3 text-sm tracking-wider border rounded-sm transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed';

export const VideoPagination = ({ page, totalPages, onPageChange }: VideoPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Video pages" className="flex flex-wrap items-center justify-center gap-2 mt-10">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(buttonClass, 'gap-1 border-border text-muted-foreground hover:text-primary hover:border-primary/60')}
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Previous</span>
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onPageChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={cn(
            buttonClass,
            n === page
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:text-primary hover:border-primary/60',
          )}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={cn(buttonClass, 'gap-1 border-border text-muted-foreground hover:text-primary hover:border-primary/60')}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};
