import fs from "fs/promises";

await fs.copyFile("./LICENSE", "./dist/LICENSE");
await fs.copyFile("./src/types.d.ts", "./dist/types.d.ts");

const packageObj = JSON.parse(await fs.readFile("./package.json", "utf8"));
delete packageObj.private;
delete packageObj.devDependencies;
delete packageObj.scripts;
await fs.writeFile("./dist/package.json", JSON.stringify(packageObj, null, 2));