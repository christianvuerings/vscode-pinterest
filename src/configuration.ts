import * as vscode from "vscode";

const enableTelemetry = async (): Promise<boolean> =>
  !!vscode.workspace.getConfiguration().get("pinterest.enableTelemetry");

export default {
  enableTelemetry,
};
