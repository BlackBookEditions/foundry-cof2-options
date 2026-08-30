<h2> Module <em>Chroniques Oubliées Fantasy 2e édition : Options</em> pour Foundry Virtual TableTop</h2>

Module pour le système **Chroniques Oubliées 2** qui ajoute des règles issues de l'**Atlas d'Osgild** et des **règles optionnelles**, sans modifier le système.

<p align="center">
    <img alt="Foundry Version 14 support" src="https://img.shields.io/badge/Foundry-v14-informational">
</p>

## Comment installer le module ?
Il faut installer le module depuis son manifeste.
Depuis l'accueil, dans l'onglet Modules :
- Installer un module
- Saisir l'url du manifeste : (à compléter au premier release)

## Fonctionnalités

### Système de compétences (Atlas d'Osgild)

Règle optionnelle qui remplace les tests de caractéristique bruts de CO2 par 22 compétences nommées (chacune liée à une ou deux caractéristiques), avec maîtrise, points de compétence par niveau et plafond de valeur.

Activation : réglage monde **« Système de compétences (Atlas d'Osgild) »** (nécessite un rechargement). Une fois actif :
- Un onglet **Compétences** apparaît sur la fiche de personnage, juste avant « Voies & Capacités ».
- Le clic direct sur une caractéristique dans l'en-tête de fiche n'ouvre plus de jet : tous les tests passent par l'onglet Compétences.
- La **maîtrise** est calculée automatiquement : toutes les compétences du profil principal, plus 1 à 3 compétences au choix à chaque fois qu'une voie issue d'un autre profil est ouverte (personnage hybride).
- À chaque niveau, 3 points de compétence sont disponibles pour augmenter le bonus d'une compétence (coût : 1 point si elle est maîtrisée, 2 points sinon). Le bonus est plafonné à `niveau + 5` (maximum absolu +15).
- Le malus d'armure s'applique automatiquement aux tests basés sur l'Agilité ou la Constitution.

**Périmètre v1** : cœur de la règle uniquement. La variante de progression par PEX, la conversion « bonus de capacité → points de compétence » et les « compétences de peuple » (règles secondaires optionnelles du même chapitre) ne sont pas implémentées.

**Limitations connues** :
- La mini-fiche de personnage n'est pas concernée : son clic caractéristique reste un jet co2 standard même réglage actif.
- Si une voie hors profil est retirée après investissement de points dans une compétence devenue non-maîtrisée, le bonus déjà investi est conservé tel quel (pas de remboursement rétroactif) ; seul le coût futur par point repasse à 2.
- Cette option n'est disponible que sur les personnages joueurs (`type: character`), pas sur les PNJ (`encounter`).

## Contributeurs
- Ce module a été réalisé par Kristov

## Mentions Légales
© Black Book Éditions, 2026. Chroniques Oubliées Fantasy est une marque déposée par Black Book Éditions. Tous droits réservés.
Le texte et les images sont la propriété de Black Book Éditions.

## Communauté
Rejoignez-nous sur le serveur <a href="https://discord.com/invite/pPSDNJk">Discord francophone dédié à Foundry Virtual Tabletop</a>
Nous serons ravis d'avoir vos retours sur le module, des signalements de bug, des idées d'amélioration, ou simplement des encouragements !

## Licences
- Le code HTML, CSS et Javascript de ce projet est placé sous <a href="https://choosealicense.com/licenses/gpl-3.0/">licence GNU General Public License v3.0</a>
- Le support de Foundry VTT est couvert par la licence suivante : <a href="https://foundryvtt.com/article/license/">Accord de licence limitée pour le développement de modules du 17/02/2021</a>.