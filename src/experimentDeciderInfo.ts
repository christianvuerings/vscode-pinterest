import { URL } from "url";
import { MarkdownString } from "vscode";
import { Decider, Experiment } from "./types";

const parseDescription = (input?: string) => {
  if (!input) {
    return `Description: (empty)`;
  }
  return `Description: ${input
    .replace(/\\n/g, ` `)
    .replace(/\\r/g, ` `)
    // Transform link logic to Markdown
    .replace(/\[\[(.*)\|(.*)\]\]/g, "[$2]($1)")}`;
};

const deciderValue = (input?: number) => {
  return `${input}%`;
};

const parseDateTime = (input?: string) => {
  const dateTime = new Date(input + "Z");

  return `${dateTime.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })} ${dateTime.toLocaleTimeString()}`;
};

const ownerInfo = (item: Decider | Experiment) => {
  return [
    item.type === "experiment" && item.owner
      ? `${item.owner?.split(",").length > 1 ? "Owner" : "Owner"}: ${item.owner
          ?.split(",")
          .map((owner) => owner.trim())
          .map((owner) => `[@${owner}](https://who.pinadmin.com/#${owner})`)
          .join(" / ")}`
      : null,
    item.type === "experiment" && item.team ? `Team: ${item.team}` : null,
    item.type === "decider" && item.ldapInfo?.name
      ? `Owner: [${item.ldapInfo?.name}](https://who.pinadmin.com/#${item.ldap})`
      : item.type === "decider" && item.ownerInfo
      ? `Owner: [${item.ownerInfo.fullName}](https://pinterest.com/${item.ownerInfo.username}/) ([AdminApp](https://adminapp.pinterest.com/220calave/user/${item.owner}/))`
      : item.type === "decider" && item.owner
      ? `Owner: [${item.owner}](https://adminapp.pinterest.com/220calave/user/${item.owner}/) (Suspended / deactivated account)`
      : null,
  ]
    .filter(Boolean)
    .join("  \n");
};

const dateInfo = (item: Decider | Experiment) => {
  return [
    `${item.createdAt ? `Created At: ${parseDateTime(item.createdAt)}` : ""}`,
    `Last Updated: ${parseDateTime(item.lastUpdated)}`,
  ]
    .filter(Boolean)
    .join("  \n");
};

export function getInfo(
  deciderExperiment: Decider | Experiment | null
): Thenable<MarkdownString | undefined> | undefined {
  if (!deciderExperiment) {
    return undefined;
  }

  return new Promise((resolve, reject) => {
    const markdown = new MarkdownString(
      `[${
        deciderExperiment.type === "experiment"
          ? "Helium Link"
          : "Adminapp Link"
      }](${new URL(deciderExperiment.url)})

  ${parseDescription(deciderExperiment.description)}

  ${ownerInfo(deciderExperiment)}\n
  ${dateInfo(deciderExperiment)}`
    );
    markdown.isTrusted = true;
    resolve(markdown);
  });
}

export function getDetail(deciderExperiment: Decider | Experiment) {
  return deciderExperiment.type === "decider"
    ? `Ramp: ${deciderValue(deciderExperiment.currentValue)} (${
        deciderExperiment.type
      })`
    : `(${deciderExperiment.type})`;
}
