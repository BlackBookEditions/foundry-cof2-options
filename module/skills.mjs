import { MODULE_ID, SETTINGS, FLAGS } from "./config/options.mjs"
import { SKILLS } from "./config/skills.mjs"
import { PROFILE_SKILLS, PEOPLE_SKILLS, HYBRID_SKILL_COUNT } from "./config/skill-mastery.mjs"

/**
 * Système de compétences (Atlas d'Osgild, COF2 chapitre 1, p.223-228).
 *
 * Principe : la maîtrise n'est jamais recalculée à partir de zéro, elle est l'union du profil
 * principal de l'acteur (liste complète p.224), des choix hybrides persistés (voies hors profil,
 * p.224) et de la maîtrise de peuple persistée (voie de peuple, p.225). Le bonus investi
 * par compétence, le total de points dépensés, les choix hybrides et la maîtrise de peuple sont
 * stockés en flags `cof2-options`.
 */

// #region État / réglage

export function isSkillSystemEnabled() {
  try {
    return game.settings.get(MODULE_ID, SETTINGS.enableSkillSystem) === true
  } catch (e) {
    return false
  }
}

/** @returns {string|null} Le slug du profil principal de l'acteur (identifiant stable, ex. "guerrier"). */
export function getPrimaryProfileSlug(actor) {
  return actor.system?.profile?.system?.slug ?? null
}

// #endregion

// #region Maîtrise

/** @returns {Set<string>} L'ensemble des compétences maîtrisées par l'acteur. */
export function getMasteredSkills(actor) {
  const mastered = new Set()
  const primarySlug = getPrimaryProfileSlug(actor)
  if (primarySlug && PROFILE_SKILLS[primarySlug]) {
    for (const skillId of PROFILE_SKILLS[primarySlug].full) mastered.add(skillId)
  }
  const hybridChoices = actor.getFlag(MODULE_ID, FLAGS.hybridChoices) ?? []
  for (const entry of hybridChoices) {
    for (const skillId of entry.skills ?? []) mastered.add(skillId)
  }
  const peopleGrant = actor.getFlag(MODULE_ID, FLAGS.peopleGrant)
  for (const skillId of peopleGrant?.skills ?? []) mastered.add(skillId)
  return mastered
}

// #endregion

// #region Points de compétence / bonus

/** Plafond de valeur d'une compétence (p.227) : niveau + 5, sans jamais dépasser 15. */
export function getSkillCap(actor) {
  const level = actor.system?.attributes?.level ?? 1
  return Math.min(level + 5, 15)
}

/** Pool de points de compétence : 3 par niveau (niveau 1 inclus, p.225). */
export function getSkillPool(actor) {
  const level = actor.system?.attributes?.level ?? 1
  return 3 * level
}

export function getSkillPointsSpent(actor) {
  return actor.getFlag(MODULE_ID, FLAGS.skillPointsSpent) ?? 0
}

export function getSkillPointsAvailable(actor) {
  return Math.max(getSkillPool(actor) - getSkillPointsSpent(actor), 0)
}

export function getSkillBonus(actor, skillId) {
  return actor.getFlag(MODULE_ID, FLAGS.skills)?.[skillId]?.bonus ?? 0
}

/** Part du bonus obtenue sans dépenser de point (double maîtrise de peuple, p.225) : non remboursable. */
export function getSkillFreeBonus(actor, skillId) {
  return actor.getFlag(MODULE_ID, FLAGS.skills)?.[skillId]?.free ?? 0
}

/** Coût pour augmenter la compétence de +1 : 1 point si maîtrisée, 2 sinon (p.225). */
export function getSkillCost(actor, skillId) {
  return getMasteredSkills(actor).has(skillId) ? 1 : 2
}

export async function increaseSkill(actor, skillId) {
  const cost = getSkillCost(actor, skillId)
  const bonus = getSkillBonus(actor, skillId)
  if (bonus >= getSkillCap(actor)) return
  if (getSkillPointsAvailable(actor) < cost) return
  await actor.update({
    [`flags.${MODULE_ID}.${FLAGS.skills}.${skillId}.bonus`]: bonus + 1,
    [`flags.${MODULE_ID}.${FLAGS.skillPointsSpent}`]: getSkillPointsSpent(actor) + cost,
  })
}

