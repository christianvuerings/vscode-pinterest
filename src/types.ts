export type Decider = {
  url: string;
  createdAt?: string;
  description?: string;
  owner?: string;
  lastUpdated: string;
  currentValue: number;
  ldap?: string;
  ldapInfo?: {
    name: string;
    email: string;
  };
  key: string;
};

export type Deciders = Decider[];

export type Experiment = {
  creator: string;
  createdAt: string;
  description?: string;
  lastUpdated: string;
  startDate: string;
  endDate?: string;
  shippedDate?: string;
  key: string;
  owner: string;
  status: number;
  parsedStatus:
    | "Running"
    | "Debug"
    | "Running"
    | "Disabled"
    | "Complete"
    | "Deleted";
  team?: string;
  version: number;
  docLink: string;
  experimentDecision: string;
  url: string;
};

export type Experiments = Experiment[];
