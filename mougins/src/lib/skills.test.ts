import { describe, it, expect } from "vitest";
import { skillChatUrl } from "./skills";

describe("skillChatUrl", () => {
  it("builds a Mistral chat URL with the prompt as the q param", () => {
    expect(skillChatUrl("What is Kubernetes?")).toBe(
      "https://chat.mistral.ai/chat?q=What+is+Kubernetes%3F",
    );
  });

  it("encodes characters that would break the query string", () => {
    expect(skillChatUrl("c++ & rust")).toBe(
      "https://chat.mistral.ai/chat?q=c%2B%2B+%26+rust",
    );
  });
});
