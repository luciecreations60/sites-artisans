# Test d’isolation RLS (Client A vs Client B)

Prérequis : deux comptes `role = client`, chacun avec un projet distinct.

| | Client A | Client B |
|---|---|---|
| Auth user | clientA@… | clientB@… |
| Project | Projet A (`project_a_id`) | Projet B (`project_b_id`) |

## Dans le navigateur (compte B connecté)

Ouvrir la console sur `/espace-client` et exécuter (remplacer les UUID) :

```js
const sb = window.__SUPABASE__ // si exposé — sinon utiliser l’app / le SQL Editor avec JWT B
```

Plus simple : **SQL Editor** ne suffit pas (bypass RLS). Utiliser plutôt le client JS dans la console après login B, ou le script ci-dessous via l’app.

### Via console navigateur (après login Client B)

Dans les DevTools, sur une page espace-client (le client Supabase est déjà authentifié) :

```js
// Coller dans un composant temporaire n’est pas nécessaire :
// Utiliser l’onglet Network / ou ce helper depuis la page projet B.

import('/src/lib/supabase.ts').then(async ({ getSupabase }) => {
  const sb = getSupabase();
  const projectA = 'UUID_PROJET_A';
  const checks = [];

  async function trySelect(label, q) {
    const { data, error } = await q;
    checks.push({ label, rows: data?.length ?? 0, error: error?.message ?? null, ok: !data?.length });
  }

  await trySelect('projects A', sb.from('projects').select('id').eq('id', projectA));
  await trySelect('events A', sb.from('project_events').select('id').eq('project_id', projectA));
  await trySelect('checklist A', sb.from('checklist_items').select('id').eq('project_id', projectA));
  await trySelect('documents A', sb.from('documents').select('id').eq('project_id', projectA));
  await trySelect('requests A', sb.from('change_requests').select('id').eq('project_id', projectA));

  const insert = await sb.from('change_requests').insert({
    project_id: projectA,
    title: 'RLS probe',
    description: 'should fail',
    created_by: (await sb.auth.getUser()).data.user.id,
  });
  checks.push({
    label: 'insert request on A',
    rows: 0,
    error: insert.error?.message ?? null,
    ok: Boolean(insert.error),
  });

  // Storage : signer un path de A (doit échouer)
  const signed = await sb.storage.from('project-docs').createSignedUrl(`${projectA}/probe.pdf`, 60);
  checks.push({
    label: 'storage signed URL A',
    rows: 0,
    error: signed.error?.message ?? null,
    ok: Boolean(signed.error) || !signed.data?.signedUrl,
  });

  console.table(checks);
});
```

> Si l’import dynamique échoue (build prod), créer un petit bouton debug temporaire ou utiliser le SQL avec `set request.jwt.claim.sub` (avancé).

## Résultats attendus

| Action Client B | Attendu |
|---|---|
| SELECT Projet A | 0 ligne |
| SELECT events / checklist / docs / requests de A | 0 ligne |
| INSERT change_request sur A | erreur RLS |
| Signed URL fichier de A | erreur / pas d’URL |

Tout `ok: true` = isolation correcte côté Supabase.
