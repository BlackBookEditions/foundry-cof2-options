/**
 * Génère la source YAML du compendium du guide (src/packs/guide) à partir des pages HTML de guide/html/.
 * Dans les pages, `@@page:<fichier>@@` devient un lien vers la page du guide.
 * Les identifiants sont fixes pour que les liens et les mises à jour restent stables : `npm run guide`, puis `npm run YMLtoLDB` (Foundry fermé).
 * Le flag `cof2-base.isJournalCOF` donne au journal la mise en page des journaux du Livre des règles quand cof2-base est actif.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs"
import yaml from "js-yaml"

const MODULE_ID = "cof2-options"
const PACK = "guide"
const JOURNAL_ID = "cwOU2QizqgCmB57H"
const JOURNAL_NAME = "Guide du module Options"

/** Pages dans l'ordre du guide : fichier HTML, identifiant de page, titre */
const PAGES = [
  { file: "introduction", id: "aQaMFrNXW471Niy9", title: "Introduction" },
  { file: "competences", id: "CCwqekLQvFbTu1Fk", title: "Les compétences" },
  { file: "maitrise", id: "Lsf0qafANNj8ONRu", title: "La maîtrise" },
  { file: "fiche", id: "aJ0nQq1LyiPCMM4m", title: "Sur la fiche de personnage" },
  { file: "limites", id: "HaqlOwpAEmpo3tX8", title: "Limites et écarts" },
]

const pageLink = (file) => {
  const page = PAGES.find((p) => p.file === file)
  if (!page) throw new Error(`Page inconnue : ${file}`)
  return `@UUID[Compendium.${MODULE_ID}.${PACK}.JournalEntry.${JOURNAL_ID}.JournalEntryPage.${page.id}]{${page.title}}`
}

const pages = PAGES.map((page, index) => {
  const content = readFileSync(`guide/html/${page.file}.html`, "utf-8")
    .replace(/@@page:([a-z]+)@@/g, (_, file) => pageLink(file))
    .trimEnd()
  return {
    _id: page.id,
    name: page.title,
    type: "text",
    title: { show: false, level: 1 },
    image: {},
    text: { format: 1, content },
    video: { controls: true, volume: 0.5 },
    src: null,
    system: {},
    sort: (index + 1) * 100000,
    ownership: { default: -1 },
    flags: {},
    _key: `!journal.pages!${JOURNAL_ID}.${page.id}`,
  }
})

const journal = {
  _id: JOURNAL_ID,
  name: JOURNAL_NAME,
  pages,
  folder: null,
  sort: 0,
  ownership: { default: 0 },
  flags: { "cof2-base": { isJournalCOF: true } },
  _key: `!journal!${JOURNAL_ID}`,
}

const dir = `src/packs/${PACK}`
if (existsSync(dir)) for (const f of readdirSync(dir)) rmSync(`${dir}/${f}`)
mkdirSync(dir, { recursive: true })
const fileName = `${dir}/journal_Guide_du_module_${JOURNAL_ID}.yml`
writeFileSync(fileName, yaml.dump(journal, { lineWidth: -1, noRefs: true }))
console.log(`${fileName} : ${pages.length} pages`)
