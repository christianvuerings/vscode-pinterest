import AbortController from "abort-controller";
import fetch from "node-fetch";
import { URL } from "url";
import { MarkdownString } from "vscode";
import log from "./log";
import { Decider, Experiment } from "./types";

const controller = new AbortController();

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
  })} at ${dateTime.toLocaleTimeString()}`;
};

const ownerInfo = (item: Decider | Experiment) => {
  return [
    item.type === "experiment" && item.owner
      ? `${item.owner?.split(",").length > 1 ? "Owners" : "Owner"}: ${item.owner
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
    `${item.createdAt ? `Created: ${parseDateTime(item.createdAt)}` : ""}`,
    `Last Updated: ${parseDateTime(item.lastUpdated)}`,
  ]
    .filter(Boolean)
    .join("  \n");
};

async function getRampInfo(deciderExperiment: Decider | Experiment) {
  if (deciderExperiment.type === "decider") {
    return `Ramp: ${deciderValue(deciderExperiment.currentValue)}`;
  } else {
    const fetchTimeout = setTimeout(() => {
      controller.abort();
    }, 1000);
    try {
      const heliumResponse: {
        data: [
          {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            group_ranges: {
              [group: string]: {
                percent: number;
              };
            };
          }
        ];
      } = await (
        await fetch(
          `https://helium.pinadmin.com/ds/experiment/config_history/?params={"experiment":"${deciderExperiment.key}","with_filters":true,"limit":1}`,
          { signal: controller.signal }
        )
      ).json();
      const ramp = Object.entries(heliumResponse.data[0].group_ranges)
        .reduce((acc: string[], currentValue) => {
          const [key, value] = currentValue;
          return [
            ...acc,
            `| ${key} | \`${Math.round(value.percent * 1000) / 10}%\` |`,
          ];
        }, [])
        .join("\n");

      return ["| **Group** | **Percent** |", "| :--- | ---: |", ramp].join(
        "\n"
      );
    } catch (error) {
      log.append(`getRampInfo: ${error.message}`);
      return `Ramp: (Could not fetch data)`;
    } finally {
      clearTimeout(fetchTimeout);
    }
  }
}

export async function getInfo(
  deciderExperiment: Decider | Experiment | null
): Promise<MarkdownString | undefined> {
  if (!deciderExperiment) {
    return undefined;
  }

  const ramp = await getRampInfo(deciderExperiment);
  const markdown = new MarkdownString()
    .appendMarkdown(parseDescription(deciderExperiment.description))
    .appendMarkdown("\n\n")
    .appendMarkdown(ramp)
    .appendMarkdown("\n\n")
    .appendMarkdown(ownerInfo(deciderExperiment))
    .appendMarkdown("\n\n")
    .appendMarkdown(
      `Link: [${
        deciderExperiment.type === "experiment" ? "Helium" : "Adminapp"
      }](${new URL(deciderExperiment.url)})`
    )
    .appendMarkdown("\n\n")
    .appendMarkdown(dateInfo(deciderExperiment));

  markdown.isTrusted = true;
  return markdown;
}

export function getDetail(deciderExperiment: Decider | Experiment): string {
  return `(${deciderExperiment.type})`;
}
