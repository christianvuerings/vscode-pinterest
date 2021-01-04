import log from "./log";
import store from "./store";
import track from "./track";

async function update() {
  try {
    await store.update();
  } catch (e) {
    log.append(e.message);
    console.error(e);
    const errorMessage = `Could not update the cache. Ensure you are connected to the Pinterest VPN`;
    track.event({
      category: "Error",
      action: "Error",
      label: errorMessage,
    });
    log.append(errorMessage);
  }
}

export default {
  update,
};
