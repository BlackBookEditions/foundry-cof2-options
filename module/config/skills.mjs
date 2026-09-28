/**
 * Les 22 compétences du système de compétence de l'Atlas d'Osgild (COF2, chapitre 1, p.223-224).
 * Chaque compétence est liée à une ou deux caractéristiques (id co2 : for/agi/con/per/cha/int/vol).
 *
 * Athlétisme est décrite dans le livre comme « (Variable) » : courir et sauter (AGI ou FOR), lancer loin ou soulever un objet lourd (FOR), marcher ou courir longtemps (CON).
 * Quand une compétence a plusieurs caractéristiques, le joueur choisit celle du test sur la fiche.
 */
export const SKILLS = {
  acrobaties: { abilities: ["agi"] },
  artisanat: { abilities: ["int"] },
  athletisme: { abilities: ["agi", "for", "con"] },
  commerce: { abilities: ["cha"] },
  connaissances: { abilities: ["int"] },
  discretion: { abilities: ["agi"] },
  divertissement: { abilities: ["cha"] },
  effraction: { abilities: ["agi"] },
  empathie: { abilities: ["per"] },
  equitation: { abilities: ["agi", "cha"] },
  escalade: { abilities: ["agi"] },
  intimidation: { abilities: ["cha"] },
  medecine: { abilities: ["per"] },
  natation: { abilities: ["con"] },
  occultisme: { abilities: ["int"] },
  persuasion: { abilities: ["cha"] },
  religion: { abilities: ["int"] },
  renseignement: { abilities: ["cha"] },
  sciences: { abilities: ["int"] },
  survie: { abilities: ["per"] },
  tromperie: { abilities: ["cha"] },
  vigilance: { abilities: ["per"] },
}

/** Malus d'armure applicable (p.227) : compétences basées sur l'AGI ou sur le CON. */
export const ARMOR_MALUS_ABILITIES = ["agi", "con"]