/**
 * Diminue le bonus de +1 et rembourse le coût actuel de la compétence.
 * Limitation documentée (README) : le remboursement utilise le coût ACTUEL (maîtrisée ou non), pas
 * l'historique réel des points dépensés — sans conséquence sauf cas très marginal d'aller-retour de
 * maîtrise entre deux investissements.
 */
export async function decreaseSkill(actor, skillId) {
  const bonus = getSkillBonus(actor, skillId)
  if (bonus <= getSkillFreeBonus(actor, skillId)) return
  const cost = getSkillCost(actor, skillId)
  await actor.update({
    [`flags.${MODULE_ID}.${FLAGS.skills}.${skillId}.bonus`]: bonus - 1,
    [`flags.${MODULE_ID}.${FLAGS.skillPointsSpent}`]: Math.max(getSkillPointsSpent(actor) - cost, 0),
  })
}

/** Modèle d'affichage des 22 compétences pour le template de l'onglet. */
export function getSkillsViewModel(actor) {
  const mastered = getMasteredSkills(actor)
  const cap = getSkillCap(actor)
  const available = getSkillPointsAvailable(actor)
  return Object.entries(SKILLS).map(([id, def]) => {
    const isMastered = mastered.has(id)
    const bonus = getSkillBonus(actor, id)
    const cost = isMastered ? 1 : 2
    return {
      id,
      abilities: def.abilities,
      mastered: isMastered,
      bonus,
      canIncrease: bonus < cap && available >= cost,
      canDecrease: bonus > getSkillFreeBonus(actor, id),
    }
  })
}

// #endregion

// #region Jet de compétence

/** Vrai pendant la partie synchrone de `rollSkillCheck` : `skillModifiers` masque alors les bonus de capacité. */
let skillCheckInProgress = false

/**
 * Lance un test de compétence : `1d20 + bonus de compétence + caractéristique`, via le moteur de
 * jet de co2 (`Actor#rollSkill`), qui gère dés bonus/malus, seuil critique et carte de chat.
 * Le titre de la fenêtre de jet reste basé sur la caractéristique (co2 ne l'expose pas autrement) ;
 * le nom de la compétence apparaît via `chatFlavor` dans le message de résultat.
 *
 * Les bonus permanents des capacités ne s'appliquent qu'aux tests de caractéristique (p.226) : ils sont
 * masqués de la fenêtre de jet. `rollSkill` lit les bonus (`getSkillBonuses`) avant son premier `await`,
 * le drapeau n'est donc levé que le temps de l'appel synchrone et ne déborde pas sur un autre jet.
 */
export async function rollSkillCheck(actor, skillId, abilityId) {
  const def = SKILLS[skillId]
  if (!def) return
  const ability = def.abilities.includes(abilityId) ? abilityId : def.abilities[0]
  const bonus = getSkillBonus(actor, skillId)
  // Le malus d'armure AGI est déjà géré par co2 pour skillId === "agi" (systems/co2/module/documents/actor.mjs).
  // La règle Atlas l'étend au CON (p.227), que co2 ne couvre pas nativement : on le complète ici.
  const malus = ability === "con" ? actor.malusFromArmor : 0
  const chatFlavor = game.i18n.localize(`COF2OPTIONS.skills.${skillId}`)
  skillCheckInProgress = true
  try {
    return actor.rollSkill(ability, { bonus, malus, chatFlavor })
  } finally {
    skillCheckInProgress = false
  }
}

// #endregion

// #region Injection UI

/**
 * Hook `renderCOCharacterSheet` : câble les interactions de l'onglet Compétences (jet, +/-). Les tests
 * de caractéristique de l'en-tête restent disponibles : l'Atlas les conserve (p.226-227).
 */
export function wireSkillsTab(application, element) {
  if (!isSkillSystemEnabled()) return
  const actor = application.document
  if (actor?.type !== "character") return

  const tab = element.querySelector('.tab[data-tab="skills"]')
  if (!tab) return

  tab.querySelectorAll('[data-action="cof2OptionsRollSkill"]').forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault()
      rollSkillCheck(actor, el.dataset.skillId, el.dataset.ability)
    })
  })
  tab.querySelectorAll('[data-action="cof2OptionsIncreaseSkill"]').forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault()
      if (!el.classList.contains("disabled")) increaseSkill(actor, el.dataset.skillId)
    })
  })
  tab.querySelectorAll('[data-action="cof2OptionsDecreaseSkill"]').forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault()
      if (!el.classList.contains("disabled")) decreaseSkill(actor, el.dataset.skillId)
    })
  })
}

