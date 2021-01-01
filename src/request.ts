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
  const baseUrl = "https://itp-dev-cvuerings.pinterdev.com/";
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
      "User-Agent": "vscode-pinterest",
    },
  });
  return await response.json();
}

const experiments = async () => {
  const response: {
    result?: {
      data: Experiments;
    };
  } = await get({
    path: "experiments",
  });

  const { data = [] } = response.result || {};
  return data;
};

const deciders = async () => {
  const response: {
    result?: {
      data: Deciders;
    };
  } = await get({
    path: "deciders",
  });

  const { data = [] } = response.result || {};
  return data;
};

export default { deciders, experiments };
