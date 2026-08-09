// Le propriétaire des données dans les tests. Les fonctions de lecture exigent un
// utilisateur et n'ont pas de valeur par défaut : c'est ce qui empêche un oubli de
// filtre en production. Les tests doivent donc en nommer un, et upsertAccount le pose
// sur les comptes qu'ils créent.
export const TEST_USER = "test-user";
