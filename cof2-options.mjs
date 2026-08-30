import { MODULE_ID, SETTINGS } from "./module/config/options.mjs"
import { isSkillSystemEnabled, getSkillsViewModel, getSkillPool, getSkillPointsSpent, getSkillPointsAvailable, getSkillCap, wireSkillsTab, onCreatePath, onDeletePath } from "./module/skills.mjs"

Hooks.once("init", () => {
  console.info("COF2 Options | Initialisation du module...")

  game.settings.register(MODULE_ID, SETTINGS.enableSkillSystem, {
    name: "COF2OPTIONS.settings.enableSkillSystem.name",
    hint: "COF2OPTIONS.settings.enableSkillSystem.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true,
  })

  // Ajout de l'onglet « Compétences » avant « Voies & Capacités » (TABS/PARTS ne sont pas figés,
  // c'est la technique standard pour ajouter un onglet à une fiche ApplicationV2 depuis un module tiers).
  if (isSkillSystemEnabled()) {
    const Sheet = game.system?.api?.applications?.CharacterSheet
    const tabs = Sheet?.TABS?.primary?.tabs
    if (tabs && !tabs.some((t) => t.id === "skills")) {
      const idx = tabs.findIndex((t) => t.id === "paths")
      tabs.splice(idx === -1 ? tabs.length : idx, 0, { id: "skills", label: "COF2OPTIONS.sheet.tabs.skills" })
      Sheet.PARTS.skills = { template: "modules/cof2-options/templates/actors/character-skills.hbs" }
    }
  }

  Handlebars.registerHelper("cof2OptionsSkills", (actor) => getSkillsViewModel(actor))
  Handlebars.registerHelper("cof2OptionsEconomy", (actor) => ({
    pool: getSkillPool(actor),
    spent: getSkillPointsSpent(actor),
    available: getSkillPointsAvailable(actor),
    cap: getSkillCap(actor),
  }))

  console.info("COF2 Options | Fin de l'initialisation du module")
})

// Repli si le champ `label` par onglet n'est pas lu par `_prepareTabs()` de Foundry (core, non vérifiable
// depuis ce dépôt) : on ajoute la clé au namespace CO.* du système sans toucher aux traductions existantes.
Hooks.once("i18nInit", () => {
  if (!isSkillSystemEnabled()) return
  foundry.utils.mergeObject(game.i18n.translations, { CO: { sheet: { tabs: { character: { skills: game.i18n.localize("COF2OPTIONS.sheet.tabs.skills") } } } } })
})

// Injection UI : neutralisation du clic caractéristique + câblage de l'onglet Compétences (classe COCharacterSheet)
Hooks.on("renderCOCharacterSheet", wireSkillsTab)

// Maîtrise hybride : ouverture/suppression d'une voie hors profil principal
Hooks.on("createItem", onCreatePath)
Hooks.on("deleteItem", onDeletePath)
