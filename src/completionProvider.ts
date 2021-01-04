import * as vscode from "vscode";
import { URL } from "url";
import Fuse from "fuse.js";
import store from "./store";
import log from "./log";
import track from "./track";
import { Decider, Experiment } from "./types";

const parseDescription = (input?: string) => {
  if (!input) {
    return `(no description)`;
  }
  return input.replace(/\\n/g, ` `).replace(/\\r/g, ` `);
};

const deciderValue = (input?: number) => {
  return input === -1 ? "(Not yet launched)" : `${input}%`;
};

const parseDateTime = (input?: string) => {
  const dateTime = new Date(input + "Z");

  return `${dateTime.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })} ${dateTime.toLocaleTimeString()}`;
};

const info = (item: Decider | Experiment) => {
  if (item.type === "decider") {
    return `Ramp: ${deciderValue(item.currentValue)}\n
${item.createdAt ? `Created At: ${parseDateTime(item.createdAt)}\n` : ""}
Last Updated: ${parseDateTime(item.lastUpdated)}`;
  }
};

const triggerCharacters: string[] = ["'", '"'];
const completionProvider = () =>
  vscode.languages.registerCompletionItemProvider(
    // https://code.visualstudio.com/docs/languages/identifiers
    [
      "javascript",
      "javascriptreact",
      "jsx",
      "plaintext",
      "python",
      "typescript",
      "typescriptreact",
    ],
    {
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const storeInstance = store.get();
        log.append(`// provideCompletionItems 1 - ${storeInstance}`);
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

        log.append("// provideCompletionItems 2");

        const linePrefix = document
          .lineAt(position)
          .text.substr(0, position.character);

        log.append(`// provideCompletionItems 3 - ${linePrefix}`);

        const matched = linePrefix.match(/(['"][\w-_]+)$/);
        if (!matched) {
          return undefined;
        }

        log.append(`// provideCompletionItems 4 - ${matched}`);

        let searchIndex = [
          ...storeInstance.deciders,
          ...storeInstance.experiments,
        ];
        if (linePrefix.toLocaleLowerCase().includes("experiment")) {
          searchIndex = storeInstance.experiments;
        } else if (linePrefix.toLocaleLowerCase().includes("decider")) {
          searchIndex = storeInstance.deciders;
        }

        const search = matched[0].replace(/['"]/g, "");
        console.log({ search });
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

        console.log({ results });

        // return undefined;

        return results.map(({ item }) => {
          const completionItem = new vscode.CompletionItem(
            item.key,
            vscode.CompletionItemKind.Text
          );

          const markdown = new vscode.MarkdownString(
            `*${item.type}*: [Link](${new URL(item.url)})

${info(item)}

${parseDescription(item.description)}
            `
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
            item.type === "decider" ? deciderValue(item.currentValue) : "";
          // completionItem.filterText = `${item.key} ${item.value}`;
          return completionItem;
        });
      },
    },
    ...triggerCharacters
  );

export default completionProvider;