// #endregion

// #region Maîtrise hybride (voie hors profil, p.224)

let pathProfileIndexPromise = null

/**
 * Index inversé voie → slug du profil propriétaire, construit depuis `ProfileData.paths`.
 * Les clés sont les `system.slug` des voies : `ProfileData.paths` référence les voies du monde ou du
 * compendium, alors que la voie posée sur l'acteur est une copie incorporée (UUID `Actor.x.Item.y`),
 * dont seul le slug permet de retrouver l'original.
 */
async function buildPathProfileIndex() {
  const pathSlugs = new Map() // UUID de voie → slug de voie
  const profiles = [] // { slug, paths }

  const collect = (type, uuid, system) => {
    if (type === "path" && system?.slug) pathSlugs.set(uuid, system.slug)
    else if (type === "profile" && system?.slug) profiles.push({ slug: system.slug, paths: system.paths ?? [] })
  }

  for (const item of game.items) collect(item.type, item.uuid, item.system)

  for (const pack of game.packs.filter((p) => p.documentName === "Item")) {
    let entries
    try {
      entries = await pack.getIndex({ fields: ["type", "system.slug", "system.paths"] })
    } catch (e) {
      continue
    }
    for (const entry of entries) collect(entry.type, entry.uuid, entry.system)
  }

  const index = new Map()
  for (const { slug, paths } of profiles) {
    for (const uuid of paths) {
      const pathSlug = pathSlugs.get(uuid)
      if (pathSlug) index.set(pathSlug, slug)
    }
  }
  return index
}

/** Index construit une seule fois par session (contenu de règles statique). */
function getPathProfileIndex() {
  if (!pathProfileIndexPromise) pathProfileIndexPromise = buildPathProfileIndex()
  return pathProfileIndexPromise
}

/** Dialogue générique de choix de compétences (checkboxes, nombre imposé), réutilisé pour le choix
 * hybride (voie hors profil) et le choix libre de l'Humain (« artisanat et une compétence au choix »). */
async function promptSkillChoice({ title, hint, candidates, count }) {
  const options = candidates
    .map((id) => `<label class="cof2-hybrid-option"><input type="checkbox" name="skill" value="${id}" /> ${game.i18n.localize(`COF2OPTIONS.skills.${id}`)}</label>`)
    .join("")

  return foundry.applications.api.DialogV2.wait({
    classes: ["co", "cof2-hybrid-choice-dialog"],
    window: { title },
    content: `
      <p>${hint}</p>
      <div class="form-group cof2-hybrid-choice">${options}</div>`,
    buttons: [
      {
        action: "confirm",
        label: game.i18n.localize("COF2OPTIONS.dialogs.confirm"),
        default: true,
        callback: (event, button) => Array.from(button.form.querySelectorAll('input[name="skill"]:checked')).map((el) => el.value),
      },
      { action: "cancel", label: game.i18n.localize("COF2OPTIONS.dialogs.cancel"), callback: () => null },
    ],
    render: (event, dialog) => {
      const checkboxes = Array.from(dialog.element.querySelectorAll('input[name="skill"]'))
      const enforce = () => {
        const checked = checkboxes.filter((c) => c.checked).length
        checkboxes.forEach((c) => {
          if (!c.checked) c.disabled = checked >= count
        })
      }
      checkboxes.forEach((c) => c.addEventListener("change", enforce))
      enforce()
    },
    rejectClose: false,
    modal: true,
  })
}

/**
 * Hook `createItem` : détecte l'ouverture d'une voie issue d'un autre profil et propose le choix
 * des compétences accordées (p.224 « profil hybride »). Double le bonus déjà investi dans les
 * compétences choisies qui n'étaient pas encore maîtrisées (p.226).
 */
