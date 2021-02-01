import * as vscode from "vscode";

const get: () => {
  version: string;
} | null = () => {
  const extension = vscode.extensions.getExtension(
    "christianvuerings.vscode-pinterest-internal"
  );

  return extension && extension.packageJSON ? extension.packageJSON : null;
};

export default {
  get,
};
