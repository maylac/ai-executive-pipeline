import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

const routePath = join(process.cwd(), "app/api/chat/route.ts");

function loadRoute(FakeOpenAI) {
  const source = readFileSync(routePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: routePath,
  });

  const routeModule = new Module(routePath);
  routeModule.filename = routePath;
  routeModule.paths = Module._nodeModulePaths(process.cwd());
  const defaultRequire = routeModule.require.bind(routeModule);

  routeModule.require = (id) => {
    if (id === "openai") {
      return { __esModule: true, default: FakeOpenAI };
    }
    return defaultRequire(id);
  };

  routeModule._compile(outputText, routePath);
  return routeModule.exports;
}

function jsonRequest(body) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST rejects non-object JSON payloads before creating an OpenAI client", async () => {
  let openAiCalls = 0;
  class FakeOpenAI {
    constructor() {
      openAiCalls += 1;
    }
  }

  const { POST } = loadRoute(FakeOpenAI);

  for (const body of [null, "idea", 42, []]) {
    const response = await POST(jsonRequest(body));

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid JSON body" });
  }
  assert.equal(openAiCalls, 0);
});

test("POST trims the API key and forwards an explicit model", async () => {
  let constructorOptions;
  let createArgs;

  class FakeOpenAI {
    constructor(options) {
      constructorOptions = options;
    }

    chat = {
      completions: {
        create: async (args) => {
          createArgs = args;
          return (async function* streamChunks() {
            yield { choices: [{ delta: { content: "ok" } }] };
          })();
        },
      },
    };
  }

  const { POST } = loadRoute(FakeOpenAI);
  const response = await POST(
    jsonRequest({
      apiKey: "  sk-edge  ",
      systemPrompt: "system",
      userContent: "user",
      model: "gpt-4.1-mini",
    })
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "ok");
  assert.equal(constructorOptions.apiKey, "sk-edge");
  assert.equal(createArgs.model, "gpt-4.1-mini");
});

test("POST falls back to the default model for blank model input", async () => {
  let createArgs;

  class FakeOpenAI {
    chat = {
      completions: {
        create: async (args) => {
          createArgs = args;
          return (async function* streamChunks() {
            yield { choices: [{ delta: { content: "fallback" } }] };
          })();
        },
      },
    };
  }

  const { POST } = loadRoute(FakeOpenAI);
  const response = await POST(
    jsonRequest({
      apiKey: "sk-test",
      systemPrompt: "system",
      userContent: "user",
      model: "   ",
    })
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "fallback");
  assert.equal(createArgs.model, "gpt-4o");
});

test("POST returns the upstream OpenAI error message", async () => {
  class FakeOpenAI {
    chat = {
      completions: {
        create: async () => {
          throw new Error("upstream exploded");
        },
      },
    };
  }

  const { POST } = loadRoute(FakeOpenAI);
  const response = await POST(
    jsonRequest({
      apiKey: "sk-test",
      systemPrompt: "system",
      userContent: "user",
    })
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "upstream exploded" });
});

test("POST returns a generic message for non-Error failures", async () => {
  class FakeOpenAI {
    chat = {
      completions: {
        create: async () => {
          throw "plain failure";
        },
      },
    };
  }

  const { POST } = loadRoute(FakeOpenAI);
  const response = await POST(
    jsonRequest({
      apiKey: "sk-test",
      systemPrompt: "system",
      userContent: "user",
    })
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Something went wrong" });
});