export async function onCreatePath(item, options, userId) {
  if (!isSkillSystemEnabled()) return
  if (game.user.id !== userId) return
  const actor = item.parent
  if (item.type !== "path" || actor?.type !== "character") return

  if (item.system.subtype === "people") {
    await maybeGrantPeopleSkills(actor, item)
    return
  }

  const primarySlug = getPrimaryProfileSlug(actor)
  if (!primarySlug) return

  const index = await getPathProfileIndex()
  const ownerSlug = index.get(item.system.slug)
  if (!ownerSlug || ownerSlug === primarySlug) return

  const existing = actor.getFlag(MODULE_ID, FLAGS.hybridChoices) ?? []
  if (existing.some((e) => e.pathUuid === item.uuid)) return

  const entry = PROFILE_SKILLS[ownerSlug]
  if (!entry) return

  const mastered = getMasteredSkills(actor)
  const available = entry.full.filter((skillId) => !mastered.has(skillId))
  if (available.length === 0) return

  const count = Math.min(HYBRID_SKILL_COUNT, available.length)
  const profileLabel = game.i18n.localize(`COF2OPTIONS.profiles.${ownerSlug}`)
  const chosen = await promptSkillChoice({
    title: game.i18n.localize("COF2OPTIONS.dialogs.hybridChoice.title"),
    hint: game.i18n.format("COF2OPTIONS.dialogs.hybridChoice.hint", { count, profile: profileLabel }),
    candidates: available,
    count,
  })
  if (!chosen?.length) return

  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, FLAGS.skills) ?? {})
  for (const skillId of chosen) {
    const current = skills[skillId]?.bonus ?? 0
    if (current > 0) skills[skillId] = { ...skills[skillId], bonus: current * 2 }
  }

  await actor.update({
    [`flags.${MODULE_ID}.${FLAGS.hybridChoices}`]: [...existing, { pathUuid: item.uuid, profileSlug: ownerSlug, skills: chosen }],
    [`flags.${MODULE_ID}.${FLAGS.skills}`]: skills,
  })
}

/** Hook `deleteItem` : retire la maîtrise accordée (hybride ou peuple) si la voie correspondante est supprimée. */
export async function onDeletePath(item, options, userId) {
  if (!isSkillSystemEnabled()) return
  if (game.user.id !== userId) return
  const actor = item.parent
  if (item.type !== "path" || actor?.type !== "character") return

  const updates = {}

  const existing = actor.getFlag(MODULE_ID, FLAGS.hybridChoices) ?? []
  if (existing.some((e) => e.pathUuid === item.uuid)) {
    updates[`flags.${MODULE_ID}.${FLAGS.hybridChoices}`] = existing.filter((e) => e.pathUuid !== item.uuid)
  }

  const peopleGrant = actor.getFlag(MODULE_ID, FLAGS.peopleGrant)
  if (peopleGrant?.pathUuid === item.uuid) {
    updates[`flags.${MODULE_ID}.${FLAGS.peopleGrant}`] = null
  }

  if (Object.keys(updates).length > 0) await actor.update(updates)
}

// #endregion

// #region Maîtrise de peuple (voie de peuple, p.225)

/**
 * Octroie la maîtrise de peuple (p.225) une seule fois, dès que la capacité de rang 1 de la voie de
 * peuple est apprise (`path.system.rank >= 1`). Pour l'Humain, propose le choix libre de la seconde
 * compétence. Applique la règle de double maîtrise (profil/hybride + peuple → 2 points de compétence
 * supplémentaires à investir dans la compétence concernée, p.225).
 */
async function maybeGrantPeopleSkills(actor, pathItem) {
  if (pathItem.system.subtype !== "people") return
  if (actor.getFlag(MODULE_ID, FLAGS.peopleGrant)) return
  if ((pathItem.system.rank ?? 0) < 1) return

  const pathSlug = pathItem.system.slug
  const entry = PEOPLE_SKILLS[pathSlug]
  if (!entry) return

  let skills = [...entry.skills]
  if (entry.freeChoice) {
    const choice = await promptSkillChoice({
      title: game.i18n.localize("COF2OPTIONS.dialogs.peopleChoice.title"),
      hint: game.i18n.localize("COF2OPTIONS.dialogs.peopleChoice.hintHuman"),
      candidates: Object.keys(SKILLS).filter((id) => !skills.includes(id)),
      count: entry.freeChoice,
    })
    if (!choice?.length) return
    skills.push(...choice)
  }

  // Double maîtrise (déjà mastered via profil/hybride) : 2 points de compétence supplémentaires
  // obligatoirement investis dans cette compétence, plutôt qu'une maîtrise redondante (p.225).
  // Ces +2 ne sortent pas du pool : ils sont marqués `free` pour ne pas être remboursés par « − ».
  const mastered = getMasteredSkills(actor)
  const skillsFlag = foundry.utils.deepClone(actor.getFlag(MODULE_ID, FLAGS.skills) ?? {})
  for (const skillId of skills) {
    if (mastered.has(skillId)) {
      const current = skillsFlag[skillId] ?? {}
      skillsFlag[skillId] = { ...current, bonus: (current.bonus ?? 0) + 2, free: (current.free ?? 0) + 2 }
    }
  }

  await actor.update({
    [`flags.${MODULE_ID}.${FLAGS.peopleGrant}`]: { pathUuid: pathItem.uuid, slug: pathSlug, skills },
    [`flags.${MODULE_ID}.${FLAGS.skills}`]: skillsFlag,
  })
}

