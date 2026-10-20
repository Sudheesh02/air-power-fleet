import React, { createContext, useContext, useState } from 'react';
import { answer, Reply } from './copilotEngine';

export type Msg = { id: string; role: 'user' | 'ai'; text: string; reply?: Reply; pending?: boolean };
type Ctx = { msgs: Msg[]; ask: (q: string) => Promise<Msg>; clear: () => void; busy: boolean };
const CopilotCtx = createContext<Ctx>({ msgs: [], ask: async () => ({ id: '', role: 'ai', text: '' }), clear: () => {}, busy: false });

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const ask = async (q: string) => {
    const id = `a${Date.now()}`;
    setBusy(true);
    setMsgs((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: q }, { id, role: 'ai', text: '', pending: true }]);
    const reply = await answer(q);
    const ai: Msg = { id, role: 'ai', text: reply.displayText, reply };
    setMsgs((m) => m.map((x) => (x.id === id ? ai : x)));
    setBusy(false);
    return ai;
  };
  return <CopilotCtx.Provider value={{ msgs, ask, clear: () => setMsgs([]), busy }}>{children}</CopilotCtx.Provider>;
}
export const useCopilot = () => useContext(CopilotCtx);
