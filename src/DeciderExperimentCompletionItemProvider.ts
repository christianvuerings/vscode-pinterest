import Fuse from "fuse.js";
import store from "./store";
import log from "./log";
import track from "./track";
import { Decider, Experiment } from "./types";
import { getDetail, getInfo } from "./experimentDeciderInfo";
import { MarkdownString } from "vscode";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  CompletionList,
  Position,
  TextDocument,
} from "vscode";

class DeciderExperimentCompletionItem implements CompletionItem {
  kind?: CompletionItemKind;
  label: string;
  detail?: string;
  documentation?: MarkdownString;
  readonly deciderExperiment: Decider | Experiment;

  constructor(
    label: string,
    kind: CompletionItemKind,
    deciderExperiment: Decider | Experiment
  ) {
    this.label = label;
    this.kind = kind;
    this.deciderExperiment = deciderExperiment;
  }

  async resolve(): Promise<this> {
    const { deciderExperiment } = this;
    this.documentation = await getInfo(deciderExperiment);
    this.detail = await getDetail(deciderExperiment);

    return this;
  }
}

class DeciderExperimentCompletionItemProvider
  implements CompletionItemProvider<CompletionItem> {
  public static readonly triggerCharacters = ["'", '"'];

  async resolveCompletionItem(
    item: DeciderExperimentCompletionItem
  ): Promise<DeciderExperimentCompletionItem | undefined> {
    return item instanceof DeciderExperimentCompletionItem
      ? item.resolve()
      : item;
  }

  public async provideCompletionItems(
    document: TextDocument,
    position: Position
  ): Promise<CompletionList<CompletionItem> | undefined> {
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

    return new CompletionList(
      results.map(({ item }) => {
        const completionItem = new DeciderExperimentCompletionItem(
          item.key,
          CompletionItemKind.Text,
          item
        );

        return completionItem;
      })
    );
  }
}

export default DeciderExperimentCompletionItemProvider;