/** Hook `updateItem` : détecte le passage au rang 1 d'une voie de peuple (capacités apprises après coup). */
export async function onUpdatePath(item, changes, options, userId) {
  if (!isSkillSystemEnabled()) return
  if (game.user.id !== userId) return
  const actor = item.parent
  if (item.type !== "path" || actor?.type !== "character") return
  await maybeGrantPeopleSkills(actor, item)
}

// #endregion

// #region Bonus de capacité filtrés (p.225-226)

/** @returns {Item|null} L'item capacité de l'acteur dont provient le modifier, sinon null. */
function getOwnCapacity(actor, modifier) {
  // Modifier → Action → données de la capacité → item capacité. On remonte la chaîne de documents plutôt que
  // `source`, qui peut encore pointer vers le compendium d'origine. Un modifier reçu par effet (CustomEffectData)
  // n'aboutit pas à un item de l'acteur et n'est donc jamais filtré.
  const capacity = modifier.parent?.parent?.parent
  return capacity?.type === "capacity" && capacity.parent === actor ? capacity : null
}

/**
 * La capacité de rang 1 d'une voie de peuple de `PEOPLE_SKILLS` donne la maîtrise de compétences
 * « au lieu d'obtenir un bonus de +3 » (p.225). Ses modifiers de sous-type `skill` (le +3 aux tests de
 * caractéristique, ex. Lumière intérieure : +3 INT et CHA) sont donc ignorés tant que l'option est active.
 * Ses autres effets (vision dans le noir, +1 DEF de l'halfelin…) sont conservés.
 */
function isReplacedPeopleBonus(actor, modifier) {
  const capacity = getOwnCapacity(actor, modifier)
  if (!capacity) return false
  const path = actor.items.get(foundry.utils.parseUuid(capacity.system.path ?? "")?.id)
  if (path?.system.subtype !== "people" || !PEOPLE_SKILLS[path.system.slug]) return false
  return path.system.capacities.indexOf(capacity.uuid) === 0
}

/**
 * Bonus permanent (action non activable) d'une capacité de l'acteur : s'il est conservé, il ne sert « que
 * pour les tests de caractéristique » et ne peut « jamais » servir à un test de compétence (p.226).
 * Les capacités activables (sorts, postures…) et les effets reçus d'autres acteurs restent proposés.
 */
function isCapacityTestBonus(actor, modifier) {
  return !!getOwnCapacity(actor, modifier) && !modifier.parent.properties?.activable
}

/**
 * Filtre `skillModifiers` du modèle de personnage co2, seule source des bonus proposés par la fenêtre de
 * jet (`COActor#getSkillBonuses`) : bonus de peuple remplacés pour tous les tests, bonus permanents de
 * capacité en plus pendant un test de compétence. À appeler au hook `init`, réglage actif.
 */
export function installPeopleBonusFilter() {
  const CharacterData = CONFIG.Actor.dataModels?.character
  if (!CharacterData) return
  let proto = CharacterData.prototype
  let descriptor
  while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto, "skillModifiers"))) proto = Object.getPrototypeOf(proto)
  if (!descriptor?.get) return
  const original = descriptor.get
  Object.defineProperty(CharacterData.prototype, "skillModifiers", {
    configurable: true,
    get() {
      return original.call(this).filter((m) => !isReplacedPeopleBonus(this.parent, m) && !(skillCheckInProgress && isCapacityTestBonus(this.parent, m)))
    },
  })
}

// #endregion
