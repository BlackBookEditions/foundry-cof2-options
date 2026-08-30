/**
 * Maîtrise des compétences par profil (Atlas d'Osgild, p.224-225 et p.227-228).
 *
 * `full` : liste des compétences maîtrisées par un personnage dont c'est le profil principal.
 * `hybridCount` : nombre de compétences à choisir dans cette même liste (le livre reprend
 * exactement la liste `full` pour le choix hybride, seul le nombre à choisir change) quand un
 * personnage d'un autre profil ouvre une voie issue de celui-ci.
 *
 * Clés = `system.slug` des items `profile` du compendium cof2-base (identifiant stable, non localisé).
 */

const mage = {
  full: ["artisanat", "connaissances", "occultisme", "sciences"],
  hybridCount: 1,
}

export const PROFILE_SKILLS = {
  // Combattants
  barbare: {
    full: ["artisanat", "athletisme", "equitation", "escalade", "intimidation", "natation", "survie", "vigilance"],
    hybridCount: 2,
  },
  chevalier: {
    full: ["athletisme", "connaissances", "equitation", "intimidation", "natation", "persuasion", "religion"],
    hybridCount: 2,
  },
  guerrier: {
    full: ["artisanat", "athletisme", "equitation", "intimidation", "natation"],
    hybridCount: 1,
  },

  // Aventuriers
  arquebusier: {
    full: ["artisanat", "athletisme", "equitation", "intimidation", "natation", "sciences", "vigilance"],
    hybridCount: 2,
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
    hybridCount: 3,
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
    hybridCount: 3,
  },
  rodeur: {
    full: ["acrobaties", "artisanat", "athletisme", "discretion", "equitation", "escalade", "medecine", "natation", "survie", "vigilance"],
    hybridCount: 3,
  },

  // Mages : les 4 profils de mage de cof2-base partagent la même liste (« Mages : Tous », p.224/228).
  ensorceleur: mage,
  forgesort: mage,
  magicien: mage,
  sorcier: mage,

  // Mystiques
  druide: {
    full: ["artisanat", "athletisme", "connaissances", "discretion", "equitation", "empathie", "medecine", "natation", "religion", "survie", "vigilance"],
    hybridCount: 3,
  },
  moine: {
    full: ["acrobaties", "artisanat", "athletisme", "connaissances", "discretion", "empathie", "escalade", "medecine", "natation", "religion", "survie", "vigilance"],
    hybridCount: 3,
  },
  pretre: {
    full: ["artisanat", "athletisme", "connaissances", "empathie", "equitation", "intimidation", "medecine", "persuasion", "religion", "survie"],
    hybridCount: 3,
  },
}
