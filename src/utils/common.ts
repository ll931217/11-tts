import fs from "node:fs";

import { exec } from "node:child_process";
import { promisify } from "node:util";

import { CONFIG_PATH, DEFAULT_MODEL_ID, DEFAULT_VOICE_ID } from "../constants";
import type { ConfigType } from "../types";

// Helper function to check if a command exists
export async function commandExists(command: string) {
  try {
    const execPromise = promisify(exec);
    await execPromise(`which ${command}`);
    return true;
  } catch (error) {
    return false;
  }
}

// Load config if it exists
export function getConfig(configPath: string = CONFIG_PATH): ConfigType {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }

  return {
    apiKey: process.env.ELEVENLABS_API_KEY || "",
    modelId: DEFAULT_MODEL_ID,
    voiceId: DEFAULT_VOICE_ID,
  };
}

// Save config
export function saveConfig(config: ConfigType): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}
