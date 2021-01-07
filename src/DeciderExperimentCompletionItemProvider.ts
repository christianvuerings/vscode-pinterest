import * as vscode from "vscode";
import { URL } from "url";
import Fuse from "fuse.js";
import store from "./store";
import log from "./log";
import track from "./track";
import { Decider, Experiment } from "./types";

const parseDescription = (input?: string) => {
  if (!input) {
    return `Description: (empty)`;
  }
  return `Description: ${input.replace(/\\n/g, ` `).replace(/\\r/g, ` `)}`;
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

class DeciderExperimentCompletionItemProvider
  implements vscode.CompletionItemProvider<vscode.CompletionItem> {
  public static readonly triggerCharacters = ["'", '"'];

  constructor() {}

  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionList<vscode.CompletionItem> | undefined> {
    const storeInstance = store.get();

    log.append("// provideCompletionItems activated");

    if (!storeInstance) {
      return undefined;
    }

    // Check if one of the first 100 lines of the file contain 'decider' or 'experiment'
    if (
      !document
        .getText()
        .split("\n")
        .slice(0, 100)
        .some(
          (value) =>
            value.toLowerCase().includes("experiment") ||
            value.toLowerCase().includes("decider")
        )
    ) {
      return undefined;
    }

    const linePrefix = document
      .lineAt(position)
      .text.substr(0, position.character);

    const matched = linePrefix.match(/(['"][\w-_]+)$/);
    if (!matched) {
      return undefined;
    }

    let searchIndex = [...storeInstance.deciders, ...storeInstance.experiments];
    if (linePrefix.toLocaleLowerCase().includes("decider")) {
      searchIndex = storeInstance.deciders;
    } else if (linePrefix.toLocaleLowerCase().includes("experiment")) {
      searchIndex = storeInstance.experiments;
    }

    const search = matched[0].replace(/['"]/g, "");
    const fuse = new Fuse(searchIndex, {
      keys: ["key"],
      threshold: 0.2,
    });
    const results = fuse.search(search);

    if (!results) {
      return undefined;
    }

    track.event({
      category: "Event",
      action: "Count",
      label: "Autocompletion",
      value: String(results.length),
    });

    return new vscode.CompletionList(
      results.map(({ item }) => {
        const completionItem = new vscode.CompletionItem(
          item.key,
          vscode.CompletionItemKind.Text
        );

        const markdown = new vscode.MarkdownString(
          `[${
            item.type === "experiment" ? "Helium Link" : "Adminapp Link"
          }](${new URL(item.url)})

${parseDescription(item.description)}

${ownerInfo(item)}\n
${dateInfo(item)}`
          // `**[${item.value}](${new URL(
          //   `/${isGroup ? "tag" : "p"}/${item.key}/`,
          //   baseUrl
          // )})**`.concat(
          //   item.detail ? `\n\n${item.detail.replace(/\s\s#/g, " - ")}` : ""
          // )
        );
        markdown.isTrusted = true;

        completionItem.documentation = markdown;
        completionItem.detail =
          item.type === "decider"
            ? `Ramp: ${deciderValue(item.currentValue)} (${item.type})`
            : `(${item.type})`;
        // completionItem.filterText = `${item.key} ${item.value}`;
        return completionItem;
      })
    );
  }
}

export default DeciderExperimentCompletionItemProvider;
