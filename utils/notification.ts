import { spawn } from "node:child_process";
import { commandExists } from "./common";

// Helper function to send system notifications
export async function sendNotification(title: string, message: string) {
  switch (process.platform) {
    case "darwin": // macOS
      if (await commandExists("osascript")) {
        const script = `display notification "${message}" with title "${title}"`;
        spawn("osascript", ["-e", script], { stdio: "ignore" });
      }
      break;
    case "win32": // Windows
      if (await commandExists("powershell")) {
        const script = `
          [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms')
          [System.Windows.Forms.MessageBox]::Show('${message}', '${title}')
        `;
        spawn("powershell", ["-Command", script], { stdio: "ignore" });
      }
      break;
    case "linux": // Linux
      if (await commandExists("notify-send")) {
        spawn("notify-send", [title, message], { stdio: "ignore" });
      }
      break;
  }
}

// Helper function to play audio
export async function playAudio(audioPath: string) {
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
