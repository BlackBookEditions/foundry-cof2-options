/**
 * Maîtrise des compétences par profil (Atlas d'Osgild, p.224-225).
 *
 * `full` : liste des compétences maîtrisées par un personnage dont c'est le profil principal. C'est
 * aussi la liste dans laquelle un personnage d'un autre profil choisit ses compétences hybrides
 * quand il ouvre une voie issue de celui-ci (cf. `HYBRID_SKILL_COUNT`).
 *
 * Clés = `system.slug` des items `profile` du compendium cof2-base (identifiant stable, non localisé).
 */

/**
 * Nombre de compétences maîtrisées à chaque ouverture d'une voie issue d'un autre profil (p.224 :
 * « il obtient la maîtrise de deux compétences de son choix liées à ce profil »). Les nombres variables
 * par profil (1 à 3) de la p.227-228 relèvent de la variante de progression par PEX, non implémentée.
 */
export const HYBRID_SKILL_COUNT = 2

const mage = {
  full: ["artisanat", "connaissances", "occultisme", "sciences"],
}

export const PROFILE_SKILLS = {
  // Combattants
  barbare: {
    full: ["artisanat", "athletisme", "equitation", "escalade", "intimidation", "natation", "survie", "vigilance"],
  },
  chevalier: {
    full: ["athletisme", "connaissances", "equitation", "intimidation", "natation", "persuasion", "religion"],
  },
  guerrier: {
    full: ["artisanat", "athletisme", "equitation", "intimidation", "natation"],
  },

  // Aventuriers
  arquebusier: {
    full: ["artisanat", "athletisme", "equitation", "intimidation", "natation", "sciences", "vigilance"],
  },
  barde: {
    full: [
      "acrobaties",
      "artisanat",
      "athletisme",
      "commerce",
      "connaissances",
      "divertissement",
      "empathie",
      "equitation",
      "intimidation",
      "natation",
      "persuasion",
      "religion",
      "renseignement",
      "tromperie",
    ],
  },
  voleur: {
    full: [
      "acrobaties",
      "artisanat",
      "athletisme",
      "commerce",
      "discretion",
      "escalade",
      "effraction",
      "intimidation",
      "natation",
      "persuasion",
      "renseignement",
      "tromperie",
      "vigilance",
    ],
  },
  rodeur: {
    full: ["acrobaties", "artisanat", "athletisme", "discretion", "equitation", "escalade", "medecine", "natation", "survie", "vigilance"],
  },

  // Mages : les 4 profils de mage de cof2-base partagent la même liste (« Mages : Tous », p.224/228).
  ensorceleur: mage,
  forgesort: mage,
  magicien: mage,
  sorcier: mage,

  // Mystiques
  druide: {
    full: ["artisanat", "athletisme", "connaissances", "discretion", "equitation", "empathie", "medecine", "natation", "religion", "survie", "vigilance"],
  },
  moine: {
    full: ["acrobaties", "artisanat", "athletisme", "connaissances", "discretion", "empathie", "escalade", "medecine", "natation", "religion", "survie", "vigilance"],
  },
  pretre: {
    full: ["artisanat", "athletisme", "connaissances", "empathie", "equitation", "intimidation", "medecine", "persuasion", "religion", "survie"],
  },
}

/**
 * Compétences de peuple (Atlas d'Osgild, p.225) : au lieu du bonus de +3 habituel, la capacité de
 * rang 1 de la voie de peuple donne la maîtrise des compétences suivantes (sans point de bonus).
 * Clés = `system.slug` des voies de peuple (items `path` de subtype "people") du compendium cof2-base.
 * Indexer par voie plutôt que par peuple couvre les demi-elfes, que le livre ne cite pas : chacun suit
 * la voie de peuple de l'un de ses parents (elfe haut, elfe sylvain ou humain) et sa capacité de rang 1.
 * La voie du mage, qui remplace la voie de peuple d'un mage, n'y figure pas : sa capacité de rang 1
 * n'est pas une capacité de peuple au sens de cette règle.
 *
 * Voie de l'humain : `skills` ne contient que la compétence fixe (« artisanat »), la seconde est au
 * choix libre du joueur (`freeChoice`, dialogue de choix dans module/skills.mjs).
 *
 * Non implémenté (exception mineure, à la marge du reste de la règle) : la note du Gnome selon
 * laquelle « au rang 2 de la voie du gnome, le bonus de +3 s'applique également à la compétence
 * persuasion » — cette phrase concerne une capacité de rang 2 distincte, avec un bonus chiffré propre
 * aux règles de base de COF (non repris par l'Atlas), hors du mécanisme de maîtrise ci-dessus.
 */
export const PEOPLE_SKILLS = {
  "voie-du-demi-orc": { skills: ["athletisme", "intimidation"] },
  "voie-de-lelfe-haut": { skills: ["connaissances", "divertissement"] },
  "voie-de-lelfe-sylvain": { skills: ["discretion", "survie"] },
  "voie-du-gnome": { skills: ["sciences", "occultisme"] },
  "voie-de-lhalfelin": { skills: ["discretion", "effraction"] },
  "voie-de-lhumain": { skills: ["artisanat"], freeChoice: 1 },
  "voie-du-nain": { skills: ["artisanat", "vigilance"] },
}
