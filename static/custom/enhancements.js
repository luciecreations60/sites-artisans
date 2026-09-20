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

  const originalStrings = {
    company: ['Atelier Morel'],
    person: ['Julien Morel'],
    city: ['Verneuil-en-Halatte'],
    trade: ['Menuiserie & Agencement','Menuiserie & agencement'],
    baseline: ['Menuisier-agenceur dans l’Oise','Menuisier-agenceur dans l\'Oise'],
    serviceTitles: ['Agencement sur mesure','Menuiserie intérieure','Mobilier sur mesure','Agencement professionnel'],
    serviceTexts: [
      'Cuisines, dressings, bibliothèques : des aménagements pensés pour votre intérieur et vos habitudes.',
      'Escaliers, portes, parquets, habillages : le bois dans tous ses états, posé avec précision.',
      'Des pièces uniques, dessinées avec vous et fabriquées à l’atelier, du bureau à la table.',
      'Comptoirs, boutiques et bureaux qui donnent envie d’entrer — et qui résistent au quotidien.'
    ],
    projectTitles: ['Cuisine Delaunay','Bibliothèque du faubourg','Escalier Vasson','Dressing sous pente','Boulangerie Perrin','Bureau Leloup'],
    hero: ['Le bois sur mesure, pensé pour votre intérieur.'],
    genericWords: [
      ['menuisier-agenceur','artisan'],
      ['menuisier agenceur','artisan'],
      ['menuiserie-agencement','activité artisanale']
    ]
  };

  function getProfile() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
  }

  function saveProfile(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
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
    if (!el) { el = document.createElement('div'); el.className = 'aw-toast'; document.body.appendChild(el); }
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add('is-visible'));
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => el.classList.remove('is-visible'), 2300);
  }

  // Correctif HashRouter : les href #offres / #demos ne doivent pas être interprétés comme des routes.
  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#/')) return;
    const id = href.slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    section.innerHTML = `
      <div class="aw-wrap">
        <p class="aw-kicker">Essayez avec votre propre entreprise</p>
        <h2>Et si vous pouviez déjà vous voir dans votre futur site ?</h2>
        <p class="aw-intro">Renseignez quelques informations. Les trois démonstrations s’adaptent à votre métier, à votre nom et à votre ville pour rendre la comparaison beaucoup plus concrète.</p>
        <div class="aw-personalizer-grid">
          <form class="aw-form-card" id="aw-personalizer-form">
            <div class="aw-form-grid">
              <div class="aw-field"><label for="aw-trade">Votre métier</label><select id="aw-trade" name="tradeKey">${Object.entries(PRESETS).map(([k,v]) => `<option value="${k}" ${profile && profile.tradeKey===k?'selected':''}>${v.label}</option>`).join('')}</select></div>
              <div class="aw-field"><label for="aw-company">Nom de votre entreprise</label><input id="aw-company" name="company" value="${escapeHtml(profile && profile.company || '')}" placeholder="Ex. Dupont Électricité"></div>
              <div class="aw-field"><label for="aw-city">Votre ville / secteur</label><input id="aw-city" name="city" value="${escapeHtml(profile && profile.city || '')}" placeholder="Ex. Senlis"></div>
              <div class="aw-field"><label for="aw-firstname">Votre prénom</label><input id="aw-firstname" name="firstName" value="${escapeHtml(profile && profile.firstName || '')}" placeholder="Ex. Nicolas"></div>
              <div class="aw-field aw-span-2"><label for="aw-speciality">Votre spécialité principale (facultatif)</label><input id="aw-speciality" name="speciality" value="${escapeHtml(profile && profile.speciality || '')}" placeholder="Ex. rénovation complète, dépannage urgent, jardins naturels…"></div>
            </div>
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
    const refreshPreview = () => {
      const fd = new FormData(form); const p = Object.fromEntries(fd.entries()); const x = profileDisplay(p);
      section.querySelector('#aw-preview-name').textContent = x.company;
      section.querySelector('#aw-preview-meta').textContent = `${x.preset.trade} · ${x.city}`;
      section.querySelector('#aw-preview-copy').textContent = x.speciality ? `${x.preset.intro} Spécialité : ${x.speciality}.` : x.preset.intro;
    };
    form.addEventListener('input', refreshPreview);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const p = Object.fromEntries(new FormData(form).entries()); saveProfile(p); refreshPreview();
      showToast('Aperçu enregistré — choisissez maintenant une démonstration.');
    });
    section.querySelector('#aw-reset').addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY); form.reset(); refreshPreview(); showToast('Personnalisation réinitialisée.');
    });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function replaceTextNode(node, from, to) {
    if (!node.nodeValue || !node.nodeValue.includes(from)) return;
    node.nodeValue = node.nodeValue.split(from).join(to);
  }

  function walkText(root, cb) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        if (p && ['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n; while ((n = walker.nextNode())) cb(n);
  }

  function applyProfileToDemo() {
    if (!isDemoRoute()) { document.querySelector('.aw-profile-pill')?.remove(); return; }
    const profile = getProfile();
    if (!profile) return;
    const d = profileDisplay(profile); const p = d.preset;
    const root = document.getElementById('root'); if (!root) return;

    walkText(root, node => {
      originalStrings.company.forEach(s => replaceTextNode(node, s, d.company));
      originalStrings.person.forEach(s => replaceTextNode(node, s, d.person));
      originalStrings.city.forEach(s => replaceTextNode(node, s, d.city));
      originalStrings.trade.forEach(s => replaceTextNode(node, s, p.trade));
      originalStrings.baseline.forEach(s => replaceTextNode(node, s, `${capitalize(p.role)} à ${d.city}`));
      originalStrings.hero.forEach(s => replaceTextNode(node, s, p.tagline));
      originalStrings.serviceTitles.forEach((s,i) => replaceTextNode(node, s, p.services[i] || s));
      originalStrings.serviceTexts.forEach((s,i) => replaceTextNode(node, s, p.serviceTexts[i] || s));
      originalStrings.projectTitles.forEach((s,i) => replaceTextNode(node, s, p.projects[i] || s));
      replaceTextNode(node, "Depuis dix ans, l'Atelier Morel dessine et fabrique des aménagements en bois sur mesure : cuisines, bibliothèques, escaliers, dressings. Chaque projet naît dans l'atelier de Verneuil-en-Halatte, entre les mains de Julien Morel.", `${d.company} accompagne ses clients à ${d.city} avec une approche simple : comprendre le besoin, proposer la bonne solution et livrer un travail soigné. ${profile.speciality ? `Une attention particulière est portée à ${profile.speciality}.` : p.intro}`);
    });

    // Remplacement visuel : on garde la composition Emergent, mais les images changent selon le métier.
    const imgs = [...root.querySelectorAll('img')];
    imgs.forEach((img, i) => {
      if (!img.dataset.awOriginalSrc) img.dataset.awOriginalSrc = img.currentSrc || img.src || '';
      if (!img.dataset.awPhotoIndex) img.dataset.awPhotoIndex = String(i % p.photos.length);
      const idx = Number(img.dataset.awPhotoIndex) % p.photos.length;
      const next = photo(p.photos[idx]);
      if (img.src !== next) img.src = next;
      if (img.alt && /menuis|bois|atelier morel/i.test(img.alt)) img.alt = `${p.trade} — ${d.company}`;
    });

    [...root.querySelectorAll('[style*="background-image"]')].forEach((el,i) => {
      if (!el.dataset.awPhotoIndex) el.dataset.awPhotoIndex = String(i % p.photos.length);
      el.style.backgroundImage = `url("${photo(p.photos[Number(el.dataset.awPhotoIndex) % p.photos.length])}")`;
    });

    // Un petit rappel permet au prospect de modifier l'aperçu sans chercher.
    let pill = document.querySelector('.aw-profile-pill');
    if (!pill) {
      pill = document.createElement('div'); pill.className = 'aw-profile-pill'; document.body.appendChild(pill);
    }
    pill.innerHTML = `<strong>${escapeHtml(d.company)} · ${escapeHtml(p.label)}</strong><button type="button">Modifier</button>`;
    pill.querySelector('button').onclick = () => { location.hash = '#/'; setTimeout(() => document.getElementById('personnaliser')?.scrollIntoView({behavior:'smooth'}), 180); };
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  let scheduled = false;
  function scheduleEnhance() {
    if (scheduled) return; scheduled = true;
    requestAnimationFrame(() => { scheduled = false; createPersonalizer(); applyProfileToDemo(); });
  }

  window.addEventListener('hashchange', () => setTimeout(scheduleEnhance, 40));
  new MutationObserver(scheduleEnhance).observe(document.documentElement, { childList:true, subtree:true });
  document.addEventListener('DOMContentLoaded', scheduleEnhance);
  setTimeout(scheduleEnhance, 250);
  setTimeout(scheduleEnhance, 900);
})();
