import type { Db } from "../pg";

export type GroupLineRow = {
  id: number;
  name: string;
  amount: number;
  // Durée de vie de la ligne, comme celle d'un groupe : un abonnement résilié
  // s'arrête sans emporter le récurrent qui le porte. NULL des deux côtés = pas de
  // borne (les lignes d'avant cette colonne, et celles créées « permanentes »).
  startMonth: string | null;
  endMonth: string | null;
};

export type GroupRow = {
  id: number;
  accountId: string;
  name: string;
  direction: "in" | "out";
  monthlyAmount: number | null;
  startMonth: string | null;
  endMonth: string | null;
  // Dépense prévue ou non prévue : le bloc du tableau où l'enveloppe est rangée.
  planned: boolean;
  lines: GroupLineRow[];
};

// Nature d'un groupe (enveloppe ou récurrent), ou null s'il n'existe pas. Le
// groupe 0 (non catégorisés) n'a pas de ligne dans `groups` : c'est à
// l'appelant de le traiter comme une enveloppe (il a une provision, pas des lignes).
// Nombre de sous-postes d'une dépense, ou null si le groupe n'existe pas. C'est ce
// nombre, et non une nature déclarée, qui dit si une transaction peut se poser
// directement sur le groupe (canAttachToGroup).
export async function countGroupLines(db: Db, id: number): Promise<number | null> {
  const existe = await db.one(`SELECT 1 FROM groups WHERE id = $1`, [id]);
  if (!existe) return null;
  const row = await db.one<{ n: number }>(`SELECT COUNT(*) AS n FROM group_lines WHERE group_id = $1`, [id]);
  return row!.n;
}

// Durée de vie d'un groupe (mois de départ / de fin, null = sans borne de ce
// côté), ou null s'il n'existe pas. Sert à refuser d'y rattacher une transaction
// d'un mois où il ne vit pas.
export async function getGroupLifespan(
  db: Db,
  id: number,
): Promise<{ startMonth: string | null; endMonth: string | null } | null> {
  const row = await db.one<{ startMonth: string | null; endMonth: string | null }>(
    `SELECT start_month AS "startMonth", end_month AS "endMonth" FROM groups WHERE id = $1`,
    [id],
  );
  return row ?? null;
}

// Durée de vie d'une ligne de récurrent, ou null si la ligne n'existe pas. Sert à
// juger un changement de bornes : ce qu'on retire se lit par rapport à ce qui est.
export async function getLineLifespan(
  db: Db,
  id: number,
): Promise<{ startMonth: string | null; endMonth: string | null } | null> {
  const row = await db.one<{ startMonth: string | null; endMonth: string | null }>(
    `SELECT start_month AS "startMonth", end_month AS "endMonth" FROM group_lines WHERE id = $1`,
    [id],
  );
  return row ?? null;
}

// Groupe auquel appartient une ligne, null si la ligne n'existe pas. Sert à vérifier
// qu'un couple (groupe, ligne) est cohérent avant de l'écrire sur une transaction.
export async function getLineGroupId(db: Db, lineId: number): Promise<number | null> {
  const row = await db.one<{ groupId: number }>(
    `SELECT group_id AS "groupId" FROM group_lines WHERE id = $1`,
    [lineId],
  );
  return row ? row.groupId : null;
}

// Les groupes de l'utilisateur, c'est-à-dire ceux de ses comptes. La jointure fait le
// filtre : un groupe posé sur un compte qui n'est pas le sien ne sort pas, et un
// groupe dont le compte n'a pas de propriétaire ne sort chez personne.
//
// Deux requêtes, pas une par groupe. Sur une base locale, interroger les sous-postes
// groupe par groupe ne coûtait rien ; sur une base distante, c'est un aller-retour
// réseau par enveloppe, et une page qui en affiche trente attendrait trente fois.
export async function listGroups(db: Db, userId: string): Promise<GroupRow[]> {
  const groups = await db.all<Omit<GroupRow, "lines">>(
    `SELECT g.id, g.account_id AS "accountId", g.name, g.direction, g.monthly_amount AS "monthlyAmount",
            g.start_month AS "startMonth", g.end_month AS "endMonth", g.planned
     FROM groups g
     JOIN accounts a ON a.id = g.account_id
     WHERE a.user_id = $1
     ORDER BY g.name`,
    [userId],
  );
  if (groups.length === 0) return [];

  const lignes = await db.all<GroupLineRow & { groupId: number }>(
    `SELECT l.id, l.group_id AS "groupId", l.name, l.amount,
            l.start_month AS "startMonth", l.end_month AS "endMonth"
     FROM group_lines l
     WHERE l.group_id = ANY($1)
     ORDER BY l.id`,
    [groups.map((g) => g.id)],
  );
  const parGroupe = new Map<number, GroupLineRow[]>();
  for (const { groupId, ...ligne } of lignes) {
    const liste = parGroupe.get(groupId);
    if (liste) liste.push(ligne);
    else parGroupe.set(groupId, [ligne]);
  }

  return groups.map((g) => ({ ...g, lines: parGroupe.get(g.id) ?? [] }));
}

