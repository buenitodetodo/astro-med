export type Crew = {
  id: string;
  callsign: string;
  role: string;
  missionId: string;
  missionName: string;
  phase: string;
  missionStart: string;
  durationDays: number | null;
};

export type AppEnv = { Bindings: Env; Variables: { crew: Crew } };
