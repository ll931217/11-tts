import { ElevenLabsClient } from "elevenlabs";
import { getConfig } from "./common";

// Initialize ElevenLabs client
export function getClient() {
  const config = getConfig();
  if (!config.apiKey) {
    console.error(
      "Error: No API key found. Use 'set-key' command to set your API key.",
    );
    process.exit(1);
  }
  return new ElevenLabsClient({ apiKey: config.apiKey });
}
