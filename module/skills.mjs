import { MODULE_ID, SETTINGS, FLAGS } from "./config/options.mjs"
import { SKILLS } from "./config/skills.mjs"
import { PROFILE_SKILLS } from "./config/skill-mastery.mjs"

/**
 * Système de compétences (Atlas d'Osgild, COF2 chapitre 1, p.223-228).
 *
 * Principe : la maîtrise n'est jamais stockée, elle est recalculée à la volée à partir du profil
 * principal de l'acteur (liste complète p.224) et des choix hybrides persistés (voies hors profil,
 * p.224 + p.227-228). Seuls le bonus investi par compétence, le total de points dépensés et les
 * choix hybrides sont stockés en flags `cof2-options`.
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
  if (bonus <= 0) return
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
      canDecrease: bonus > 0,
    }
  })
}

// #endregion

// #region Jet de compétence

/**
 * Lance un test de compétence : `1d20 + bonus de compétence + caractéristique`, via le moteur de
 * jet de co2 (`Actor#rollSkill`), qui gère dés bonus/malus, seuil critique et carte de chat.
 * Le titre de la fenêtre de jet reste basé sur la caractéristique (co2 ne l'expose pas autrement) ;
 * le nom de la compétence apparaît via `chatFlavor` dans le message de résultat.
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
  return actor.rollSkill(ability, { bonus, malus, chatFlavor })
}

// #endregion

// #region Injection UI

/**
 * Hook `renderCOCharacterSheet` : neutralise le clic caractéristique brut de l'en-tête (remplacé
 * par l'onglet Compétences) et câble les interactions de cet onglet (jet, +/-).
 */
export function wireSkillsTab(application, element) {
  if (!isSkillSystemEnabled()) return
  const actor = application.document
  if (actor?.type !== "character") return

  element.querySelectorAll('[data-roll-type="skillcheck"]').forEach((el) => el.removeAttribute("data-action"))

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

// #region Maîtrise hybride (voie hors profil, p.224 + p.227-228)

let pathProfileIndexPromise = null

/** Index inversé voie (UUID) → slug du profil propriétaire, construit depuis `ProfileData.paths`. */
async function buildPathProfileIndex() {
  const index = new Map()

  const registerProfile = (slug, paths) => {
    if (!slug) return
    for (const uuid of paths ?? []) index.set(uuid, slug)
  }

  for (const profile of game.items.filter((i) => i.type === "profile")) {
    registerProfile(profile.system.slug, profile.system.paths)
  }

  for (const pack of game.packs.filter((p) => p.documentName === "Item")) {
    let entries
    try {
      entries = await pack.getIndex({ fields: ["type", "system.slug", "system.paths"] })
    } catch (e) {
      continue
    }
    for (const entry of entries) {
      if (entry.type !== "profile") continue
      registerProfile(entry.system?.slug, entry.system?.paths)
    }
  }

  return index
}

/** Index construit une seule fois par session (contenu de règles statique). */
function getPathProfileIndex() {
  if (!pathProfileIndexPromise) pathProfileIndexPromise = buildPathProfileIndex()
  return pathProfileIndexPromise
}

/** Dialogue de choix des compétences accordées par une voie hors profil. */
async function promptHybridChoice(profileSlug, available, count) {
  const profileLabel = game.i18n.localize(`COF2OPTIONS.profiles.${profileSlug}`)
  const options = available
    .map((id) => `<label class="cof2-hybrid-option"><input type="checkbox" name="skill" value="${id}" /> ${game.i18n.localize(`COF2OPTIONS.skills.${id}`)}</label>`)
    .join("")

  return foundry.applications.api.DialogV2.wait({
    classes: ["co", "cof2-hybrid-choice-dialog"],
    window: { title: game.i18n.localize("COF2OPTIONS.dialogs.hybridChoice.title") },
    content: `
      <p>${game.i18n.format("COF2OPTIONS.dialogs.hybridChoice.hint", { count, profile: profileLabel })}</p>
      <div class="form-group cof2-hybrid-choice">${options}</div>`,
    buttons: [
      {
        action: "confirm",
        label: game.i18n.localize("COF2OPTIONS.dialogs.hybridChoice.confirm"),
        default: true,
        callback: (event, button) => Array.from(button.form.querySelectorAll('input[name="skill"]:checked')).map((el) => el.value),
      },
      { action: "cancel", label: game.i18n.localize("COF2OPTIONS.dialogs.hybridChoice.cancel"), callback: () => null },
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

  const primarySlug = getPrimaryProfileSlug(actor)
  if (!primarySlug) return

  const index = await getPathProfileIndex()
  const ownerSlug = index.get(item.uuid)
  if (!ownerSlug || ownerSlug === primarySlug) return

  const existing = actor.getFlag(MODULE_ID, FLAGS.hybridChoices) ?? []
  if (existing.some((e) => e.pathUuid === item.uuid)) return

  const entry = PROFILE_SKILLS[ownerSlug]
  if (!entry) return

  const mastered = getMasteredSkills(actor)
  const available = entry.full.filter((skillId) => !mastered.has(skillId))
  if (available.length === 0) return

  const count = Math.min(entry.hybridCount, available.length)
  const chosen = await promptHybridChoice(ownerSlug, available, count)
  if (!chosen?.length) return

  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, FLAGS.skills) ?? {})
  for (const skillId of chosen) {
    const current = skills[skillId]?.bonus ?? 0
    if (current > 0) skills[skillId] = { bonus: current * 2 }
  }

  await actor.update({
    [`flags.${MODULE_ID}.${FLAGS.hybridChoices}`]: [...existing, { pathUuid: item.uuid, profileSlug: ownerSlug, skills: chosen }],
    [`flags.${MODULE_ID}.${FLAGS.skills}`]: skills,
  })
}

/** Hook `deleteItem` : retire la maîtrise accordée si la voie hors profil correspondante est supprimée. */
export async function onDeletePath(item, options, userId) {
  if (!isSkillSystemEnabled()) return
  if (game.user.id !== userId) return
  const actor = item.parent
  if (item.type !== "path" || actor?.type !== "character") return

  const existing = actor.getFlag(MODULE_ID, FLAGS.hybridChoices) ?? []
  if (!existing.some((e) => e.pathUuid === item.uuid)) return

  await actor.setFlag(
    MODULE_ID,
    FLAGS.hybridChoices,
    existing.filter((e) => e.pathUuid !== item.uuid),
  )
}

// #endregion
