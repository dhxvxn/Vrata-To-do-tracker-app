import React from 'react';
import { LogIn, LogOut, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import type { User } from 'firebase/auth';

interface AuthControlProps {
  configured: boolean;
  user: User | null;
  loading: boolean;
  syncing: boolean;
  error?: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

// Sidebar account + sync status. Hidden entirely when Firebase isn't configured.
export const AuthControl: React.FC<AuthControlProps> = ({
  configured, user, loading, syncing, error, onSignIn, onSignOut,
}) => {
  if (!configured) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-xs text-zinc-600">
        <RefreshCw size={14} className="animate-spin" /> Connecting…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-1">
        <button
          onClick={onSignIn}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-textMuted hover:text-white hover:bg-surfaceHighlight transition-all"
        >
          <LogIn size={18} />
          Sign in to sync
        </button>
        {error && <p className="px-4 text-[10px] text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 rounded-lg bg-surface border border-border">
      <div className="flex items-center gap-3">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">
            {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs text-zinc-200 truncate">{user.displayName || user.email}</div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            {syncing ? <><RefreshCw size={9} className="animate-spin" /> Syncing…</> : <><Cloud size={9} /> Synced</>}
          </div>
        </div>
        <button onClick={onSignOut} title="Sign out" className="text-zinc-600 hover:text-red-400 p-1">
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
};
