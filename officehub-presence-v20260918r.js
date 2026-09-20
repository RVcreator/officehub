import { mt as supabase } from '/assets/v20260918r/button-Dy7fhsr_-oh20260903.js';

if (!window.__ohPresenceBoot) {
  window.__ohPresenceBoot = true;
  window.__OH_ONLINE_USER_IDS__ = new Set();

  let channel = null;
  let trackedUserId = null;

  const publishPresence = () => {
    const state = channel?.presenceState?.() ?? {};
    const onlineIds = Object.entries(state)
      .filter(([, sessions]) => Array.isArray(sessions) && sessions.length > 0)
      .map(([userId]) => userId);

    window.__OH_ONLINE_USER_IDS__ = new Set(onlineIds);
    window.dispatchEvent(new CustomEvent('oh-presence', {
      detail: { onlineIds },
    }));
  };

  const stopPresence = async () => {
    const previous = channel;
    channel = null;
    trackedUserId = null;
    window.__OH_ONLINE_USER_IDS__ = new Set();
    window.dispatchEvent(new CustomEvent('oh-presence', {
      detail: { onlineIds: [] },
    }));
    if (previous) {
      try {
        await supabase.removeChannel(previous);
      } catch (error) {
        console.warn('[OfficeHub presence] Could not close the previous channel.', error);
      }
    }
  };

  const startPresence = async (user) => {
    if (!user?.id || trackedUserId === user.id) return;
    if (channel) await stopPresence();

    trackedUserId = user.id;
    const activeChannel = supabase.channel('officehub-online-v1', {
      config: { presence: { key: user.id } },
    });
    channel = activeChannel;

    activeChannel
      .on('presence', { event: 'sync' }, publishPresence)
      .on('presence', { event: 'join' }, publishPresence)
      .on('presence', { event: 'leave' }, publishPresence)
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED' || channel !== activeChannel) return;
        try {
          await activeChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          publishPresence();
        } catch (error) {
          console.warn('[OfficeHub presence] Could not publish online status.', error);
        }
      });
  };

  supabase.auth.getSession()
    .then(({ data }) => startPresence(data?.session?.user))
    .catch((error) => console.warn('[OfficeHub presence] Session check failed.', error));

  supabase.auth.onAuthStateChange((_event, session) => {
    queueMicrotask(() => {
      if (session?.user) startPresence(session.user);
      else stopPresence();
    });
  });
}
