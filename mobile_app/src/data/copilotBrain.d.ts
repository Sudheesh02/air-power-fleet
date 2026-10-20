export declare const VOICE_SPEAKERS: { id: string; name: string; role: string; callsign: string }[];
export declare function prepareSpeechText(t: string): string;
export declare function queryVayuBrain(prompt: string, ctx?: any): { spokenText: string; displayText: string; formulaCard?: { title: string; formula: string }; suggestions: string[] };
