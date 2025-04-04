import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from "vitest";

vi.mock("node:child_process", () => ({
  exec: vi.fn(),
  spawn: vi.fn(),
}));
vi.mock("../utils/common", async () => {
  const actual = await vi.importActual(".");

  return {
    ...actual,
    commandExists: vi.fn(),
  };
});

import { exec, spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { sendNotification } from "../utils/notification";
import * as commonUtils from "../utils/common";

describe("sendNotification", () => {
  const originalPlatform = process.platform;
  const mockedSpawn: MockedFunction<typeof spawn> = vi.mocked(spawn);
  const mockedExec: MockedFunction<typeof exec> = vi.mocked(exec);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commonUtils.commandExists).mockResolvedValue(true);
    // Mock exec to simulate command exists
    mockedExec.mockImplementation((_cmd, _opts, callback) => {
      if (callback) {
        callback(null, "", "");
      }
      return {} as ChildProcess;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Restore the original platform
    Object.defineProperty(process, "platform", {
      value: originalPlatform,
    });
  });

  it("should send notification on macOS using osascript", async () => {
    Object.defineProperty(process, "platform", {
      value: "darwin",
    });

    await sendNotification("Test Title", "Test Message");

    expect(mockedSpawn).toHaveBeenCalledWith(
      "osascript",
      ["-e", 'display notification "Test Message" with title "Test Title"'],
      { stdio: "ignore" },
    );
  });

  it("should send notification on Windows using powershell", async () => {
    Object.defineProperty(process, "platform", {
      value: "win32",
    });

    await sendNotification("Test Title", "Test Message");

    expect(mockedSpawn).toHaveBeenCalledWith(
      "powershell",
      [
        "-Command",
        expect.stringContaining("[System.Windows.Forms.MessageBox]::Show"),
      ],
      { stdio: "ignore" },
    );
  });

  it("should send notification on Linux using notify-send", async () => {
    Object.defineProperty(process, "platform", {
      value: "linux",
    });

    await sendNotification("Test Title", "Test Message");

    expect(mockedSpawn).toHaveBeenCalledWith(
      "notify-send",
      ["Test Title", "Test Message"],
      { stdio: "ignore" },
    );
  });

  it("should not send notification if command does not exist", async () => {
    Object.defineProperty(process, "platform", {
      value: "linux",
    });

    vi.mocked(commonUtils.commandExists).mockResolvedValue(false);

    await sendNotification("Test Title", "Test Message");

    expect(mockedSpawn).not.toHaveBeenCalled();
  });

  it("should handle unsupported platforms gracefully", async () => {
    Object.defineProperty(process, "platform", {
      value: "someotherplatform",
    });

    await sendNotification("Test Title", "Test Message");

    expect(mockedSpawn).not.toHaveBeenCalled();
  });
});
