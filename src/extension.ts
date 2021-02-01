// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  commands,
  languages,
  DocumentSelector,
  Disposable,
  ExtensionContext,
} from "vscode";
import cache from "./cache";
import DeciderExperimentCompletionItemProvider from "./DeciderExperimentCompletionItemProvider";
import DeciderExperimentHoverProvider from "./DeciderExperimentHoverProvider";
import extensionContext from "./context";
import log from "./log";
import track from "./track";

// https://code.visualstudio.com/docs/languages/identifiers
const documentSelector: DocumentSelector = [
  "javascript",
  "javascriptreact",
  "jsx",
  "plaintext",
  "python",
  "typescript",
  "typescriptreact",
];

export function addDeciderExperimentProviders(): Disposable {
  const subscriptions: Disposable[] = [
    languages.registerCompletionItemProvider(
      documentSelector,
      new DeciderExperimentCompletionItemProvider(),
      ...DeciderExperimentCompletionItemProvider.triggerCharacters
    ),
    languages.registerHoverProvider(
      documentSelector,
      new DeciderExperimentHoverProvider()
    ),
  ];
  return Disposable.from(...subscriptions);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext): Promise<void> {
  log.append('Extension "vscode-pinterest-internal" is active');

  extensionContext.set(context);

  track.event({
    category: "Event",
    action: "Activate",
    label: "Extension",
  });

  cache.update();
  const updateCacheDisposable = commands.registerCommand(
    "vscode-pinterest.updateCache",
    async () => {
      await cache.update();
    }
  );

  setInterval(async () => {
    await cache.update();
  }, 10000);

  context.subscriptions.push(updateCacheDisposable);

  // Add providers
  addDeciderExperimentProviders();
}

// this method is called when your extension is deactivated
// export function deactivate() {}
