process.on("warning", (warning) => {
  if (warning.name === "ExperimentalWarning") {
    return; // Suppress SEA-related experimental warnings
  }
  console.warn(warning.stack);
});
