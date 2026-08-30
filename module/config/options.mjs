/**
 * Constantes du module cof2-options (Atlas d'Osgild / règles optionnelles).
 */

/** Identifiant du module (namespace des flags et des réglages). */
export const MODULE_ID = "cof2-options"

/** Clés des réglages enregistrés via game.settings. */
export const SETTINGS = {
  /** Active le système de compétences de l'Atlas d'Osgild à la place des tests de caractéristique bruts. */
  enableSkillSystem: "enableSkillSystem",
}

/** Clés des flags posés par le module. */
export const FLAGS = {
  // Sur un acteur (character)
  skills: "skills", // { [skillId]: { bonus: Number } } : bonus de compétence investi
  skillPointsSpent: "skillPointsSpent", // Number : total de points de compétence dépensés à vie
  hybridChoices: "hybridChoices", // { [pathUuid]: string[] } : compétences choisies à l'ouverture d'une voie hors profil
}
