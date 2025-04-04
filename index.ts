#!/usr/bin/env node

import fs from "node:fs";
import { exec, spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { promisify } from "node:util";

import { ElevenLabsClient } from "elevenlabs";
import { program } from "commander";

import type { ConfigType } from "./types";

const CONFIG_PATH = path.join(os.homedir(), ".config/elevenlabs-config.json");
const DEFAULT_VOICE_ID = "56AoDkrOh6qfVPDXZ7Pt";
const DEFAULT_MODEL_ID = "eleven_turbo_v2_5";

process.on("warning", (warning) => {
  if (warning.name === "ExperimentalWarning") return;
  console.warn(warning.stack);
});

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

// CLI setup
program
  .name("elevenlabs-tts")
  .description("A CLI tool for ElevenLabs text-to-speech conversion")
  .version("1.0.0");

// Set API key command
program
  .command("set-key")
  .description("Set your ElevenLabs API key")
  .argument("<api-key>", "Your ElevenLabs API key")
  .action((apiKey: string) => {
    saveConfig({ ...getConfig(), apiKey });
    console.log("API key saved successfully!");
  });

program
  .command("set-voice")
  .description("Set voice ID")
  .argument("<voice-id>", "Your chosen ElevenLabs Voice ID")
  .action((voiceId: string) => {
    saveConfig({ ...getConfig(), voiceId });
    console.log("Voice ID saved successfully!");
  });

program
  .command("set-model")
  .description("Set model ID")
  .argument("<model-id>", "Your chosen ElevenLabs Model ID")
  .action((modelId: string) => {
    saveConfig({ ...getConfig(), modelId });
    console.log("Model ID saved successfully!");
  });

// List voices command
program
  .command("list-voices")
  .description("List available voices")
  .action(async () => {
    try {
      const client = getClient();
      const { voices } = await client.voices.getAll();

      console.log("\nAvailable Voices:");
      console.log("=================");

      for (const voice of voices) {
        console.log(`- Name: ${voice.name}`);
        console.log(`  ID: ${voice.voice_id}`);
        console.log(`  Description: ${voice.description || "No description"}`);
        console.log("  --------------");
      }
    } catch (error) {
      console.error("Error fetching voices:", error);
    }
  });

// List models command
program
  .command("list-models")
  .description("List available models")
  .action(async () => {
    try {
      const client = getClient();
      const models = await client.models.getAll();

      console.log("\nAvailable Models:");
      console.log("=================");

      for (const model of models) {
        console.log(`- Name: ${model.name}`);
        console.log(`  ID: ${model.model_id}`);
        console.log(`  Description: ${model.description || "No description"}`);
        console.log("  --------------");
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  });

// Speak command
program
  .command("speak")
  .description("Convert text to speech")
  .argument("<text>", "Text to convert to speech")
  .option("-v, --voice <voice-id>", "Voice ID", DEFAULT_VOICE_ID) // Cassidy
  .option("-m, --model <model-id>", "Model ID", DEFAULT_MODEL_ID)
  .option(
    "-o, --output <filename>",
    "Output file path (default: temporary file)",
  )
  .option("-f, --format <format>", "Output format", "mp3_44100_128")
  .option("--no-play", "Don't play the audio after generating")
  .action(async (text, options) => {
    try {
      const client = getClient();

      console.log("Converting text to speech...");

      const config = getConfig();
      const voiceId = config?.voiceId || options.voice;
      const modelId = config?.modelId || options.model;

      const audioResponse = await client.textToSpeech.convert(voiceId, {
        text,
        model_id: modelId,
        output_format: options.format,
      });

      // Determine the output path
      const outputPath =
        options.output ||
        path.join(os.tmpdir(), `elevenlabs-tts-${Date.now()}.mp3`);

      // Write the audio stream to a file
      const writeStream = fs.createWriteStream(outputPath);
      audioResponse.pipe(writeStream);

      // Wait for the stream to finish writing
      await new Promise((resolve, reject) => {
        writeStream.on("finish", () => resolve(null));
        writeStream.on("error", reject);
      });

      console.log(`Audio saved to: ${outputPath}`);

      // Play the audio if --play option is set (default)
      if (options.play) {
        console.log("Playing audio...");
        await playAudio(outputPath);

        // If it's a temporary file and we're playing it, schedule cleanup
        if (!options.output) {
          setTimeout(() => {
            try {
              fs.unlinkSync(outputPath);
            } catch (err) {
              // Ignore cleanup errors
            }
          }, 5000); // Wait 5 seconds before deleting
        }
      }
    } catch (error) {
      console.error("Error generating speech:", error);
    }
  });

// Add a notification command
program
  .command("notify")
  .description("Send a TTS notification")
  .argument("<text>", "Notification text")
  .option("-v, --voice <voice-id>", "Voice ID", DEFAULT_VOICE_ID) // Rachel voice by default
  .option("-m, --model <model-id>", "Model ID", DEFAULT_MODEL_ID)
  .option("-t, --title <title>", "Notification title", "Notification")
  .action(async (text, options) => {
    try {
      const client = getClient();
      console.log(`Notification: ${options.title}`);

      // Create a temporary file for the audio
      const outputPath = path.join(
        os.tmpdir(),
        `elevenlabs-notify-${Date.now()}.mp3`,
      );

      const config = getConfig();
      const voiceId = config?.voiceId || options.voice;
      const modelId = config?.modelId || options.model;

      console.log("Generating notification audio...");
      const audioResponse = await client.textToSpeech.convert(voiceId, {
        text,
        model_id: modelId,
        output_format: "mp3_44100_128",
      });

      // Write the audio stream to a file
      const writeStream = fs.createWriteStream(outputPath);
      audioResponse.pipe(writeStream);

      // Wait for the stream to finish writing
      await new Promise((resolve, reject) => {
        writeStream.on("finish", () => resolve(null));
        writeStream.on("error", reject);
      });

      // Play the notification
      await playAudio(outputPath);

      // Clean up the temporary file
      setTimeout(() => {
        try {
          fs.unlinkSync(outputPath);
        } catch (err) {
          // Ignore cleanup errors
        }
      }, 5000);
    } catch (error) {
      console.error("Error generating notification:", error);
    }
  });

// Helper function to play audio
async function playAudio(audioPath: string) {
  // Determine the command based on the OS
  let cmd: string;
  let useSpawn = false;
  let spawnArgs: string[] = [];

  switch (process.platform) {
    case "darwin": // macOS
      cmd = `afplay "${audioPath}"`;
      // For macOS, we can use spawn for better control
      useSpawn = true;
      spawnArgs = ["afplay", audioPath];
      break;
    case "win32": // Windows
      // For Windows, we'll use a non-blocking approach
      cmd = `start "" "${audioPath}"`;
      break;
    case "linux": // Linux
      // Try multiple players in order of preference
      if (await commandExists("mpv")) {
        cmd = `mpv --no-terminal "${audioPath}" &`;
        useSpawn = true;
        spawnArgs = ["mpv", "--no-terminal", audioPath];
      } else if (await commandExists("mplayer")) {
        cmd = `mplayer -really-quiet "${audioPath}" &`;
        useSpawn = true;
        spawnArgs = ["mplayer", "-really-quiet", audioPath];
      } else if (await commandExists("aplay")) {
        cmd = `aplay "${audioPath}" &`;
        useSpawn = true;
        spawnArgs = ["aplay", audioPath];
      } else if (await commandExists("paplay")) {
        cmd = `paplay "${audioPath}" &`;
        useSpawn = true;
        spawnArgs = ["paplay", audioPath];
      } else {
        cmd = `xdg-open "${audioPath}"`;
        useSpawn = true;
        spawnArgs = ["xdg-open", audioPath];
      }
      break;
    default: // Other platforms
      cmd = `xdg-open "${audioPath}"`;
      useSpawn = true;
      spawnArgs = ["xdg-open", audioPath];
  }

  try {
    if (useSpawn) {
      // Use spawn for non-blocking execution
      const player = spawn(spawnArgs[0], spawnArgs.slice(1), {
        detached: true,
        stdio: "ignore",
      });

      // Unref the child process so it can run independently
      player.unref();

      console.log("Audio playback started");
      return true;
    }
  } catch (error: unknown) {
    console.error(`Error playing audio: ${(error as Error).message}`);
    console.log("Try installing an audio player like mpv, mplayer, or aplay.");
    return false;
  }
}

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

export { program };
