import React, { createContext, useContext, useState } from 'react';
import { queryVayuBrain } from '../data/copilotBrain';

export type Msg = { id: string; role: 'user' | 'ai'; text: string; reply?: ReturnType<typeof queryVayuBrain> };
type Ctx = { msgs: Msg[]; ask: (q: string) => Msg; clear: () => void };
const CopilotCtx = createContext<Ctx>({ msgs: [], ask: () => ({ id: '', role: 'ai', text: '' }), clear: () => {} });

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const ask = (q: string) => {
    const reply = queryVayuBrain(q);
    const ai: Msg = { id: `a${Date.now()}`, role: 'ai', text: reply.displayText, reply };
    setMsgs((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: q }, ai]);
    return ai;
  };
  return <CopilotCtx.Provider value={{ msgs, ask, clear: () => setMsgs([]) }}>{children}</CopilotCtx.Provider>;
}
export const useCopilot = () => useContext(CopilotCtx);
