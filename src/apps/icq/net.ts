import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseUrl } from './config';
import { awayMaxLength, hasAwayMessage, statusOrder, type Status } from './data';
import type { Identity } from './types';

export type VisitorRow = { id: string; uin: string; nick: string; last_seen: string };
export type MessageRow = { id: number; sender: string; recipient: string; body: string; created_at: string };
export type Presence = { status: Status; awayMessage?: string };
export type PresenceMap = Record<string, Presence>;

function readPresence(meta: Record<string, unknown>): Presence | null {
  const status = meta.status as Status;
  if (!statusOrder.includes(status)) return null;
  const message = meta.awayMessage;
  return {
    status,
    awayMessage: hasAwayMessage(status) && typeof message === 'string' ? message.slice(0, awayMaxLength) : undefined,
  };
}

export type NetHandlers = {
  onVisitors: (rows: VisitorRow[]) => void;
  onPresence: (map: PresenceMap) => void;
  onMessage: (row: MessageRow) => void;
};

export type Connection = {
  myId: string;
  setStatus: (presence: Presence) => Promise<void>;
  send: (recipient: string, body: string) => Promise<MessageRow>;
  history: (peer: string) => Promise<MessageRow[]>;
  unreadSince: (since: string) => Promise<MessageRow[]>;
  refreshVisitors: () => Promise<void>;
  disconnect: () => Promise<void>;
};

export class UinTakenError extends Error {}

const retentionMs = 7 * 24 * 60 * 60 * 1000;
const heartbeatMs = 60_000;

let client: SupabaseClient | null = null;

function getClient() {
  client ??= createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { storageKey: 'sa85.icq.auth', persistSession: true, autoRefreshToken: true },
  });
  return client;
}

export async function hasSession() {
  const { data } = await getClient().auth.getSession();
  return Boolean(data.session);
}

async function ensureUser(captchaToken?: string) {
  const supabase = getClient();
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signedIn, error } = await supabase.auth.signInAnonymously({ options: { captchaToken } });
  if (error || !signedIn.user) throw error ?? new Error('anonymous sign-in failed');
  return signedIn.user.id;
}

export async function connect(identity: Identity, presence: Presence, handlers: NetHandlers, captchaToken?: string): Promise<Connection> {
  const supabase = getClient();
  const myId = await ensureUser(captchaToken);

  const touch = async () => {
    const { error } = await supabase
      .from('icq_visitors')
      .upsert({ id: myId, uin: identity.uin, nick: identity.nick, last_seen: new Date().toISOString() }, { onConflict: 'id' });
    if (error?.code === '23505') throw new UinTakenError(error.message);
    if (error) throw error;
  };

  const known = new Set<string>();
  const loadVisitors = async () => {
    const since = new Date(Date.now() - retentionMs).toISOString();
    const { data, error } = await supabase
      .from('icq_visitors')
      .select('id, uin, nick, last_seen')
      .gt('last_seen', since)
      .neq('id', myId)
      .order('last_seen', { ascending: false })
      .limit(100);
    if (error || !data) return;
    const rows = data as VisitorRow[];
    rows.forEach((row) => known.add(row.id));
    handlers.onVisitors(rows);
  };

  await touch();
  await loadVisitors();

  let current = presence;
  const lobby: RealtimeChannel = supabase.channel('icq-lobby', { config: { presence: { key: myId } } });

  const publishPresence = () => {
    const state = lobby.presenceState<Record<string, unknown>>();
    const map: PresenceMap = {};
    let unknown = false;
    for (const [id, metas] of Object.entries(state)) {
      if (id === myId) continue;
      const meta = metas[metas.length - 1];
      const entry = meta ? readPresence(meta) : null;
      if (entry) map[id] = entry;
      if (!known.has(id)) unknown = true;
    }
    handlers.onPresence(map);
    if (unknown) void loadVisitors();
  };

  lobby.on('presence', { event: 'sync' }, publishPresence);
  await new Promise<void>((resolve, reject) => {
    lobby.subscribe((state) => {
      if (state === 'SUBSCRIBED') resolve();
      if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') reject(new Error(`realtime ${state}`));
    });
  });

  const track = async () => {
    const { status, awayMessage } = current;
    if (status === 'invisible' || status === 'offline') await lobby.untrack();
    else if (hasAwayMessage(status) && awayMessage) await lobby.track({ status, awayMessage: awayMessage.slice(0, awayMaxLength) });
    else await lobby.track({ status });
  };
  await track();

  const inbox = supabase
    .channel(`icq-inbox-${myId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'icq_messages', filter: `recipient=eq.${myId}` },
      (payload) => handlers.onMessage(payload.new as MessageRow),
    )
    .subscribe();

  const heartbeat = window.setInterval(() => {
    void touch().catch(() => undefined);
    void loadVisitors();
  }, heartbeatMs);

  return {
    myId,
    setStatus: async (next) => {
      current = next;
      await track();
    },
    send: async (recipient, body) => {
      const { data, error } = await supabase
        .from('icq_messages')
        .insert({ sender: myId, recipient, body })
        .select('id, sender, recipient, body, created_at')
        .single();
      if (error || !data) throw error ?? new Error('send failed');
      return data as MessageRow;
    },
    history: async (peer) => {
      const { data, error } = await supabase
        .from('icq_messages')
        .select('id, sender, recipient, body, created_at')
        .or(`and(sender.eq.${myId},recipient.eq.${peer}),and(sender.eq.${peer},recipient.eq.${myId})`)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
    unreadSince: async (since) => {
      const { data } = await supabase
        .from('icq_messages')
        .select('id, sender, recipient, body, created_at')
        .eq('recipient', myId)
        .gt('created_at', since)
        .order('created_at', { ascending: true })
        .limit(200);
      return (data ?? []) as MessageRow[];
    },
    refreshVisitors: loadVisitors,
    disconnect: async () => {
      window.clearInterval(heartbeat);
      await lobby.untrack().catch(() => undefined);
      await supabase.removeChannel(lobby);
      await supabase.removeChannel(inbox);
    },
  };
}
