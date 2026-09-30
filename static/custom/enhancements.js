(() => {
  'use strict';

  const STORAGE_KEY = 'artisanSiteDemoProfileV2';
  const isDemoRoute = () => (location.hash || '').startsWith('#/demo/');
  const isHomeRoute = () => !location.hash || location.hash === '#' || location.hash === '#/' || location.hash.startsWith('#/?');

  const photo = id => `https://images.unsplash.com/photo-${id}?q=82&w=1800&auto=format&fit=crop`;

  const PRESETS = {
    menuisier: {
      label: 'Menuisier / agenceur', trade: 'Menuiserie & agencement', role: 'menuisier-agenceur',
      tagline: 'Le sur-mesure pensé pour votre intérieur.',
      intro: 'Des aménagements conçus à vos mesures, fabriqués avec soin et pensés pour durer.',
      services: ['Agencement sur mesure','Menuiserie intérieure','Mobilier sur mesure','Agencement professionnel'],
      serviceTexts: ['Cuisines, dressings et bibliothèques adaptés à chaque espace.','Escaliers, portes et habillages réalisés avec précision.','Des pièces uniques dessinées autour de vos usages.','Boutiques, comptoirs et bureaux pensés pour le quotidien.'],
      projects: ['Cuisine sur mesure','Bibliothèque intégrée','Escalier contemporain','Dressing sous pente','Agencement de boutique','Bureau sur mesure'],
      photos: ['1541123437800-1bb1317badc2','1601058268499-e52658b8bb88','1556912167-f556f1f39fdf','1524758631624-e2822e304c36','1565182999561-18d7dc61c393','1533090161767-e6ffed986c88']
    },
    plombier: {
      label: 'Plombier / chauffagiste', trade: 'Plomberie & chauffage', role: 'plombier-chauffagiste',
      tagline: 'Un dépannage fiable, des installations faites pour durer.',
      intro: 'Dépannage, rénovation, chauffage et salle de bains : une intervention claire, soignée et réactive.',
      services: ['Dépannage plomberie','Chauffage & chaudière','Salle de bains','Rénovation & installation'],
      serviceTexts: ['Fuites, canalisations et urgences traitées rapidement.','Installation, entretien et remplacement de vos équipements.','Création et rénovation de salles de bains confortables.','Réseaux neufs et rénovation complète de vos installations.'],
      projects: ['Rénovation salle de bains','Remplacement chaudière','Création réseau plomberie','Douche à l’italienne','Rénovation maison','Installation chauffe-eau'],
      photos: ['1621905252507-b35492cc74b4','1585704032915-c3400ca199e7','1503387762-592deb58ef4e','1584622650111-993a426fbf0a','1562259949-e8e7689d7828','1484154218962-a197022b5858']
    },
    electricien: {
      label: 'Électricien', trade: 'Électricité générale', role: 'électricien',
      tagline: 'Des installations sûres, propres et pensées pour vos usages.',
      intro: 'Installation, rénovation, mise aux normes et dépannage pour les particuliers et les professionnels.',
      services: ['Installation électrique','Mise aux normes','Dépannage','Éclairage & domotique'],
      serviceTexts: ['Des installations neuves fiables et évolutives.','Sécurisation et modernisation de votre tableau et de vos circuits.','Recherche de panne et remise en service rapide.','Des solutions d’éclairage et de pilotage adaptées à votre quotidien.'],
      projects: ['Rénovation électrique complète','Mise aux normes tableau','Éclairage intérieur','Installation extérieure','Dépannage urgent','Projet domotique'],
      photos: ['1621905251918-48416bd8575a','1503387762-592deb58ef4e','1518770660439-4636190af475','1484154218962-a197022b5858','1600566753086-00f18fb6b3ea','1497366811353-6870744d04b2']
    },
    couvreur: {
      label: 'Couvreur / zingueur', trade: 'Couverture & zinguerie', role: 'couvreur-zingueur',
      tagline: 'Une toiture solide, durable et parfaitement protégée.',
      intro: 'Rénovation de toiture, zinguerie, étanchéité et entretien avec un travail soigné jusque dans les détails.',
      services: ['Rénovation de toiture','Zinguerie','Étanchéité','Entretien & réparation'],
      serviceTexts: ['Réfection partielle ou complète selon l’état de votre couverture.','Gouttières, chéneaux et finitions métalliques sur mesure.','Protection durable contre les infiltrations.','Diagnostic, nettoyage et réparations ciblées.'],
      projects: ['Réfection toiture maison','Zinguerie sur mesure','Réparation après intempéries','Pose de fenêtres de toit','Rénovation couverture','Étanchéité extension'],
      photos: ['1632759145351-1d592919f522','1504307651254-35680f356dfd','1487958449943-2429e8be8625','1562259949-e8e7689d7828','1600585154340-be6161a56a0c','1600566753190-17f0baa2a6c3']
    },
    peintre: {
      label: 'Peintre / décorateur', trade: 'Peinture & décoration', role: 'peintre-décorateur',
      tagline: 'Des finitions nettes qui transforment vos espaces.',
      intro: 'Préparation des supports, peinture intérieure et extérieure, décoration et finitions soignées.',
      services: ['Peinture intérieure','Façades & extérieur','Préparation des supports','Décoration & finitions'],
      serviceTexts: ['Murs, plafonds et boiseries avec des finitions régulières.','Protection et remise en valeur de vos extérieurs.','Enduits, ponçage et préparation pour un résultat durable.','Couleurs, effets et détails qui donnent du caractère.'],
      projects: ['Salon entièrement rénové','Façade remise à neuf','Chambre couleur profonde','Escalier & boiseries','Appartement rénové','Commerce rafraîchi'],
      photos: ['1562259949-e8e7689d7828','1600566753190-17f0baa2a6c3','1618221195710-dd6b41faaea6','1600607687920-4e2a09cf159d','1617806118233-18e1de247200','1522708323590-d24dbb6b0267']
    },
    paysagiste: {
      label: 'Paysagiste', trade: 'Paysage & aménagement extérieur', role: 'paysagiste',
      tagline: 'Des extérieurs pensés pour être beaux et faciles à vivre.',
      intro: 'Création, aménagement et entretien de jardins pour transformer chaque extérieur en véritable lieu de vie.',
      services: ['Création de jardin','Terrasses & allées','Plantations','Entretien paysager'],
      serviceTexts: ['Conception d’un jardin cohérent avec votre terrain et vos envies.','Des circulations et espaces de vie bien intégrés.','Des végétaux choisis selon le sol, l’exposition et les saisons.','Taille, entretien et remise en état ponctuelle ou régulière.'],
      projects: ['Jardin contemporain','Terrasse paysagée','Massif quatre saisons','Entrée végétalisée','Jardin familial','Cour transformée'],
      photos: ['1441974231531-c6227db76b6e','1416879595882-3373a0480b5b','1501004318641-b39e6451bec6','1472396961693-142e6e269027','1466692476868-aef1dfb1e735','1497250681960-ef046c08a56e']
    },
    macon: {
      label: 'Maçon', trade: 'Maçonnerie & rénovation', role: 'maçon',
      tagline: 'Des ouvrages solides, réalisés dans les règles de l’art.',
      intro: 'Construction, rénovation et aménagement avec une exécution rigoureuse et un chantier bien tenu.',
      services: ['Maçonnerie générale','Extension','Rénovation','Terrasse & extérieur'],
      serviceTexts: ['Murs, dalles et ouvrages structurels réalisés avec soin.','Création d’espace supplémentaire intégré à l’existant.','Reprise et transformation de bâtiments anciens.','Terrasses, murets et aménagements durables.'],
      projects: ['Extension de maison','Création d’ouverture','Rénovation ancienne','Terrasse maçonnée','Muret extérieur','Dalle & fondations'],
      photos: ['1503387762-592deb58ef4e','1541971875076-8f970d573be6','1487958449943-2429e8be8625','1562259949-e8e7689d7828','1600585154340-be6161a56a0c','1600607687920-4e2a09cf159d']
    },
    garage: {
      label: 'Garage / mécanicien', trade: 'Entretien & réparation automobile', role: 'garagiste',
      tagline: 'Votre voiture entre de bonnes mains.',
      intro: 'Entretien, diagnostic et réparation avec des explications claires et un service de proximité.',
      services: ['Entretien courant','Diagnostic','Réparation mécanique','Freinage & pneumatiques'],
      serviceTexts: ['Vidange, révision et entretien selon les préconisations constructeur.','Recherche de panne et diagnostic électronique.','Interventions mécaniques avec devis clair avant travaux.','Sécurité, pneus et freinage contrôlés avec précision.'],
      projects: ['Révision complète','Diagnostic moteur','Remplacement embrayage','Freinage complet','Entretien utilitaire','Préparation contrôle technique'],
      photos: ['1486262715619-67b85e0b08d3','1492144534655-ae79c964c9d7','1503736334956-4c8f8e92946d','1530046339160-ce3e530c7d2f','1487754180451-c456f719a1fc','1517524008697-84bbe3c3fd98']
    },
    boulanger: {
      label: 'Boulanger / pâtissier', trade: 'Boulangerie & pâtisserie artisanale', role: 'artisan boulanger',
      tagline: 'Du bon, du frais, du fait maison chaque jour.',
      intro: 'Pains, viennoiseries et créations gourmandes fabriqués sur place avec des matières premières choisies.',
      services: ['Pains artisanaux','Viennoiseries','Pâtisseries','Commandes & événements'],
      serviceTexts: ['Des pains travaillés avec patience et cuits chaque jour.','Croissants et brioches préparés sur place.','Des créations de saison pour toutes les envies.','Gâteaux, pièces et commandes pour vos moments importants.'],
      projects: ['Collection de pains','Viennoiseries du matin','Entremets de saison','Commande anniversaire','Création signature','Buffet gourmand'],
      photos: ['1509440159596-0249088772ff','1549931319-a545dcf3bc73','1486427944299-d1955d23e34d','1555507036-ab1f4038808a','1499636136210-6f4ee915583e','1509365465985-25d11c17e812']
    },
    coiffure: {
      label: 'Coiffeur / barbier', trade: 'Coiffure & style', role: 'coiffeur',
      tagline: 'Une coupe pensée pour vous, dans un lieu où l’on se sent bien.',
      intro: 'Coupe, couleur et soin avec une écoute attentive et un résultat adapté à votre style.',
      services: ['Coupe & coiffage','Coloration','Soins','Barbe & finitions'],
      serviceTexts: ['Une coupe adaptée à votre visage et à votre quotidien.','Nuances, balayages et couleurs personnalisées.','Des soins ciblés pour la santé et l’éclat du cheveu.','Précision des contours et finitions soignées.'],
      projects: ['Coupe transformation','Balayage naturel','Coloration lumineuse','Coiffure événement','Rituel soin','Barbe & contours'],
      photos: ['1522337360788-8b13dee7a37e','1560066984-138dadb4c035','1595476108010-b4d1f102b1b1','1585747860715-2ba37e788b70','1516975080664-ed2fc6a32937','1562322140-8baeececf3df']
    },
    bienetre: {
      label: 'Bien-être / beauté', trade: 'Beauté & bien-être', role: 'professionnel du bien-être',
      tagline: 'Un moment pour vous, dans une atmosphère douce et soignée.',
      intro: 'Des soins personnalisés dans un cadre apaisant, avec une attention portée à chaque détail.',
      services: ['Soins personnalisés','Massages','Rituels bien-être','Conseils & accompagnement'],
      serviceTexts: ['Des prestations adaptées à vos besoins du moment.','Des gestes précis pour relâcher les tensions.','Des protocoles pensés comme de vraies parenthèses.','Des conseils simples pour prolonger les bénéfices chez vous.'],
      projects: ['Rituel détente','Soin signature','Massage relaxant','Parenthèse duo','Soin visage','Programme bien-être'],
      photos: ['1544161515-4ab6ce6db874','1519823551278-64ac92734fb1','1600334089648-b0d9d3028eb2','1591343395082-e120087004b4','1570172619644-dfd03ed5d881','1540555700478-4be289fbecef']
    },
    autre: {
      label: 'Autre activité artisanale', trade: 'Savoir-faire artisanal', role: 'artisan',
      tagline: 'Votre savoir-faire mérite d’être vu et compris.',
      intro: 'Une présentation claire de votre métier, de vos réalisations et de ce qui fait votre différence.',
      services: ['Votre savoir-faire','Vos prestations','Vos réalisations','Votre accompagnement'],
      serviceTexts: ['Une présentation claire de ce que vous faites le mieux.','Des prestations expliquées sans jargon.','Des projets mis en valeur par de belles images.','Un parcours simple pour transformer les visites en contacts.'],
      projects: ['Réalisation récente','Projet sur mesure','Avant / après','Projet client','Création signature','Savoir-faire en image'],
      photos: ['1541123437800-1bb1317badc2','1533090161767-e6ffed986c88','1524758631624-e2822e304c36','1600607687939-ce8a6c25118c','1616486338812-3dadae4b4ace','1522708323590-d24dbb6b0267']
    }
  };

  const SECTION_IDS = new Set(['offres', 'demos', 'methode', 'faq', 'contact', 'solution', 'pourquoi', 'personnaliser']);

  const WOOD = {
    intro: "Depuis dix ans, l'Atelier Morel dessine et fabrique des aménagements en bois sur mesure : cuisines, bibliothèques, escaliers, dressings. Chaque projet naît dans l'atelier de Verneuil-en-Halatte, entre les mains de Julien Morel.",
    stories: [
      "Julien Morel a appris le métier auprès de son père, dans un atelier qui sentait déjà la sciure et la cire. En 2014, il ouvre le sien à Verneuil-en-Halatte, avec une conviction simple : un meuble sur mesure doit durer plus longtemps que les modes.",
      "Ici, pas de série. Chaque projet commence par une visite, un croquis au crayon et une conversation. Le bois est choisi ensemble, les assemblages sont pensés pour le quotidien, et la pose est réalisée par celui qui a fabriqué.",
      "De la cuisine familiale au comptoir de boutique, l'atelier intervient dans toute l'Oise, avec la même exigence : que l'ouvrage soit beau, juste et durable."
    ],
    serviceDetails: [
      "L'agencement est le cœur de l'atelier. Nous partons de votre pièce, de vos contraintes et de vos envies pour dessiner des rangements qui semblent avoir toujours été là.",
      "Escalier à crémaillère, porte d'atelier, habillage mural : la menuiserie intérieure structure une maison. L'atelier la réalise avec le même soin que le mobilier.",
      "Une table de ferme, un bureau de télétravail, une banquette d'entrée : le mobilier sur mesure répond à ce que le commerce ne propose pas.",
      "Boulangeries, boutiques, cabinets : l'agencement professionnel doit séduire les clients et supporter l'usage. L'atelier conçoit des aménagements robustes et accueillants."
    ],
    values: [
      "Chaque meuble part d'une feuille blanche et de votre intérieur — jamais d'un catalogue.",
      "Chêne, noyer, frêne : des bois choisis pour leur tenue et leur beauté, travaillés pour durer.",
      "Celui qui dessine votre projet est celui qui le fabrique et qui le pose chez vous."
    ],
    projects: [
      { short: "Une cuisine en chêne massif, ouverte sur la salle à manger.", long: "La famille Delaunay voulait une cuisine chaleureuse, facile à vivre. Nous avons dessiné un grand îlot en chêne huilé, des rangements invisibles et un plan de travail pensé pour cuisiner à quatre mains." },
      { short: "Six mètres de bibliothèque murale, entre laque et chêne.", long: "Dans cette longère senlisienne, le mur du salon est devenu une bibliothèque de six mètres : niches en chêne, fonds laqués, éclairage intégré. Le meuble épouse la poutre ancienne au lieu de la cacher." },
      { short: "Un escalier bois et métal qui allège toute l'entrée.", long: "L'ancien escalier coupait la lumière. Nous l'avons remplacé par une crémaillère acier thermolaquée, des marches en chêne de 60 mm et un garde-corps à tiges fines. L'entrée a gagné deux fenêtres de clarté." },
      { short: "Chaque centimètre exploité sous les combles.", long: "Sous une toiture à 28 degrés, aucun meuble du commerce ne trouvait sa place. Le dressing épouse la pente : penderies dégradées, tiroirs en partie basse, miroir pleine hauteur pour habiller la chambre de lumière." },
      { short: "Un comptoir et des présentoirs qui sentent bon le pain.", long: "Sophie Perrin reprenait la boulangerie de sa grand-mère. Nous avons fabriqué le comptoir en frêne, les présentoirs à pain et l'habillage du fournil — de quoi servir deux cents baguettes par jour sans faiblir." },
      { short: "Un bureau et sa bibliothèque pour télétravailler vraiment.", long: "Pour un télétravail devenu quotidien, nous avons créé un bureau de deux mètres en noyer, flanqué d'une bibliothèque asymétrique. Les câbles disparaissent, les dossiers aussi." }
    ],
    testimonials: [
      "Julien a redessiné notre cuisine de fond en comble. Le résultat est superbe, et le chantier est resté impeccable du début à la fin.",
      "Un travail d'une précision rare. La bibliothèque est devenue la pièce maîtresse de la maison.",
      "De l'écoute, des conseils, et un escalier dont on ne se lasse pas. Je recommande les yeux fermés.",
      "Le comptoir est magnifique. Nos clients nous en parlent régulièrement — certains viennent autant pour lui que pour le pain."
    ],
    points: [
      "Cuisines et plans de travail", "Dressings et placards", "Bibliothèques et meubles TV",
      "Escaliers bois & métal", "Portes et verrières", "Parquets et habillages muraux",
      "Tables et bureaux", "Bancs et banquettes", "Meubles d'exception",
      "Comptoirs et présentoirs", "Habillage de boutiques", "Bureaux et accueils",
      "Chêne massif huilé", "Îlot central 2,40 m", "Rangements sans poignées",
      "6 mètres linéaires", "Laque mate & chêne", "Éclairage intégré",
      "Crémaillère acier", "Marches chêne 60 mm", "Garde-corps tiges",
      "Pente 28°", "Penderies dégradées", "Tiroirs sur mesure",
      "Comptoir en frêne", "Présentoirs à pain", "Habillage du fournil",
      "Noyer massif", "Plan de 2 mètres", "Câblage intégré"
    ],
    // Fragments de texte écrits en dur dans les pages des démos (souvent coupés
    // autour d'un nom ou d'une ville). Remplacés seulement hors menuiserie.
    fragments: (d, p) => {
      const list = p.services.map((s) => s.toLowerCase()).join(', ');
      return [
        [" dessine et fabrique cuisines, bibliothèques, escaliers et dressings sur mesure. Chaque projet naît à l'atelier, entre les mains de ", ` accompagne ses clients : ${list}. Chaque projet est suivi de près par `],
        [" a appris le métier auprès de son père avant d'ouvrir son propre atelier à ", ' a appris le métier sur le terrain avant de créer son entreprise à '],
        ['. Ici, pas de série : chaque meuble commence par une visite, un croquis et une conversation.', '. Ici, chaque projet commence par une visite, un échange et un devis clair.'],
        [", l'atelier dessine et fabrique des aménagements en bois qui durent : cuisines, bibliothèques, escaliers, mobilier. Chaque pièce naît d'une conversation et sort des mains de ", `, ${d.company} accompagne ses clients : ${list}. Chaque projet est suivi de près par `],
        [' sur mesure, fabriqués à ', ' réalisés avec soin à '],
        [' a ouvert son atelier à ', ' a créé son entreprise à '],
        ["Cuisines, bibliothèques, escaliers : des pièces uniques dessinées et fabriquées à l'atelier, posées par celui qui les a pensées.", p.intro],
        ['Un meuble réussi ne se remarque pas. ', 'Un travail réussi ne se remarque pas. '],
        ['Un atelier, un artisan, ', 'Une entreprise, un artisan, '],
        ["Confier un projet à l'atelier ", `Confier un projet à ${d.company} `],
        ["Un meuble, une cuisine, un escalier ? Appelez-moi ou laissez un message : je vous réponds sous 48 h, avec plaisir et sans jargon.", `${p.services[0]}, ${p.services[1].toLowerCase()} ? Appelez-moi ou laissez un message : je vous réponds sous 48 h, avec plaisir et sans jargon.`],
        ["Celui qui dessine votre projet est celui qui le fabrique et qui vient le poser chez vous. C'est plus simple, et ça se voit au résultat.", "Celui qui étudie votre projet est celui qui le réalise chez vous. C'est plus simple, et ça se voit au résultat."],
        ["Ouverture de l'atelier à Verneuil-en-Halatte, après dix ans de compagnonnage.", `Création de ${d.company} à ${d.city}, après dix ans d’expérience.`],
        ['Premier aménagement de boutique — une boulangerie de village.', 'Premier grand chantier pour un commerce de village.'],
        ["L'atelier s'agrandit : une scierie, une cabine de finition.", "L'entreprise s'agrandit : un nouvel espace et de nouveaux équipements."],
        ['agencement, menuiserie, mobilier sur mesure', list],
        ["L'atelier — ", "L'entreprise — "]
      ];
    },
    exact: (d, p) => [
      ['Le bois sur mesure, pensé pour votre intérieur.', p.tagline],
      ["Une entreprise d'atelier, pas d'usine.", 'Une entreprise à taille humaine.'],
      ['Ce que je fabrique', 'Ce que je propose'],
      ["Ce que l'atelier fabrique", 'Ce que nous proposons'],
      ["Ils m'ont confié leur intérieur", "Ils m'ont fait confiance"],
      ['Le bois,', 'Votre projet,'],
      ['Trois histoires de bois.', 'Trois projets marquants.'],
      ["L'atelier", "L'entreprise"],
      ["Découvrir l'atelier", "Découvrir l'entreprise"],
      ["L'atelier en quelques dates", "L'entreprise en quelques dates"],
      ["Année de création de l'atelier", 'Année de création'],
      ["Fabrication à l'atelier", 'Travail soigné'],
      ['Le sur-mesure,', 'Un travail soigné,'],
      ['Le sur-mesure, vraiment', 'Un travail soigné, vraiment'],
      ['Cuisine en chêne massif', p.projects[0]],
      ['Dressing sous pente sur mesure', p.projects[3]],
      ['Bureau en noyer', p.projects[5]],
      ['du croquis à la pose', 'du premier échange à la fin du chantier'],
      ['Cuisine sur mesure', p.services[0]],
      ['Bibliothèque & rangements', p.services[1]],
      // « Mobilier sur mesure » devient déjà services[2] : l'estimateur garde 4 choix distincts.
      ['Escalier', p.services[3]],
      ['Bois plaqué, lignes sobres', 'Formule essentielle'],
      ['Bois massif — chêne, frêne', 'Formule confort'],
      ['Essences nobles — noyer', 'Formule premium']
    ]
  };

  function slugify(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'votre-entreprise';
  }

  const originalStrings = {
    company: ['Atelier Morel'],
    person: ['Julien Morel'],
    city: ['Verneuil-en-Halatte'],
    address: ['12 rue des Tilleuls, 60550 Verneuil-en-Halatte'],
    trade: ['Menuiserie & Agencement', 'Menuiserie & agencement'],
    baseline: ["Menuisier-agenceur dans l'Oise"],
    serviceTitles: ['Agencement sur mesure', 'Menuiserie intérieure', 'Mobilier sur mesure', 'Agencement professionnel'],
    serviceTexts: [
      'Cuisines, dressings, bibliothèques : des aménagements pensés pour votre intérieur et vos habitudes.',
      'Escaliers, portes, parquets, habillages : le bois dans tous ses états, posé avec précision.',
      "Des pièces uniques, dessinées avec vous et fabriquées à l'atelier, du bureau à la table.",
      "Comptoirs, boutiques et bureaux qui donnent envie d'entrer — et qui résistent au quotidien."
    ],
    projectTitles: ['Cuisine Delaunay', 'Bibliothèque du faubourg', 'Escalier Vasson', 'Dressing sous pente', 'Boulangerie Perrin', 'Bureau Leloup'],
    hero: ['Le bois sur mesure, pensé pour votre intérieur.'],
    genericWords: [
      ['menuisier-agenceur', 'role'],
      ['menuisier agenceur', 'role'],
      ['menuiserie-agencement', 'trade']
    ]
  };

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');

  function getProfile() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
  }

  function saveProfile(profile) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); return true; }
    catch { showToast('Impossible d’enregistrer (navigation privée ?).'); return false; }
  }

  function presetFor(profile) {
    return PRESETS[(profile && profile.tradeKey) || 'menuisier'] || PRESETS.autre;
  }

  function profileDisplay(profile) {
    const preset = presetFor(profile);
    return {
      company: (profile && profile.company || '').trim() || 'Votre entreprise',
      person: (profile && profile.firstName || '').trim() || 'Votre artisan',
      city: (profile && profile.city || '').trim() || 'votre ville',
      speciality: (profile && profile.speciality || '').trim(),
      preset
    };
  }

  function showToast(message) {
    let el = document.querySelector('.aw-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'aw-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    setTimeout(() => el.classList.add('is-visible'), 0);
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => el.classList.remove('is-visible'), 2300);
  }

  function scrollToId(id) {
    const target = document.getElementById(id);
    if (!target) return false;
    target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    return true;
  }

  // Après un changement de route, l'application remonte en haut de page :
  // on attend que la cible existe, puis on vérifie qu'elle est bien restée visible.
  function scrollToIdWhenReady(id, attempts = 40) {
    if (scrollToId(id)) {
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target && Math.abs(target.getBoundingClientRect().top) > 80) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }, 450);
      return;
    }
    if (attempts <= 0) return;
    setTimeout(() => scrollToIdWhenReady(id, attempts - 1), 50);
  }

  function sectionIdFromHref(href) {
    if (!href || href.startsWith('#/demo')) return null;
    let hash = '';
    try { hash = new URL(href, location.href).hash; } catch { return null; }
    if (!hash || (hash.startsWith('#/') && !hash.startsWith('#/#'))) return null;
    const id = decodeURIComponent(hash.replace(/^#\/?#/, ''));
    return SECTION_IDS.has(id) ? id : null;
  }

  function goToSection(id) {
    if (isHomeRoute() && scrollToId(id)) return;
    if (!isHomeRoute()) location.hash = '#/';
    setTimeout(() => scrollToIdWhenReady(id), 60);
  }

  // HashRouter : #offres et #/#offres doivent défiler, pas devenir une route.
  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const id = sectionIdFromHref(link.getAttribute('href'));
    if (!id) return;
    event.preventDefault();
    event.stopPropagation();
    goToSection(id);
  }, true);

  function createPersonalizer() {
    if (!isHomeRoute() || document.querySelector('.aw-personalizer')) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const profile = getProfile();
    const d = profileDisplay(profile);
    const section = document.createElement('section');
    section.className = 'aw-personalizer';
    section.id = 'personnaliser';
    section.setAttribute('aria-labelledby', 'aw-personalizer-title');
    section.innerHTML = `
      <div class="aw-wrap">
        <p class="aw-kicker">Essayez avec votre propre entreprise</p>
        <h2 id="aw-personalizer-title">Et si vous pouviez déjà vous voir dans votre futur site ?</h2>
        <p class="aw-intro">Renseignez quelques informations. Les trois démonstrations s’adaptent à votre métier, à votre nom et à votre ville pour rendre la comparaison beaucoup plus concrète.</p>
        <div class="aw-personalizer-grid">
          <form class="aw-form-card" id="aw-personalizer-form">
            <div class="aw-form-grid">
              <div class="aw-field"><label for="aw-trade">Votre métier</label><select id="aw-trade" name="tradeKey" autocomplete="organization-title">${Object.entries(PRESETS).map(([k,v]) => `<option value="${k}" ${profile && profile.tradeKey===k?'selected':''}>${escapeHtml(v.label)}</option>`).join('')}</select></div>
              <div class="aw-field"><label for="aw-company">Nom de votre entreprise</label><input id="aw-company" name="company" autocomplete="organization" value="${escapeHtml(profile && profile.company || '')}" placeholder="Ex. Dupont Électricité"></div>
              <div class="aw-field"><label for="aw-city">Votre ville / secteur</label><input id="aw-city" name="city" autocomplete="address-level2" value="${escapeHtml(profile && profile.city || '')}" placeholder="Ex. Senlis"></div>
              <div class="aw-field"><label for="aw-firstname">Votre prénom</label><input id="aw-firstname" name="firstName" autocomplete="given-name" value="${escapeHtml(profile && profile.firstName || '')}" placeholder="Ex. Nicolas"></div>
              <div class="aw-field aw-span-2"><label for="aw-speciality">Votre spécialité principale (facultatif)</label><input id="aw-speciality" name="speciality" value="${escapeHtml(profile && profile.speciality || '')}" placeholder="Ex. rénovation complète, dépannage urgent, jardins naturels…"></div>
            </div>
            <p class="aw-form-error" id="aw-form-error" hidden></p>
            <div class="aw-actions"><button class="aw-primary" type="submit">Créer mon aperçu personnalisé</button><button class="aw-secondary" type="button" id="aw-reset">Réinitialiser</button></div>
          </form>
          <aside class="aw-preview-card" aria-live="polite">
            <div><div class="aw-preview-label">Aperçu</div><div class="aw-preview-name" id="aw-preview-name">${escapeHtml(d.company)}</div><div class="aw-preview-meta" id="aw-preview-meta">${escapeHtml(d.preset.trade)} · ${escapeHtml(d.city)}</div><p class="aw-preview-copy" id="aw-preview-copy">${escapeHtml(d.preset.intro)}</p></div>
            <div class="aw-demo-buttons">
              <a class="aw-demo-link" href="#/demo/essentiel">Voir Essentiel <span>Niveau 1</span></a>
              <a class="aw-demo-link" href="#/demo/signature">Voir Signature <span>Niveau 2</span></a>
              <a class="aw-demo-link" href="#/demo/rayonnement">Voir Rayonnement <span>Niveau 3</span></a>
            </div>
          </aside>
        </div>
      </div>`;
    hero.insertAdjacentElement('afterend', section);

    const form = section.querySelector('#aw-personalizer-form');
    const errorEl = section.querySelector('#aw-form-error');
    const fields = ['company', 'city', 'firstName'];

    const readForm = () => Object.fromEntries(new FormData(form).entries());
    const isComplete = (p) => fields.every((name) => (p[name] || '').trim());
    const isBlank = (p) => fields.every((name) => !(p[name] || '').trim()) && !(p.speciality || '').trim();

    const showFormError = (message) => {
      errorEl.hidden = !message;
      errorEl.textContent = message || '';
      fields.forEach((name) => {
        const input = form.elements[name];
        const invalid = Boolean(message) && !(input.value || '').trim();
        input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
        if (invalid) input.setAttribute('aria-describedby', 'aw-form-error');
        else input.removeAttribute('aria-describedby');
      });
    };

    const refreshPreview = () => {
      const x = profileDisplay(readForm());
      section.querySelector('#aw-preview-name').textContent = x.company;
      section.querySelector('#aw-preview-meta').textContent = `${x.preset.trade} · ${x.city}`;
      section.querySelector('#aw-preview-copy').textContent = x.speciality ? `${x.preset.intro} Spécialité : ${x.speciality}.` : x.preset.intro;
    };

    const clearStoredProfile = () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* navigation privée */ }
    };

    form.addEventListener('input', () => {
      if (!errorEl.hidden && isComplete(readForm())) showFormError('');
      refreshPreview();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const p = readForm();
      if (!isComplete(p)) {
        showFormError('Indiquez votre entreprise, votre ville et votre prénom pour personnaliser les démonstrations.');
        const firstInvalid = fields.map((name) => form.elements[name]).find((input) => !(input.value || '').trim());
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      showFormError('');
      if (!saveProfile(p)) return;
      refreshPreview();
      showToast('Aperçu enregistré — choisissez maintenant une démonstration.');
    });

    section.querySelector('#aw-reset').addEventListener('click', () => {
      clearStoredProfile();
      form.tradeKey.value = 'menuisier';
      fields.concat('speciality').forEach((name) => { form.elements[name].value = ''; });
      showFormError('');
      refreshPreview();
      showToast('Personnalisation réinitialisée.');
    });

    section.querySelectorAll('.aw-demo-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        const p = readForm();
        if (isBlank(p) && (!p.tradeKey || p.tradeKey === 'menuisier')) {
          clearStoredProfile();
          return;
        }
        if (!isComplete(p)) {
          e.preventDefault();
          showFormError('Indiquez votre entreprise, votre ville et votre prénom, ou réinitialisez pour voir la démonstration d’origine.');
          const firstInvalid = fields.map((name) => form.elements[name]).find((input) => !(input.value || '').trim());
          if (firstInvalid) firstInvalid.focus();
          return;
        }
        if (!saveProfile(p)) e.preventDefault();
      });
    });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function withApostrophes(pairs) {
    const out = [];
    pairs.forEach(([from, to]) => {
      if (!from || from === to) return;
      out.push([from, to]);
      const curly = from.replace(/'/g, '’');
      if (curly !== from) out.push([curly, to]);
    });
    return out;
  }

  function applyReplacements(text, pairs) {
    const hits = pairs.filter(([from]) => from && text.includes(from));
    if (!hits.length) return text;
    hits.sort((a, b) => b[0].length - a[0].length);
    const slots = [];
    let out = text;
    hits.forEach(([from, to], i) => {
      if (!out.includes(from)) return;
      const token = `\u0000${i}\u0000`;
      out = out.split(from).join(token);
      slots.push([token, to]);
    });
    slots.forEach(([token, to]) => { out = out.split(token).join(to); });
    return out;
  }

  function buildExact(profile, d) {
    const map = new Map();
    if (!profile.tradeKey || profile.tradeKey === 'menuisier') return map;
    WOOD.exact(d, d.preset).forEach(([from, to]) => {
      if (from && to && from !== to) {
        map.set(from, to);
        map.set(from.replace(/'/g, '’'), to);
      }
    });
    return map;
  }

  function demoEmail(d) {
    return `contact@${slugify(d.company)}.fr`;
  }

  function buildPairs(profile, d) {
    const p = d.preset;
    const pairs = [];
    const push = (from, to) => { if (from && to && from !== to) pairs.push([from, to]); };

    push('bonjour@atelier-morel-demo.fr', demoEmail(d));
    // Évite « l'Dupont Électricité » : l'article disparaît avec l'ancien nom.
    push("de l'Atelier Morel", `de ${d.company}`);
    push("l'Atelier Morel", d.company);
    originalStrings.address.forEach((s) => push(s, d.city));
    originalStrings.company.forEach((s) => push(s, d.company));
    originalStrings.person.forEach((s) => push(s, d.person));
    originalStrings.city.forEach((s) => push(s, d.city));
    originalStrings.trade.forEach((s) => push(s, p.trade));
    originalStrings.baseline.forEach((s) => push(s, `${capitalize(p.role)} à ${d.city}`));
    push("dans l'Oise", `à ${d.city}`);
    push("toute l'Oise", `les environs de ${d.city}`);
    originalStrings.genericWords.forEach(([from, kind]) => push(from, kind === 'role' ? p.role : p.trade.toLowerCase()));
    push('Julien a redessiné', `${d.person} a redessiné`);

    const switchCopy = profile.tradeKey && profile.tradeKey !== 'menuisier';
    if (switchCopy) {
      push('menuiserie', p.trade.toLowerCase());
      push('Menuiserie', p.trade);
      const intro = `${d.company} accompagne ses clients à ${d.city} : ${d.speciality ? `${d.speciality}. ` : ''}${p.intro}`;
      push(WOOD.intro, intro);
      WOOD.stories.forEach((story, i) => {
        const next = [
          `${d.person} exerce comme ${p.role} à ${d.city}. ${p.intro}`,
          `Chaque intervention commence par un échange clair. ${p.serviceTexts[0]}`,
          `${d.company} intervient autour de ${d.city}${d.speciality ? `, en particulier pour ${d.speciality}` : ''}, avec une exigence simple : un travail soigné et expliqué clairement.`
        ][i];
        push(story, next);
      });
      originalStrings.hero.forEach((s) => push(s, p.tagline));
      originalStrings.serviceTitles.forEach((s, i) => push(s, p.services[i] || s));
      originalStrings.serviceTexts.forEach((s, i) => push(s, p.serviceTexts[i] || s));
      originalStrings.projectTitles.forEach((s, i) => push(s, p.projects[i] || s));
      WOOD.serviceDetails.forEach((s, i) => push(s, `${p.services[i] || p.trade}. ${p.serviceTexts[i] || p.intro}`));
      WOOD.values.forEach((s, i) => {
        const next = [
          p.intro,
          'Des méthodes et des matériaux choisis pour durer, expliqués sans jargon.',
          `${d.person} suit le projet du premier échange jusqu’à la fin de l’intervention.`
        ][i];
        push(s, next);
      });
      WOOD.projects.forEach((item, i) => {
        const title = p.projects[i] || p.trade;
        push(item.short, `${title}, réalisé pour un client de ${d.city}.`);
        push(item.long, `${d.company} a mené ce projet à ${d.city}. ${p.serviceTexts[i % p.serviceTexts.length]}`);
      });
      WOOD.testimonials.forEach((text, i) => {
        const next = [
          `${d.person} a pris le temps de comprendre le besoin. Le résultat est soigné, et le chantier est resté clair du début à la fin.`,
          `Un travail précis, à ${d.city}. On reconnaît le métier dès la première visite.`,
          `De l’écoute, des conseils utiles, et un résultat dont on est fier. Je recommande ${d.company}.`,
          `${d.company} a livré exactement ce qui était convenu. L’échange est resté simple jusqu’au bout.`
        ][i];
        push(text, next);
      });
      WOOD.points.forEach((point, i) => push(point, p.services[i % p.services.length]));
      WOOD.fragments(d, p).forEach(([from, to]) => push(from, to));
    }

    return withApostrophes(pairs);
  }

  function walkText(root, cb) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (p.closest('.aw-personalizer, .aw-profile-pill, .aw-toast')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n; while ((n = walker.nextNode())) cb(n);
  }

  function isContentPhoto(img) {
    if (img.closest('nav, header, footer, .aw-personalizer, .aw-profile-pill')) return false;
    const src = img.getAttribute('src') || '';
    if (src.startsWith('data:') || /\.svg(\?|$)/i.test(src)) return false;
    const alt = (img.alt || '').toLowerCase();
    if (/logo|icône|icone|icon/.test(alt)) return false;
    return true;
  }

  function removePill() {
    document.querySelector('.aw-profile-pill')?.remove();
    document.body.classList.remove('aw-has-pill');
  }

  function sameCssUrl(current, next) {
    return String(current || '').replace(/["']/g, '') === String(next || '').replace(/["']/g, '');
  }

  function renderPill(d) {
    let pill = document.querySelector('.aw-profile-pill');
    const key = `${d.company}\u0001${d.preset.label}`;
    if (!pill) {
      pill = document.createElement('div');
      pill.className = 'aw-profile-pill';
      const strong = document.createElement('strong');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Modifier';
      button.addEventListener('click', () => goToSection('personnaliser'));
      pill.append(strong, button);
      document.body.appendChild(pill);
    }
    if (pill.dataset.awKey !== key) {
      pill.dataset.awKey = key;
      pill.querySelector('strong').textContent = `${d.company} · ${d.preset.label}`;
    }
    document.body.classList.add('aw-has-pill');
  }

  function applyProfileToDemo() {
    if (!isDemoRoute()) { removePill(); return; }
    const profile = getProfile();
    if (!profile) { removePill(); return; }
    const d = profileDisplay(profile);
    const p = d.preset;
    const root = document.getElementById('root');
    if (!root) return;
    const pairs = buildPairs(profile, d);
    const exact = buildExact(profile, d);

    walkText(root, (node) => {
      const value = node.nodeValue;
      const trimmed = value.trim();
      let next = exact.has(trimmed) ? value.replace(trimmed, exact.get(trimmed)) : applyReplacements(value, pairs);
      if (next !== value) node.nodeValue = next;
    });

    const nextTitle = applyReplacements(document.title, pairs);
    if (nextTitle !== document.title) document.title = nextTitle;

    const email = demoEmail(d);
    root.querySelectorAll('a[href^="mailto:bonjour@atelier-morel-demo.fr"]').forEach((a) => {
      a.setAttribute('href', `mailto:${email}`);
    });
    if (profile.tradeKey && profile.tradeKey !== 'menuisier') {
      const placeholder = `Ex. ${p.projects[0].toLowerCase()}…`;
      root.querySelectorAll('textarea[placeholder*="bibliothèque"], input[placeholder*="bibliothèque"]').forEach((el) => {
        el.setAttribute('placeholder', placeholder);
      });
    }

    [...root.querySelectorAll('img')].filter(isContentPhoto).forEach((img, i) => {
      if (!img.dataset.awPhotoIndex) img.dataset.awPhotoIndex = String(i % p.photos.length);
      const index = Number(img.dataset.awPhotoIndex) % p.photos.length;
      const next = photo(p.photos[index]);
      if (img.getAttribute('src') !== next) {
        img.src = next;
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
      }
      const alt = `${p.projects[index] || p.trade} — ${d.company}`;
      if (img.alt !== alt) img.alt = alt;
    });

    [...root.querySelectorAll('[style*="background-image"]')].forEach((el, i) => {
      if (el.closest('nav, header, footer, .aw-personalizer, .aw-profile-pill')) return;
      if (!el.dataset.awPhotoIndex) el.dataset.awPhotoIndex = String(i % p.photos.length);
      const next = `url("${photo(p.photos[Number(el.dataset.awPhotoIndex) % p.photos.length])}")`;
      if (!sameCssUrl(el.style.backgroundImage, next)) el.style.backgroundImage = next;
    });

    renderPill(d);
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  let scheduled = false;
  let applying = false;
  const observer = new MutationObserver(() => {
    if (applying) return;
    scheduleEnhance();
  });

  const OBSERVE_OPTIONS = { childList: true, subtree: true, characterData: true };

  // setTimeout plutôt que requestAnimationFrame : rAF est suspendu dans les onglets
  // en arrière-plan, ce qui laissait les démos non personnalisées.
  function scheduleEnhance() {
    if (scheduled || applying) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      applying = true;
      observer.disconnect();
      try {
        createPersonalizer();
        applyProfileToDemo();
      } catch (error) {
        console.error('[enhancements]', error);
      } finally {
        observer.observe(document.getElementById('root') || document.body, OBSERVE_OPTIONS);
        applying = false;
      }
    }, 16);
  }

  window.addEventListener('hashchange', () => setTimeout(scheduleEnhance, 40));
  document.addEventListener('DOMContentLoaded', scheduleEnhance);
  observer.observe(document.documentElement, OBSERVE_OPTIONS);
  setTimeout(scheduleEnhance, 300);
})();
