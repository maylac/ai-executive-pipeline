import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

const verdictPath = join(process.cwd(), "lib/verdict.ts");
const { outputText } = ts.transpileModule(readFileSync(verdictPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: verdictPath,
});
const verdictModule = new Module(verdictPath);
verdictModule.filename = verdictPath;
verdictModule.paths = Module._nodeModulePaths(process.cwd());
verdictModule._compile(outputText, verdictPath);
const { extractVerdict } = verdictModule.exports;

test("extractVerdict reads only the structured verdict section", () => {
  const content = [
    "## 1. The Moat Analysis",
    "An INVEST case exists, but the risks dominate.",
    "## 2. The Verdict",
    "VERDICT: PASS",
    "The margin of safety is insufficient.",
    "## 3. Letter to Shareholders",
    "Wait for a better price.",
  ].join("\n");

  assert.equal(extractVerdict(content), "PASS");
});

test("extractVerdict accepts an unlabelled verdict inside the correct section", () => {
  assert.equal(extractVerdict("## 2. The Verdict\n**INVEST**\nThe moat is durable."), "INVEST");
});

test("extractVerdict does not infer a decision from another section", () => {
  assert.equal(extractVerdict("## 1. Analysis\nINVEST may be possible."), undefined);
});
