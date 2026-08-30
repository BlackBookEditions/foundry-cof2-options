import fs from "node:fs/promises"
import less from "less"

const src = "style/cof2-options.less"
const out = "cof2-options.css"

const input = await fs.readFile(src, "utf8")
const result = await less.render(input, { filename: src })
await fs.writeFile(out, result.css)
console.log(`Compiled ${src} -> ${out}`)
