const sql = `SELECT DISTINCT p.id as id_projet, p.numero, p.id_unite, p.pa, p.numero_op,
            p.montant_delegue, p.montant_engagement, p.montant_paiement,
            p.programme, p.programme_a_realiser, p.stade, p.situation_objectif, 
            p.contrainte, p.codification_cc, p.id_bet, p.delais, 
            p.debut_etude, p.fin_etude, p.essais, p.fin_prev,
            p.observation, p.interne, p.priorite, p.type, 
            p.reference_priorite, p.date_achevement, p.chef_projet,
            b.nom_bet, u.nom_unite,
            CONCAT(usr.prenom, ' ', usr.nom) as nom_chef_projet,
            (SELECT json_group_array(json_object('id', t.id, 'lib_tag', t.lib_tag))
             FROM tag t JOIN projet_tag pt ON pt.id_tag = t.id WHERE pt.id_projet = p.id) as tags
     FROM projet p
     LEFT JOIN bet b ON b.id = p.id_bet
     LEFT JOIN unite u ON u.id = p.id_unite
     LEFT JOIN utilisateur usr ON usr.id = p.chef_projet
     LEFT JOIN lot l ON l.id_projet = p.id
     ORDER BY p.id DESC`;

let pgSql = sql;
pgSql = pgSql.replace(/json_group_array\s*\(\s*json_object\s*\(([^)]+)\)\s*\)/gi, (match, args) => {
  return `COALESCE(jsonb_agg(jsonb_build_object(${args})), '[]'::jsonb)`;
});
pgSql = pgSql.replace(/json_group_array\s*\(([^)]+)\)/gi, (match, arg) => {
  if (arg.toLowerCase().includes('jsonb_build_object')) return match; 
  return `COALESCE(jsonb_agg(${arg}), '[]'::jsonb)`;
});

console.log(pgSql.includes('jsonb_agg') ? 'MATCHED!' : 'FAILED TO MATCH');
console.log(pgSql);
