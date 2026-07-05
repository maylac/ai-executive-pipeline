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

test("POST rejects malformed JSON as a client error", async () => {
  let openAiCalls = 0;
  class FakeOpenAI {
    constructor() {
      openAiCalls += 1;
    }
  }

  const { POST } = loadRoute(FakeOpenAI);
  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    })
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid JSON body" });
  assert.equal(openAiCalls, 0);
});

test("POST rejects blank API keys before creating an OpenAI client", async () => {
  let openAiCalls = 0;
  class FakeOpenAI {
    constructor() {
      openAiCalls += 1;
    }
  }

  const { POST } = loadRoute(FakeOpenAI);
  const response = await POST(
    jsonRequest({
      apiKey: "   ",
      systemPrompt: "system",
      userContent: "user",
    })
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "API Key is required" });
  assert.equal(openAiCalls, 0);
});

test("POST rejects missing chat content before calling OpenAI", async () => {
  let createCalls = 0;
  class FakeOpenAI {
    chat = {
      completions: {
        create: async () => {
          createCalls += 1;
          throw new Error("OpenAI should not be called");
        },
      },
    };
  }

  const { POST } = loadRoute(FakeOpenAI);
  const response = await POST(
    jsonRequest({
      apiKey: "sk-test",
      systemPrompt: "system",
    })
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "systemPrompt and userContent are required",
  });
  assert.equal(createCalls, 0);
});

test("POST streams OpenAI chat chunks for a valid request", async () => {
  let createArgs;
  class FakeOpenAI {
    constructor(options) {
      assert.equal(options.apiKey, "sk-test");
    }

    chat = {
      completions: {
        create: async (args) => {
          createArgs = args;
          return (async function* streamChunks() {
            yield { choices: [{ delta: { content: "hello" } }] };
            yield { choices: [{ delta: {} }] };
            yield { choices: [{ delta: { content: " world" } }] };
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
    })
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "hello world");
  assert.equal(createArgs.model, "gpt-4o");
  assert.deepEqual(createArgs.messages, [
    { role: "system", content: "system" },
    { role: "user", content: "user" },
  ]);
  assert.equal(createArgs.stream, true);
});
