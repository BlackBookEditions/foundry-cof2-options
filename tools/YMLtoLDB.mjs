// Compile les sources YAML de src/packs/ en compendiums LevelDB dans packs/ (Foundry fermé)
import { compilePack } from "@foundryvtt/foundryvtt-cli"
import { promises as fs } from "fs"

const MODULE_DIR = process.cwd()

for (const pack of await fs.readdir("./src/packs")) {
  console.log(`Compilation de ${pack}`)
  await compilePack(`${MODULE_DIR}/src/packs/${pack}`, `${MODULE_DIR}/packs/${pack}`, { yaml: true })
}
