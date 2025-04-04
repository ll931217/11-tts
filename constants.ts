import os from "node:os";
import path from "node:path";

export const CONFIG_PATH = path.join(
  os.homedir(),
  ".config/elevenlabs-config.json",
);
export const DEFAULT_VOICE_ID = "56AoDkrOh6qfVPDXZ7Pt";
export const DEFAULT_MODEL_ID = "eleven_turbo_v2_5";
