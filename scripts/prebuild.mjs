import fs from "fs/promises";
import { execSync } from "child_process";

execSync("npm run updateLangsAndRegions");

if (await fs.access("./dist").then(() => true, () => false))
    await fs.rm("./dist", { recursive: true, force: true })