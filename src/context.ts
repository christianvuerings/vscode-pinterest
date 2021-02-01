import * as vscode from "vscode";

let contextInstance: vscode.ExtensionContext;

const get = (): vscode.ExtensionContext => {
  return contextInstance;
};

const set = (input: vscode.ExtensionContext): void => {
  contextInstance = input;
};

export default { get, set };
