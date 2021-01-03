// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import cache from "./cache";
import completionProvider from "./completionProvider";
import extensionContext from "./context";
import log from "./log";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  log.append('Extension "vscode-pinterest" is active');
  log.show();

  extensionContext.set(context);

  await cache.update();
  const updateCacheDisposable = vscode.commands.registerCommand(
    "vscode-pinterest.updateCache",
    async () => {
      await cache.update();
    }
  );

  // setInterval(async () => {
  //   await cache.update();
  // }, 10000);

  context.subscriptions.push(updateCacheDisposable);

  // Add auto completion provider
  context.subscriptions.push(completionProvider());
}

// this method is called when your extension is deactivated
export function deactivate() {}
