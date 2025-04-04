import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  exec: vi.fn(),
}));
vi.mock("node:fs");
vi.mock("node:path");
vi.mock("node:util", () => ({
  promisify: vi.fn((fn) => fn),
}));

import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { commandExists, getConfig } from ".";
import { promisify } from "node:util";

describe("Config Management", () => {
  const mockConfig = { apiKey: "test-api-key" };
  const mockConfigPath = "/mock/path/.elevenlabs-config.json";

  beforeEach(() => {
    // Mock path.join to return our mock config path
    console.log("mocking path.join");
    // vi.mocked(path.join).mockReturnValue(mockConfigPath);
    vi.mocked(path.join).mockImplementation((args) => {
      console.log("path.join args:", args);
      return mockConfigPath;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should read config file when it exists", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

    const result = getConfig(mockConfigPath);
    expect(result).toEqual(mockConfig);
    expect(fs.existsSync).toHaveBeenCalledWith(mockConfigPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigPath, "utf-8");
  });

  it("should return default config when file does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    process.env.ELEVENLABS_API_KEY = "env-api-key";
    const DEFAULT_VOICE_ID = "56AoDkrOh6qfVPDXZ7Pt";
    const DEFAULT_MODEL_ID = "eleven_turbo_v2_5";

    const result = getConfig(mockConfigPath);
    expect(result).toEqual({
      apiKey: "env-api-key",
      modelId: DEFAULT_MODEL_ID,
      voiceId: DEFAULT_VOICE_ID,
    });
    expect(fs.existsSync).toHaveBeenCalledWith(mockConfigPath);
  });
});

describe("Command Existence Check", () => {
  it("returns true when command exists", async () => {
    // Setup the promisified exec mock to resolve successfully
    const mockExecPromise = vi
      .fn()
      .mockResolvedValue({ stdout: "/usr/bin/command-path" });
    vi.mocked(promisify).mockReturnValue(mockExecPromise);

    const result = await commandExists("existing-command");

    // Verify the result
    expect(result).toBe(true);
    // Verify promisify was called with exec
    expect(promisify).toHaveBeenCalledWith(exec);
    // Verify the promisified function was called with the right command
    expect(mockExecPromise).toHaveBeenCalledWith("which existing-command");
  });

  it("returns false when command does not exist", async () => {
    // Setup the promisified exec mock to reject
    const mockExecPromise = vi
      .fn()
      .mockRejectedValue(new Error("command not found"));
    vi.mocked(promisify).mockReturnValue(mockExecPromise);

    const result = await commandExists("non-existing-command");

    // Verify the result
    expect(result).toBe(false);
    // Verify promisify was called with exec
    expect(promisify).toHaveBeenCalledWith(exec);
    // Verify the promisified function was called with the right command
    expect(mockExecPromise).toHaveBeenCalledWith("which non-existing-command");
  });
});