// Crée un groupe : une dépense, ou un revenu quand direction vaut « in ». Une seule
// fonction, et le sens est tout ce qui les sépare — un groupe naît plat, avec son
// montant à lui, et se découpe ensuite en sous-postes si on veut (c'est alors leur
// somme qui fait son budget).
export async function insertGroup(
  db: Db,
  accountId: string,
  name: string,
  direction: "in" | "out",
  monthlyAmount: number,
  startMonth: string,
  endMonth: string | null,
  // Le bloc où la dépense est rangée, décidé par le bouton « + » sur lequel on a
  // cliqué. Prévue par défaut : c'est le cas courant, et le seul qu'un revenu connaisse.
  planned = true,
): Promise<number> {
  const ligne = await db.one<{ id: number }>(
    `INSERT INTO groups (account_id, name, direction, monthly_amount, start_month, end_month, planned)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [accountId, name, direction, monthlyAmount, startMonth, endMonth, planned],
  );
  return ligne!.id;
}

export async function deleteGroup(db: Db, id: number): Promise<void> {
  // budget_amounts.group_id n'a pas de clé étrangère (absente pour laisser vivre la
  // provision du groupe 0 « non catégorisés », jamais supprimé) : on purge donc à la
  // main les budgets datés du groupe supprimé.
  await db.tx(async (t) => {
    await t.run(`DELETE FROM budget_amounts WHERE group_id = $1`, [id]);
    await t.run(`DELETE FROM groups WHERE id = $1`, [id]);
  });
}

// Déplace une dépense d'un bloc à l'autre. Rien d'autre ne bouge : ni son nom, ni ses
// montants datés, ni ses bornes — le geste est donc parfaitement réversible.
export async function setGroupPlanned(db: Db, id: number, planned: boolean): Promise<void> {
  await db.run(`UPDATE groups SET planned = $1 WHERE id = $2`, [planned, id]);
}

export async function renameGroup(db: Db, id: number, name: string): Promise<void> {
  await db.run(`UPDATE groups SET name = $1 WHERE id = $2`, [name, id]);
}

// Déplace les bornes d'un groupe déjà créé. Rien d'autre n'est touché : les montants
// datés survivent tels quels, y compris ceux des mois qui sortent de la vie du groupe.
// C'est ce qui rend le geste réversible — remettre la borne où elle était fait
// réapparaître les mois avec le budget qu'ils avaient.
export async function setGroupLifespan(
  db: Db,
  id: number,
  startMonth: string,
  endMonth: string | null,
): Promise<void> {
  await db.run(`UPDATE groups SET start_month = $1, end_month = $2 WHERE id = $3`, [startMonth, endMonth, id]);
}

// Même chose pour une ligne de récurrent.
export async function setLineLifespan(
  db: Db,
  id: number,
  startMonth: string,
  endMonth: string | null,
): Promise<void> {
  await db.run(`UPDATE group_lines SET start_month = $1, end_month = $2 WHERE id = $3`, [startMonth, endMonth, id]);
}

// La colonne group_lines.keyword est NOT NULL (héritée de l'ancien rattachement par
// mot-clé, désormais mort) : on y écrit '' en dur pour ne pas violer la contrainte,
// sans l'exposer dans la signature publique.
// Les bornes de mois sont optionnelles : sans elles, la ligne est permanente — ce
// que sont toutes les lignes créées avant qu'une durée puisse se choisir.
export async function insertLine(
  db: Db,
  groupId: number,
  name: string,
  amount: number,
  startMonth: string | null = null,
  endMonth: string | null = null,
): Promise<number> {
  const ligne = await db.one<{ id: number }>(
    `INSERT INTO group_lines (group_id, name, amount, keyword, start_month, end_month)
     VALUES ($1, $2, $3, '', $4, $5) RETURNING id`,
    [groupId, name, amount, startMonth, endMonth],
  );
  return ligne!.id;
}

// Écrit aussi group_lines.amount, la colonne héritée que plus aucun calcul de budget
// ne lit (les montants vivent dans line_amounts, datés). Plus appelée par l'app :
// modifier une ligne ne touche plus qu'à son nom (renameLine ci-dessous), son montant
// se fixe depuis sa case du tableau.
export async function updateLine(db: Db, id: number, name: string, amount: number): Promise<void> {
  await db.run(`UPDATE group_lines SET name = $1, amount = $2 WHERE id = $3`, [name, amount, id]);
}

// Le nom d'une ligne : sa seule propriété qui vaille pour tous les mois. Ne touche
// pas à group_lines.amount, pour ne pas y laisser un montant périmé.
export async function renameLine(db: Db, id: number, name: string): Promise<void> {
  await db.run(`UPDATE group_lines SET name = $1 WHERE id = $2`, [name, id]);
}

export async function deleteLine(db: Db, id: number): Promise<void> {
  await db.run(`DELETE FROM group_lines WHERE id = $1`, [id]);
}
