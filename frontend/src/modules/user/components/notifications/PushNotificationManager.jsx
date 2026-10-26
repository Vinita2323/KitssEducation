import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pushNotificationService } from '../../services/pushNotificationService';
export function PushNotificationManager() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.id || !pushNotificationService.isConfigured) return;
    let disposed = false, unsubscribe = () => {};
    pushNotificationService.setupForegroundHandler(() => {
      if (!disposed) window.dispatchEvent(new Event('kitss:notifications-changed'));
    }).then(fn => { if (disposed) fn(); else unsubscribe = fn; }).catch(() => {});
    return () => { disposed = true; unsubscribe(); };
  }, [user?.id]);
  return null;
}
