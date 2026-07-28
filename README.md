# Simulateur de rentabilité

Application web (React + Vite) réunissant deux simulateurs de rentabilité
d'investissement :

- **Laverie** : évaluer rapidement si l'achat d'une laverie automatique est
  rentable, et sous quelles conditions (chiffre d'affaires, charges, apport,
  taux d'emprunt).
- **Épargne** : simuler la croissance d'un capital placé à intérêts
  composés (versements mensuels, rendement, frais, inflation).

Chaque simulateur affiche des KPIs et un graphique interactif (recharts) qui
se mettent à jour en direct pendant qu'on ajuste les curseurs. Les réglages
de chaque onglet sont **conservés automatiquement dans le navigateur**
(`localStorage`) : ils sont retrouvés tels quels à la prochaine visite,
même après avoir fermé l'onglet ou le navigateur.

## Confidentialité

Cette application est **100 % client** : il n'y a aucun serveur, aucune
base de données, aucun envoi réseau de vos données.

- Vos réglages (curseurs, nom de la simulation) sont enregistrés
  uniquement dans le `localStorage` de **votre** navigateur, sur **votre**
  appareil. Ils ne sont jamais transmis à un serveur, ni committés dans le
  dépôt Git, ni visibles par qui que ce soit d'autre.
- Les exports PDF/Excel sont générés entièrement dans votre navigateur et
  téléchargés directement sur votre machine.
- Les valeurs par défaut (« Cas exemple ») sont **volontairement
  génériques et fictives** — n'y saisissez jamais de vraies données
  confidentielles avant de vérifier la visibilité du dépôt GitHub (voir
  ci-dessous), puisque tout ce qui est commité dans un dépôt **public**
  reste visible par n'importe qui, y compris dans l'historique des
  commits.
- Si vous gérez un dossier réel avec des chiffres confidentiels, la bonne
  pratique est de les saisir uniquement via les curseurs (ils restent
  locaux) et de garder le dépôt GitHub **privé** si vous devez tout de
  même y committer des valeurs par défaut spécifiques à ce dossier.

## Onglet Laverie

Analyse la rentabilité de l'achat d'une laverie automatique, à partir d'un
dossier d'investissement type : achat du fonds de commerce (et
éventuellement des murs), financement par emprunt, charges d'exploitation.
Les valeurs sont pré-remplies avec un **dossier d'exemple générique et
fictif** (bouton « Cas exemple » pour y revenir à tout moment), modifiable
via les curseurs pour tester vos propres hypothèses. Chaque curseur affiche
un petit repère vertical gris indiquant la valeur de cet exemple, pour
visualiser en un coup d'œil l'écart avec vos propres réglages. Vos réglages
réels ne sont jamais commités dans le code : ils restent uniquement dans le
`localStorage` de votre navigateur (voir aussi la section
[Confidentialité](#confidentialité) ci-dessous).

### Nom de la simulation et export PDF / Excel

Un champ **« Nom de la simulation »**, en haut de la page, permet de donner
un titre libre à l'analyse en cours (ex. *« Mon dossier - hypothèse
haute »*) — utile pour se repérer si vous testez plusieurs dossiers ou
plusieurs scénarios. Ce nom, ainsi que la date du jour, apparaissent
automatiquement dans les fichiers exportés.

Deux boutons permettent d'extraire l'état actuel de la simulation :

- **Exporter en PDF** : rapport structuré (résultats clés, les deux
  premiers graphiques capturés depuis l'écran, paramètres
  d'achat/financement/exploitation, projection annuelle complète), généré
  avec [jsPDF](https://github.com/parallax/jsPDF),
  [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) et
  [html2canvas](https://html2canvas.hertzen.com/) (pour les graphiques).
  Chargé à la demande (le code de génération PDF n'alourdit pas le
  chargement initial de la page). Les graphiques sont capturés en JPEG
  compressé pour garder un fichier léger.
- **Exporter en Excel (.csv)** : même contenu au format CSV (séparateur
  `;`, encodage UTF-8), qui s'ouvre directement dans Excel ou LibreOffice
  Calc — pratique pour retravailler les chiffres ou la projection année
  par année dans un tableur.

### Conventions HT / TTC

Sauf mention contraire, **tous les montants sont hors taxes (HT)** :
chiffre d'affaires, loyer, eau, gaz, électricité, entretien. Deux
exceptions ne relèvent pas de la TVA et s'entendent donc en montant net à
payer :

- **Assurance** : les contrats d'assurance ne sont pas soumis à la TVA
  (prime "brute" = montant à payer).
- **CFE** (Cotisation Foncière des Entreprises) : impôt local, la notion de
  HT/TTC ne s'applique pas.

Le prix du **fonds de commerce** est soumis aux droits d'enregistrement (et
non à la TVA) ; le prix des **murs** s'entend hors frais de notaire ; les
**travaux** sont en revanche saisis en TTC (montant réellement décaissé,
la TVA étant récupérable seulement a posteriori pour un exploitant
assujetti).

### Détail des frais d'acquisition

Plutôt qu'un seul montant forfaitaire d'« honoraires », l'application
détaille chaque frais lié à l'opération d'achat, pour que le total soit
aussi proche que possible de la réalité :

- **Droits d'enregistrement (fonds)** : calculés **automatiquement** selon
  le barème légal (art. 719 du CGI) — 0 % jusqu'à 23 000 €, 3 % de
  23 000 € à 200 000 €, 5 % au-delà. Non négociables, à la charge de
  l'acquéreur.
- **Frais d'avocat** : rédaction/négociation du protocole de cession, garantie
  d'actif et de passif, clause de non-concurrence, due diligence juridique
  du fonds. Repère usuel : 1 à 3 % du prix du fonds, ou un forfait
  (souvent 3 000 € à 10 000 €) selon la complexité du dossier.
- **Frais de notaire (murs)** : émoluments, débours et droits de mutation
  immobiliers si vous achetez aussi les murs. Repère usuel : 7-8 % du prix
  des murs (ancien). Sans objet si vous n'achetez pas les murs.
- **Commission d'intermédiaire** : commission de l'agence ou du cabinet de
  cession. Souvent payée par le vendeur (à vérifier dans le mandat) ; si
  vous avez mandaté un chasseur de fonds pour votre propre compte, c'est
  vous qui la payez (repère usuel : 5-10 % du prix du fonds).
- **Audit d'acquisition** : honoraires d'expert-comptable pour la revue des
  comptes et du prévisionnel (due diligence financière). Repère usuel :
  1 500 € à 5 000 €.
- **Frais de dossier bancaire** : facturés par la banque pour la mise en
  place du prêt. Repère usuel : 1-2 % du montant emprunté.
- **Garantie bancaire (caution)** : coût de la garantie exigée par la
  banque (société de caution mutuelle, Bpifrance Garantie, hypothèque...).
  Repère usuel : 2-3 % du montant emprunté.
- **Greffe et formalités** : immatriculation, publication d'annonce légale,
  transfert du fonds. Repère usuel : 300 € à 1 000 €.

### Repères de valeurs usuelles

L'application affiche, sous certains curseurs, des ordres de grandeur
généralement observés en France pour financer une reprise de commerce
(apport, taux, durée du prêt, frais d'acquisition ci-dessus). Ce sont des
**indications**, pas des règles : elles dépendent du dossier, de la
banque et de la conjoncture, et doivent être confirmées avec votre banque,
votre expert-comptable, votre avocat ou l'intermédiaire de la cession.

- **Apport** : usuellement 20 à 30 % de l'investissement total.
- **Taux du prêt professionnel** : ordre de grandeur indicatif de 3 à 5 %
  (hors assurance emprunteur), variable selon la période et le profil.
- **Durée du prêt** : usuellement 7 ans pour un fonds de commerce seul,
  jusqu'à 10-12 ans si du matériel lourd est financé, 15-20 ans si les murs
  sont inclus (crédit immobilier professionnel).

### Fiscalité : du chiffre d'affaires au cash-flow net disponible

Contrairement à une première version qui s'arrêtait au cash-flow avant
impôt, le simulateur calcule maintenant le **résultat net après impôt sur
les sociétés (IS)**, puis en déduit le cash-flow réellement disponible :

1. **EBE** = chiffre d'affaires − charges d'exploitation − loyer de
   crédit-bail (si activé).
2. **Résultat avant impôt** = EBE − intérêts d'emprunt de l'année −
   dotation aux amortissements de l'année. Seuls les **intérêts** (pas le
   capital remboursé) et les **amortissements** (charge non décaissée)
   réduisent le résultat imposable.
3. **Impôt sur les sociétés** : barème PME — **15 %** jusqu'à 42 500 € de
   bénéfice imposable, **25 %** au-delà. Pas d'impôt sur un résultat
   négatif (le report de déficit n'est pas modélisé).
4. **Résultat net** = résultat avant impôt − IS.
5. **Cash-flow net disponible** = résultat net **+ dotation aux
   amortissements** (charge non décaissée, réintégrée) **− capital
   remboursé** de l'année (décaissé mais non déductible) **−** éventuelle
   levée d'option d'achat de crédit-bail cette année-là.

C'est ce cash-flow net (et non l'EBE ni le cash-flow avant impôt) qui sert
de référence pour la rentabilité sur apport, le délai de récupération et
le seuil de rentabilité affichés dans l'application.

⚠️ Ce calcul suppose une société soumise à l'IS (SARL/SAS) et ignore le
report de déficits, les cotisations sociales et la rémunération du
dirigeant. Pour une entreprise individuelle ou une société à l'IR, la
fiscalité réelle est différente (le bénéfice s'ajoute à vos revenus
personnels) : à affiner avec votre expert-comptable.

### Durée de la simulation, indépendante de la durée du prêt

La **durée de la simulation** (curseur séparé de la « Durée du prêt ») fixe
l'horizon des graphiques et de la projection. Elle peut être plus longue
que la durée du prêt, pour voir ce qui se passe **après le remboursement
complet de l'emprunt** : la mensualité, les intérêts et le capital restant
dû retombent à zéro, et le cash-flow net augmente d'un coup (il n'absorbe
plus la mensualité). Une ligne de repère « Fin du prêt » est affichée sur
les graphiques pour marquer cette transition. Si la durée de simulation est
plus courte que la durée du prêt, c'est cette dernière qui prime (on ne
coupe jamais l'affichage en plein remboursement).

### Amortissement du prêt, crédit-bail, énergie et hausse de prix

Plutôt que de supposer un cash-flow annuel constant, l'application projette
chaque poste année par année sur la durée de la simulation :

- **Amortissement du prêt** : un échéancier complet répartit chaque
  mensualité entre part d'intérêts (déductible) et part de capital
  (non déductible), mois par mois, pour obtenir le capital restant dû et
  les intérêts déductibles de chaque année — la part d'intérêts diminue
  et celle de capital augmente au fil du temps, à mensualité totale
  constante.
- **Crédit-bail (matériel)**, optionnel : loyer annuel fixe pendant la
  durée du contrat (charge d'exploitation déductible, distincte de
  l'emprunt bancaire), puis sortie de trésorerie ponctuelle si vous levez
  l'option d'achat à l'échéance.
- **Hausse de l'énergie** : eau + gaz + électricité augmentent chaque
  année selon un taux d'inflation composé (`charge × (1 + taux)^(année-1)`)
  — c'est le seul poste de charges indexé.
- **Hausse du chiffre d'affaires par paliers de prix (non linéaire)** :
  le volume de lavages est supposé **constant** (capacité de la laverie),
  et le CA n'augmente que parce que le prix moyen par lavage augmente
  d'un montant fixe (par ex. +0,25 €) tous les N ans. Le CA progresse donc
  par sauts (en escalier), pas de façon continue/exponentielle comme une
  inflation classique.

### Formules

Le moteur de calcul se trouve dans
[src/simulators/laverieCalculs.js](src/simulators/laverieCalculs.js) :

- **Total des frais d'acquisition** = droits d'enregistrement (fonds) +
  frais d'avocat + frais de notaire (murs) + commission d'intermédiaire +
  audit d'acquisition + frais de dossier bancaire + garantie bancaire +
  greffe et formalités.
- **Investissement total (HT)** = prix du fonds + prix des murs + travaux
  (TTC) + total des frais d'acquisition.
- **Emprunt** = investissement total − apport.
- **Mensualité** : calculée avec la formule classique d'un prêt
  amortissable à mensualités constantes,
  `mensualité = capital × t / (1 - (1 + t)^-n)`, avec `t` le taux mensuel
  (`taux annuel / 100 / 12`) et `n` le nombre de mensualités
  (`durée en années × 12`).
- **Rentabilité économique** = EBE (année 1) / investissement total.
  Mesure la performance du bien indépendamment de son financement et de
  la fiscalité.
- **Rentabilité sur apport (nette)** = cash-flow net (année 1) / apport.
  Mesure le rendement, après impôt, du capital réellement engagé (effet
  de levier de l'emprunt inclus).
- **Seuil de rentabilité (CA minimum, net d'impôt)** : chiffre d'affaires
  de l'année 1 pour lequel le cash-flow net après impôt est nul. Le
  résultat imposable étant linéaire par morceaux du CA (à cause des
  paliers du barème d'IS), le seuil est résolu tranche par tranche.
- **Délai de récupération** = apport / cash-flow net (année 1), affiché
  uniquement si ce cash-flow net est positif.
- **Projection annuelle** : calcule, pour chaque année de la durée du
  prêt, le CA (paliers de prix), les charges (énergie indexée), le
  crédit-bail, l'échéancier du prêt, l'IS, le résultat net, le cash-flow
  net et la trésorerie cumulée. C'est la donnée source des trois
  graphiques : trésorerie cumulée nette **et bénéfice net par année**
  (deux échelles, axe de droite pour le bénéfice), CA vs charges, et
  capital restant dû.

⚠️ Simulation à titre pédagogique. Elle ne remplace pas une étude de
marché, un prévisionnel comptable détaillé, ni un conseil d'un expert-comptable
ou d'un conseiller en financement. Ceci n'est pas un conseil en
investissement.

## Onglet Épargne

Le moteur de simulation (`simulate()` dans
[src/simulators/EpargneSimulator.jsx](src/simulators/EpargneSimulator.jsx))
repose sur les hypothèses suivantes :

- **Rendement net** : le rendement annuel net est égal au rendement brut
  saisi moins les frais annuels (`tauxNet = (tauxAnnuel - fraisAnnuels) / 100`).
- **Intérêts composés à capitalisation mensuelle** : le taux annuel net est
  converti en taux mensuel équivalent par la formule
  `tauxMensuel = (1 + tauxNet)^(1/12) - 1`, de sorte que la capitalisation
  composée sur 12 mois redonne exactement le taux annuel net.
- **Versements mensuels** : chaque mois, le capital est d'abord revalorisé
  au taux mensuel, puis le versement mensuel est ajouté
  (`valeur = valeur * (1 + tauxMensuel) + versementMensuel`). Les
  versements ne sont eux-mêmes pas rémunérés le mois où ils sont versés.
- **Frais** : les frais annuels sont supposés proportionnels et constants
  sur toute la durée ; ils sont directement déduits du rendement brut
  avant capitalisation (pas de frais d'entrée ni de frais fixes distincts).
- **Inflation** : l'inflation annuelle est elle aussi convertie en taux
  mensuel équivalent et appliquée sous forme d'un déflateur cumulatif, afin
  de calculer la **valeur réelle** (pouvoir d'achat d'aujourd'hui) du
  portefeuille : `valeurRéelle = valeur / déflateur`.
- **Taux constants** : rendement, frais et inflation sont supposés
  constants sur toute la durée de la simulation (pas de volatilité, pas de
  scénarios de marché).
- **Fiscalité** : la simulation ne tient compte d'aucune fiscalité
  (prélèvements sociaux, impôt sur le revenu, enveloppe fiscale type
  PEA/assurance-vie, etc.).

⚠️ Cette simulation est fournie à titre pédagogique uniquement. Les
performances passées ne préjugent pas des performances futures et ceci ne
constitue pas un conseil en investissement.

## Stack technique

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/) 8
- [recharts](https://recharts.org/) pour les graphiques
- [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) pour l'export PDF (chargés à la demande)

## Structure du code

```
src/
  App.jsx                        # bascule entre les onglets Laverie / Épargne
  components/ui.jsx              # Slider, Kpi, CustomTooltip partagés
  utils/
    format.js                    # formatage monétaire (fr-FR)
    usePersistedState.js         # état React persisté dans localStorage
    exportPdf.js                 # génération de l'extrait PDF (import dynamique)
    exportCsv.js                 # génération de l'extrait Excel (.csv)
  simulators/
    LaverieSimulator.jsx         # onglet Laverie
    laverieCalculs.js            # moteur de calcul + dossier d'exemple générique
    EpargneSimulator.jsx         # onglet Épargne (intérêts composés)
```

## Lancer le projet en local

Prérequis : [Node.js](https://nodejs.org/) (version 20 ou supérieure) et npm.

```bash
npm install
npm run dev
```

L'application est alors accessible sur l'URL affichée dans le terminal
(par défaut [http://localhost:5173](http://localhost:5173)).

Autres scripts disponibles :

```bash
npm run build    # build de production dans dist/
npm run preview  # sert le build de production en local
npm run lint     # vérifie le code avec oxlint
npm run deploy   # publie le build sur GitHub Pages
```

## Déploiement

Le projet est configuré pour être déployé sur GitHub Pages via le paquet
`gh-pages`. Un `npm run deploy` construit l'application et publie le
contenu de `dist/` sur la branche `gh-pages` du dépôt, **sans conserver
d'historique** (option `--no-history`) : chaque déploiement remplace
entièrement le commit précédent sur cette branche, plutôt que de
l'empiler. C'est une mesure de confidentialité par défaut : la branche
`gh-pages` ne contient donc jamais que le dernier build, jamais
d'anciennes versions du bundle.
