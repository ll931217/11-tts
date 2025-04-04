# 11-tts

This is a TTS CLI command that I created to act like a notification system for when I am compiling or uploading something, I just use it as follows:

```bash
11-tts speak "Your CLI has finished compiling and uploaded to Google Drive"
```

## Build from source

Requirements

- Get an API key from [ElevenLabs](https://elevenlabs.io/app/settings/api-keys)
- Install [pnpm](https://pnpm.io/installation).
- Use pnpm to install any [Nodejs](https://pnpm.io/cli/env) version that is v20 and up.
- Download [Nodejs v22.11](https://nodejs.org/en/download), select the Standalone Binary option (We need the binary to be compiled into an executable).

Your directory should look like this:

```bash
 ~/Projects  ls -l
drwxr-xr-x - ll931217  4 Apr 10:37  11-tts
drwxr-xr-x - ll931217 29 Oct  2024  node-v22.11.0-linux-x64
```

Then inside the `11-tts` directory, run the following commands

```bash
export ELEVENLABS_API_KEY=<your_api_key>
pnpm i
make build
```
