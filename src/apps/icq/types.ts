import type { Status } from './data';

export type GroupId = 'friends' | 'visitors' | 'agents';

export type ContactKind = 'agent' | 'visitor';

export type Contact = {
  /** `agent:<id>` oder `visitor:<uuid>` */
  key: string;
  kind: ContactKind;
  /** Agent-ID oder Supabase-User-ID */
  id: string;
  nick: string;
  uin: string;
  status: Status;
  statusText?: string;
  lastSeen?: string;
};

export type Line = { id: string; from: 'me' | 'them'; text: string; at: number };

export type Identity = { uin: string; nick: string };
