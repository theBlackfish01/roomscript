/** Shared, platform-free contracts. Coordinates are centimeters; time costs are minutes. */
export type Id = string;
export type Vec3 = [number, number, number];
export type Origin = "vision" | "manual" | "simulated" | "fixture" | "substitution";
export type ObjectType = "cord" | "blunt" | "sharp" | "poison" | "heavy" | "light" | "clock" | "door" | "screen" | "mirror" | "plant" | "container" | "soft" | "kettle" | "cup";
export interface Zone { id: Id; label: string; clueName: string; anchor: Vec3; }
export interface RoomObject { id: Id; label: string; type: ObjectType; zone: Id; pos: Vec3; affordances: string[]; origin: Origin; confidence?: number; virtual?: boolean; synonyms?: string[]; }
export interface RoomScan { schema: 1; roomId: string; source: Origin; zones: Zone[]; objects: RoomObject[]; }
export interface Hypothesis { who: Id; where: Id; what: Id; }
export type Predicate = "at" | "not_at" | "touched" | "not_touched" | "in" | "not_in" | "state" | "saw" | "heard" | "owns" | "motive" | "before" | "eliminates";
export interface Fact {
  id: Id; pred: Predicate; args: Record<string, string | number | boolean>;
  slot?: number; slotRange?: [number, number]; truth: boolean;
  canonical?: string; entities?: Id[]; suspicious?: boolean;
}
export type Tell = "gaze_snap" | "flicker" | "hesitation" | "ring_spike";
export type RelationType = "ally" | "rival" | "lover" | "sibling" | "debtor" | "employer" | "stranger";
export interface Suspect {
  id: Id; name: string; nicknames: string[]; persona: string; voice: string; actingNotes: string;
  tell: Tell; tellProp: string; composureMax: number; secret: string;
  relations: {to: Id; type: RelationType}[]; traits?: string[];
  baseline: {truthTopic: string; lieTopic: string};
}
export interface Witnessing { witness: Id; fact: Id; channel: "sight" | "sound" | "time" | "presence" | "state" | "record"; }
export type EvidenceKind = "object_memory" | "letter" | "voicemail" | "receipt" | "photo" | "moved_object";
export interface Evidence {
  id: Id; holder: Id; kind: EvidenceKind; proves: Id[]; canonical: string;
  entities: Id[]; latent?: boolean; beat?: Id; costMinutes?: number;
}
export type Stance = "truth" | "cover";
export interface Statement {
  id: Id; speaker: Id; topic: string; asserts: Id | Id[]; stance: Stance; layer: number;
  canonical: string; entities: Id[]; about?: Id; breakers: Id[][]; onBreak?: Id;
  pressed?: {canonical: string; entities: Id[]}; costMinutes?: number;
}
export interface RefutationCard { eliminates: Id; via: Id; }
export type BeatType = "latent_letter" | "voicemail" | "suspect_wants_to_leave" | "blackout" | "body_moved" | "object_moved";
export interface Beat {
  id: Id; type: BeatType; reveals: Id[]; minute: number; guaranteed: boolean;
  validated: boolean; pressureMinutes?: number; requires?: Id[]; canonical: string;
  /** Only monotonic evidence additions; never remove witnessed facts. */
  addsFacts?: Fact[];
}
export type DeductionType = "opportunity" | "means" | "alibi_broken" | "motive" | "timeline";
export interface RequiredDeduction { id: Id; type: DeductionType; subject: Id; supports: Id[][]; canonical: string; }
export type SolverCode = "NOT_UNIQUE" | "ROUTES_LT_2" | "LIE_UNBREAKABLE" | "SHORTCUT" | "HERRING_HARMFUL" | "MIN_ROUTE_TOO_LONG" | "BEAT_BREAKS_SOLVABILITY" | "INCONSISTENT_TRUTHS";
export interface SolverIssue { code: SolverCode; subject?: Id; message: string; }
export interface SolverReport {
  ok: boolean; unique: boolean; hypotheses: Hypothesis[]; issues: SolverIssue[];
  routesPerElimination: Record<Id, number>; lieBreakable: Record<Id, number>;
  minRouteMinutes: number; minRoute: Id[]; clockMinutes: number; slack: number;
}
export interface CaseGraph {
  schema: 1; caseId: string; seed: number; pitchHash: string; compilerVersion: string;
  room: RoomScan; slots: string[]; murderSlot: number; bodyFound: string;
  envelope: Hypothesis; cast: {victim: {id: Id; name: string}; suspects: Suspect[]};
  weapons: Id[]; facts: Fact[]; witnessing: Witnessing[]; evidence: Evidence[];
  statements: Statement[]; refutation: {order: Id[]; cards: Record<Id, RefutationCard[]>};
  beats: Beat[]; requiredDeductions: RequiredDeduction[]; clockMinutes: number;
  solver?: SolverReport; era: string;
}
export interface PlayerKnowledge { factIds: Id[]; evidenceIds: Id[]; statementIds: Id[]; }
export type AnswerMode = "answer" | "press" | "deflect" | "broken" | "lawyered" | "filler" | "confession";
export type Emotion = "calm" | "guarded" | "irritated" | "rattled" | "smug" | "grieving";
/** The only fields admitted from performed model prose. No truth/verdict/tell fields. */
export interface Answer { topic: string; cites: string[]; line: string; emotion: Emotion; }
export interface SheetRef { ref: string; topic?: string; text: string; entities: Id[]; source?: string; of?: string; }
export interface FactSheet {
  suspect: Id; name: string; persona: string; era: string;
  mood: {composure: number; composureMax: number; rapport: number; respect: number; emotion: Emotion};
  account: SheetRef[]; pressed: SheetRef[]; knows: SheetRef[]; heard: SheetRef[]; memory: SheetRef[];
  guarded: string[]; saidSoFar: string[]; recentLines: string[]; safeEntities: Id[];
  topicToRef: Record<string, string>;
}
export interface LineBankEntry { suspect: Id; topic: string; layer: number; mode: AnswerMode; answer: Answer; }
export interface MemoryRef { id: Id; text: string; entities: Id[]; source: string; }
export interface SuspectState {
  layer: number; composure: number; composureMax: number; rapport: number; respect: number;
  emptyPresses: number; lawyeredUntil: number; shownEvidence: Id[];
  heard: MemoryRef[]; memory: MemoryRef[]; saidSoFar: string[]; recentLines: string[];
}
export interface NotebookClaim { statement: Id; speaker: Id; topic: string; layer: number; canonical: string; asserts: Id[]; broken: boolean; }
export interface ArgumentClaim { deduction: Id; refs: Id[]; span?: string; }
export type ActionPayload =
  | {type: "Ask"; suspect: Id; topic: string; question?: string}
  | {type: "Press"; suspect: Id; statement?: Id}
  | {type: "Believe"; suspect: Id; statement?: Id}
  | {type: "Object" | "CallLiar"; suspect: Id; statement: Id; evidence: Id[]}
  | {type: "PinchObject"; object: Id}
  | {type: "RevealEvidence"; suspect: Id; evidence: Id}
  | {type: "Suggest" | "Accuse"; who: Id; where: Id; what: Id}
  | {type: "Dismiss"; suspect: Id}
  | {type: "UseHunch"}
  | {type: "ArgumentClaim"; deduction: Id; refs: Id[]}
  | {type: "PitchReceived"; pitch: unknown}
  | {type: "LineSpoken"; suspect: Id; key: string; answer: Answer}
  | {type: "GossipSpoken"; from: Id; to: Id; packet: Id; answer: Answer}
  | {type: "BeatChosen"; beat: Id}
  | {type: "ArgumentExtracted"; claims: ArgumentClaim[]};
export type Action = {seq: number; by: Id} & ActionPayload;
export interface GameEvent { seq: number; type: string; actor?: Id; refs?: Id[]; text?: string; data?: Record<string, unknown>; }
export type Verdict = "correct" | "wrong" | "timeout" | null;
export interface GameState {
  caseId: string; lastSeq: number; elapsedMinutes: number; clockMinutes: number; pips: number; hunches: number;
  activeSuspect: Id | null; activeStatement: Id | null; suspects: Record<Id, SuspectState>;
  knowledge: PlayerKnowledge; notebook: NotebookClaim[];
  grid: {suspects: Id[]; zones: Id[]; weapons: Id[]};
  beatsFired: Id[]; arguments: ArgumentClaim[]; verdict: Verdict; accusation: Hypothesis | null;
  events: GameEvent[]; log: Action[];
}
