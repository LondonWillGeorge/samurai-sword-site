import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface RegisteredEmailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Member {
  email: string;
  // Set only for currently banned members; the list puts them last.
  disabled_until: string | null;
}

// A ban ending further away than this is shown as "Forever". Disabling someone
// permanently means setting banned_until far in the future (e.g. 2999-12-31),
// since auth.users.banned_until is a timestamp and can't hold a word.
const FOREVER_AFTER_YEARS = 50;

const formatDisabledUntil = (value: string) => {
  const date = new Date(value);
  const foreverFrom = new Date();
  foreverFrom.setFullYear(foreverFrom.getFullYear() + FOREVER_AFTER_YEARS);
  // Postgres 'infinity' arrives as the string "infinity", an invalid Date.
  if (isNaN(date.getTime()) || date > foreverFrom) return 'Forever';
  return date.toLocaleDateString('en-GB', { dateStyle: 'medium' });
};

export const RegisteredEmailsDialog = ({ open, onOpenChange }: RegisteredEmailsDialogProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refetch each time it opens, so newly accepted invites show up.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    supabase.rpc('list_registered_emails').then(({ data, error }) => {
      if (cancelled) return;
      setIsLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setMembers(data ?? []);
      }
    });
    return () => { cancelled = true; };
  }, [open]);

  const disabledCount = members.filter(m => m.disabled_until).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading tracking-wider">Registered Emails</DialogTitle>
          <DialogDescription>
            Members who have accepted their invite and signed in at least once.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : error ? (
          <p className="text-sm text-destructive">Could not load emails: {error}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {members.length} registered{disabledCount > 0 && `, ${disabledCount} disabled`}
            </p>
            <div className="max-h-80 overflow-y-auto border border-border rounded-sm">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">Disabled Until</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map(({ email, disabled_until }) => (
                    <tr key={email} className={disabled_until ? 'text-destructive' : undefined}>
                      <td className="px-3 py-2 break-all">{email}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {disabled_until ? formatDisabledUntil(disabled_until) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
