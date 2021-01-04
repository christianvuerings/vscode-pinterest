import log from "./log";
import context from "./context";
import request from "./request";
import { Deciders, Experiments } from "./types";

type Store = {
  deciders: Deciders;
  experiments: Experiments;
};

const get = () => {
  const store:
    | (Store & { lastUpdated: number })
    | undefined = context.get().globalState.get("Pinterest");
  return store;
};

const update = async () => {
  const [deciders, experiments] = await Promise.all([
    request.deciders(),
    request.experiments(),
  ]);
  log.append("Cache: Updated");

  context.get().globalState.update("Pinterest", {
    lastUpdated: Date.now(),
    deciders,
    experiments,
  });
};

export default { get, update };
