import fetch from "node-fetch";
import { URL } from "url";
import log from "./log";
import { Deciders, Experiments } from "./types";

async function get<T>({
  fields,
  path,
}: {
  fields?: {
    [key: string]: number | string;
  };
  path: "deciders" | "experiments";
}): Promise<T> {
  const baseUrl = "https://capi.pinadmin.com/";
  const url = new URL(`api/${path}`, baseUrl);

  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      url.searchParams.set(key, String(value));
    }
  }

  log.append(`Request data from ${url.toString()}`);

  const response = await fetch(url, {
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "User-Agent": "vscode-pinterest-internal",
    },
  });
  const jsonResponse = await response.json();
  return jsonResponse;
}

const experiments = async (): Promise<Experiments> => {
  const response: {
    data: Experiments;
  } = await get({
    path: "experiments",
  });

  return response.data.map((item) => ({ ...item, type: "experiment" }));
};

const deciders = async (): Promise<Deciders> => {
  const response: {
    data: Deciders;
  } = await get({
    path: "deciders",
  });

  return response.data
    .filter(
      ({ currentValue }) => currentValue !== -1 && currentValue !== undefined
    )
    .map((item) => ({ ...item, type: "decider" }));
};

export default { deciders, experiments };
