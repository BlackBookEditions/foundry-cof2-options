/**
 * Constantes du module cof2-options (Atlas d'Osgild / règles optionnelles).
 */

/** Identifiant du module (namespace des flags et des réglages). */
export const MODULE_ID = "cof2-options"

/** Clés des réglages enregistrés via game.settings. */
export const SETTINGS = {
  /** Active le système de compétences de l'Atlas d'Osgild, en plus des tests de caractéristique. */
  enableSkillSystem: "enableSkillSystem",
}

/** Clés des flags posés par le module. */
export const FLAGS = {
  // Sur un acteur (character)
  skills: "skills", // { [skillId]: { bonus: Number, free?: Number } } : bonus de compétence, dont `free` obtenu sans dépenser de point
  skillPointsSpent: "skillPointsSpent", // Number : total de points de compétence dépensés à vie
  hybridChoices: "hybridChoices", // [{ pathUuid, profileSlug, skills: string[] }] : compétences choisies à l'ouverture d'une voie hors profil
  peopleGrant: "peopleGrant", // { pathUuid, slug: string, skills: string[] } : maîtrise accordée par la voie de peuple (rang 1), slug = celui de la voie
}
