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

### Guide du module

Le compendium **« COF2 Options - Guide du module »** décrit les règles implémentées et leur utilisation dans Foundry. Il prend la mise en page des journaux du Livre des règles quand le module `cof2-base` est actif.

Les pages sont écrites en HTML dans `guide/html/`. Après modification : `npm run guide` (génère `src/packs/guide`), puis `npm run YMLtoLDB` Foundry fermé (la CI compile les packs à chaque release).

### Système de compétences (Atlas d'Osgild)

Règle optionnelle qui ajoute aux tests de caractéristique de CO2 22 compétences nommées (chacune liée à une ou plusieurs caractéristiques), avec maîtrise, points de compétence par niveau et plafond de valeur. Test de compétence : `1d20 + bonus de compétence + caractéristique`.

Activation : réglage monde **« Système de compétences (Atlas d'Osgild) »** (nécessite un rechargement). Une fois actif :
- Un onglet **Compétences** apparaît sur la fiche de personnage, juste avant « Voies & Capacités ». Les tests de caractéristique de l'en-tête restent disponibles.
- Les boutons « + » / « − » et le compteur de points (disponibles / total) n'apparaissent qu'en mode Édition (fiche déverrouillée).
- Cliquer sur le nom d'une compétence lance le test avec sa première caractéristique ; cliquer sur l'abréviation d'une caractéristique (ex. `AGI / FOR / CON` pour Athlétisme, `AGI / CHA` pour Équitation) lance le test avec celle-ci.
- La **maîtrise** est calculée automatiquement : toutes les compétences du profil principal, plus 2 compétences au choix dans la liste d'un autre profil à chaque fois qu'une voie issue de ce profil est ouverte (personnage hybride), plus 2 compétences liées au peuple dès que la capacité de rang 1 de sa voie de peuple est apprise (Humain : Artisanat + 1 compétence au choix ; un demi-elfe reçoit celles de la voie de peuple qu'il suit).
- Si une compétence de peuple est déjà maîtrisée par ailleurs (profil ou hybride), le personnage reçoit à la place 2 points de compétence supplémentaires investis dans cette compétence (+2, non récupérables avec le bouton « − »).
- La capacité de rang 1 des voies de peuple ne donne plus son bonus de +3 aux tests de caractéristique : la maîtrise des compétences de peuple le remplace. Ses autres effets (vision dans le noir, etc.) sont conservés.
- Dans la fenêtre d'un test de compétence, les bonus permanents des capacités du personnage ne sont plus proposés : ils ne servent qu'aux tests de caractéristique. Les capacités activables (sorts, postures…) et les effets reçus d'autres personnages restent proposés.
- Quand une compétence devient maîtrisée en cours de carrière via une voie hybride, le bonus déjà investi est doublé.
- À chaque niveau, 3 points de compétence sont disponibles pour augmenter le bonus d'une compétence (coût : 1 point si elle est maîtrisée, 2 points sinon). Le bonus est plafonné à `niveau + 5` (maximum absolu +15).
- Le malus d'armure s'applique automatiquement aux tests basés sur l'Agilité ou la Constitution.

**Non implémenté** :
- La section **« Capacités et compétences »** : renoncer au bonus d'une capacité (rang + 2) pour gagner 4 points de compétence (5 pour une capacité de voie de prestige). Les bonus de capacité restent des bonus de tests de caractéristique.
- La **variante de progression par PEX** (« Cumul des systèmes PEX et compétences »), y compris son nombre de compétences hybrides variable selon le profil (1 à 3) : le module applique la règle de base, 2 compétences par voie hybride.
- La note du Gnome (« au rang 2 de la voie du gnome, le bonus de +3 s'applique également à la compétence persuasion ») : elle concerne une capacité de rang 2 distincte, avec un bonus chiffré propre aux règles de base de COF, hors du mécanisme de maîtrise ci-dessus.

**Écarts et limitations connus** :
- Les points de compétence non dépensés sont conservés d'un niveau sur l'autre (le livre impose de les dépenser immédiatement), et le bouton « − » permet de les redistribuer à tout moment.
- Doublement du bonus à l'acquisition d'une maîtrise : non appliqué quand la maîtrise vient de la voie de peuple (cas d'un personnage qui aurait investi des points dans la compétence avant d'apprendre la capacité de rang 1) ; le bonus doublé n'est pas ramené au plafond `niveau + 5`.
- La mini-fiche de personnage n'est pas concernée : elle n'affiche pas les compétences.
- Si une voie hors profil ou une voie de peuple est retirée après investissement de points dans une compétence devenue non-maîtrisée, le bonus déjà investi est conservé tel quel (pas de remboursement rétroactif) ; seul le coût futur par point repasse à 2.
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