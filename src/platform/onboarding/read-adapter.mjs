const loaded = await import(process.argv[2]);
const value = loaded && typeof loaded === "object" && loaded.default ? loaded.default : loaded;
process.stdout.write(JSON.stringify(value));
