/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { HoverProvider, Hover, TextDocument, Position } from "vscode";
import store from "./store";
import track from "./track";
import { getInfo } from "./experimentDeciderInfo";

export default class DeciderExperimentHoverProvider implements HoverProvider {
  public async provideHover(
    document: TextDocument,
    position: Position
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

    const decidersKeys = storeInstance.deciders.map((decider) => decider.key);

    const experimentsKeys = storeInstance.experiments.map(
      (experiment) => experiment.key
    );

    const entry =
      decidersKeys.includes(name) || experimentsKeys.includes(name)
        ? storeInstance.deciders.find((item) => item.key === name) ||
          storeInstance.experiments.find((item) => item.key === name)
        : null;

    if (!entry) {
      return undefined;
    }

    const markdownString = await getInfo(entry);

    if (!markdownString) {
      return undefined;
    }

    track.event({
      category: "Event",
      action: "Count",
      label: "Hover",
      value: String(1),
    });

    markdownString.isTrusted = true;
    return new Hover(markdownString, wordRange);
  }
}
