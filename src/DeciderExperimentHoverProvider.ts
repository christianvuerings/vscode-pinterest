/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  HoverProvider,
  Hover,
  TextDocument,
  CancellationToken,
  Position,
  workspace,
  MarkdownString,
  ProviderResult,
} from "vscode";
import log from "./log";
import store from "./store";
import { Decider, Experiment } from "./types";
import { getInfo } from "./experimentDeciderInfo";

export default class DeciderExperimentHoverProvider implements HoverProvider {
  public async provideHover(
    document: TextDocument,
    position: Position,
    _token: CancellationToken
  ): Promise<Hover | undefined> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return undefined;
    }

    const name = document.getText(wordRange);
    const storeInstance = store.get();

    if (!storeInstance) {
      return undefined;
    }

    log.append("//// 1 deciders by key");

    const decidersKeys = storeInstance.deciders.map((decider) => decider.key);

    log.append("//// 2 experiments by key");

    const experimentsKeys = storeInstance.experiments.map(
      (experiment) => experiment.key
    );

    log.append(`// name: ${name}`);

    const entry =
      decidersKeys.includes(name) || experimentsKeys.includes(name)
        ? storeInstance.deciders.find((item) => item.key === name) ||
          storeInstance.experiments.find((item) => item.key === name)
        : null;

    if (!entry) {
      return undefined;
    }

    log.append(`//// 3: ${entry?.key}`);

    const markdownString = await getInfo(entry);

    if (!markdownString) {
      return undefined;
    }

    markdownString.isTrusted = true;
    return new Hover(markdownString, wordRange);
  }
}
