import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

function loadTsModule(relativePath) {
  const absolutePath = join(process.cwd(), relativePath);
  const source = readFileSync(absolutePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: absolutePath,
  });

  const tsModule = new Module(absolutePath);
  tsModule.filename = absolutePath;
  tsModule.paths = Module._nodeModulePaths(process.cwd());
  tsModule._compile(outputText, absolutePath);
  return tsModule.exports;
}

test("cn filters falsey class inputs and resolves Tailwind conflicts", () => {
  const { cn } = loadTsModule("lib/utils.ts");

  assert.equal(
    cn("px-2 text-sm", ["px-4", false && "hidden"], {
      "font-bold": true,
      "opacity-50": false,
    }),
    "text-sm px-4 font-bold"
  );
  assert.equal(cn(null, undefined, false, "", "block"), "block");
});

test("AGENTS exposes the board in the pipeline order used by the UI", () => {
  const { AGENTS } = loadTsModule("lib/agents.ts");

  assert.deepEqual(
    AGENTS.map(({ id, name, iconName }) => ({ id, name, iconName })),
    [
      { id: "son", name: "Masayoshi Son", iconName: "Globe2" },
      { id: "thiel", name: "Peter Thiel", iconName: "Swords" },
      { id: "jobs", name: "Steve Jobs", iconName: "Smartphone" },
      { id: "bezos", name: "Jeff Bezos", iconName: "Package" },
      { id: "buffett", name: "Warren Buffett", iconName: "PiggyBank" },
    ]
  );
  assert.equal(new Set(AGENTS.map((agent) => agent.id)).size, AGENTS.length);
});

test("AGENTS entries have complete metadata and structured prompts", () => {
  const { AGENTS } = loadTsModule("lib/agents.ts");

  for (const agent of AGENTS) {
    assert.equal(typeof agent.id, "string");
    assert.notEqual(agent.id.trim(), "");
    assert.equal(typeof agent.name, "string");
    assert.notEqual(agent.name.trim(), "");
    assert.equal(typeof agent.role, "string");
    assert.notEqual(agent.role.trim(), "");
    assert.match(agent.color, /^text-[a-z]+-\d{3}$/);
    assert.equal(typeof agent.iconName, "string");
    assert.notEqual(agent.iconName.trim(), "");
    assert.match(agent.systemPrompt, /Role:/);
    assert.match(agent.systemPrompt, /Task:/);
    assert.match(agent.systemPrompt, /Output Format:/);
  }
});
