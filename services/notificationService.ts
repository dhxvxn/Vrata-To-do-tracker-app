// Thin wrapper over the browser Notifications API. Client-side only.

export const notificationsSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window;

export const isGranted = (): boolean =>
  notificationsSupported() && Notification.permission === 'granted';

export const requestPermission = async (): Promise<boolean> => {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

// Show a notification via the service worker registration when available (more
// reliable, works from a background tab), falling back to a page Notification.
export const showNotification = async (title: string, body?: string): Promise<void> => {
  if (!isGranted()) return;
  const options: NotificationOptions = { body };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) { await reg.showNotification(title, options); return; }
    }
  } catch { /* fall back below */ }
  try { new Notification(title, options); } catch { /* ignore */ }
};
