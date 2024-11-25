const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'STOCK_KARIBOTEL'
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
    } else {
        console.log('Connecté à la base de données MySQL.');
    }
});

app.listen(3000, () => {
    console.log('Serveur démarré sur le port 3000');
});

// ----------------------------------------------------------------------------------------------------------------------------------------

// Ajouter un matériel
app.post('/materiels', (req, res) => {
  const { ID_journee, nom_mat, Quantite_mat } = req.body;

  // Vérifier si le nom du matériel existe déjà
  const checkQuery = 'SELECT * FROM materiel WHERE nom_mat = ?';
  db.query(checkQuery, [nom_mat], (err, results) => {
      if (err) {
          console.error('Erreur lors de la vérification du matériel :', err);
          return res.status(500).json({ message: 'Erreur lors de la vérification du matériel' });
      }

      if (results.length > 0) {
          // Si le matériel existe déjà, renvoyer une alerte
          return res.status(400).json({ message: 'Le nom du matériel existe déjà' });
          this.snackBar.open('Erreur lors de l\'ajout du matériel', 'Fermer', { duration: 3000 });
      }

      // Si le matériel n'existe pas, on l'ajoute
      const insertQuery = 'INSERT INTO materiel (ID_journee, nom_mat, Quantite_mat) VALUES (?, ?, ?)';
      db.query(insertQuery, [ID_journee, nom_mat, Quantite_mat], (err, results) => {
          if (err) {
              console.error('Erreur lors de l\'ajout du matériel :', err);
              return res.status(500).json({ message: 'Erreur lors de l\'ajout du matériel' });
          }

          // Insertion dans la table transaction_materiel
          const type_trans = 'entrée';
          const insertTransactionQuery = 'INSERT INTO transaction_materiel (ID_journee, Nom_mat, Type_transaction, Quantite) VALUES (?, ?, ?, ?)';
          db.query(insertTransactionQuery, [ID_journee, nom_mat, type_trans, Quantite_mat], (err) => {
              if (err) {
                  console.error('Erreur lors de l\'ajout de la transaction :', err);
                  return res.status(500).json({ error: 'Erreur lors de l\'ajout de la transaction' });
              }
              res.status(201).json({ message: 'Matériel et transaction ajoutés avec succès' });
          });
      });
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------

// Modifier un matériel
app.put('/materiels/:ID_mat', (req, res) => {
  const { ID_mat } = req.params;
  const { nom_mat, Quantite_mat } = req.body;

  // Récupération de l'ID_journee du matériel à modifier
  const queryGetJournee = 'SELECT ID_journee FROM materiel WHERE ID_mat = ?';

  db.query(queryGetJournee, [ID_mat], (err, results) => {
      if (err) {
          console.error('Erreur lors de la récupération du matériel :', err);
          return res.status(500).json({ error: 'Erreur lors de la récupération du matériel' });
      }

      const ID_journee = results[0].ID_journee; // Récupération de l'ID_journee

      // Insertion dans la table transaction_materiel
      const type_trans = 'modifie';
      const queryTransaction = 'INSERT INTO transaction_materiel (ID_journee, Nom_mat, Type_transaction, Quantite) VALUES (?, ?, ?, ?)';
      
      db.query(queryTransaction, [ID_journee, nom_mat, type_trans, Quantite_mat], (err) => {
          if (err) {
              console.error('Erreur lors de l\'ajout de la transaction :', err);
              return res.status(500).json({ error: 'Erreur lors de l\'ajout de la transaction' });
          }
      });

      // Mise à jour du matériel
      const queryUpdate = 'UPDATE materiel SET nom_mat = ?, Quantite_mat = ? WHERE ID_mat = ?';
      db.query(queryUpdate, [nom_mat, Quantite_mat, ID_mat], (err, results) => {
          if (err) {
              console.error('Erreur lors de la modification du matériel :', err);
              return res.status(500).json({ message: 'Erreur lors de la modification du matériel' });
          }

          res.status(200).json({ message: 'Matériel modifié avec succès' });
      });
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------

// Supprimer un matériel
app.delete('/materiels/:id', (req, res) => {
  const ID_mat = req.params.id;

  // Récupérer les informations du matériel avant de le supprimer
  const queryGetMateriel = 'SELECT * FROM materiel WHERE ID_mat = ?';
  db.query(queryGetMateriel, [ID_mat], (err, results) => {
      if (err) {
          console.error('Erreur lors de la récupération du matériel :', err);
          return res.status(500).json({ error: 'Erreur lors de la récupération du matériel' });
      }

      if (results.length === 0) {
          return res.status(404).json({ error: 'Matériel non trouvé' });
      }

      const materiel = results[0];

      // Vérification supplémentaire pour s'assurer que Nom_mat n'est pas vide ou null
      if (!materiel.nom_mat) {
        console.error('Erreur : Le champ nom_mat est vide ou null');
        return res.status(400).json({ error: 'Nom du matériel manquant' });
      }

      const ID_journee = materiel.ID_journee;

      // Ajouter une transaction pour la suppression du matériel
      const type_trans = 'Supprimer'; // Valeur par défaut pour la suppression
      const queryTransaction = 'INSERT INTO transaction_materiel (ID_journee, Nom_mat, Type_transaction, Quantite) VALUES (?, ?, ?, ?)';
      
      // Ici, on utilise materiel.Nom_mat, qui contient déjà le nom récupéré
      db.query(queryTransaction, [ID_journee, materiel.nom_mat, type_trans, materiel.Quantite_mat], (err) => {
          if (err) {
              console.error('Erreur lors de l\'ajout de la transaction :', err);
              return res.status(500).json({ error: 'Erreur lors de l\'ajout de la transaction' });
          }

          // Supprimer le matériel
          const queryDeleteMateriel = 'DELETE FROM materiel WHERE ID_mat = ?';
          db.query(queryDeleteMateriel, [ID_mat], (err) => {
              if (err) {
                  console.error('Erreur lors de la suppression du matériel :', err);
                  return res.status(500).json({ error: 'Erreur lors de la suppression du matériel' });
              }

              // Vérifier si la journée est encore associée à un autre matériel
              const queryCheckJournee = 'SELECT COUNT(*) AS count FROM materiel WHERE ID_journee = ?';
              db.query(queryCheckJournee, [ID_journee], (err, results) => {
                  if (err) {
                      console.error('Erreur lors de la vérification de la journée :', err);
                      return res.status(500).json({ error: 'Erreur lors de la vérification de la journée' });
                  }

                  else {
                      res.status(200).json({ message: 'Matériel supprimé avec succès' });
                  }
              });
          });
      });
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------

// Ajouter une journée
app.post('/journee', (req, res) => {
    const { date_du_jour } = req.body;
    // Vérifier si la journée existe déjà
    db.query('SELECT ID_journee FROM journee WHERE date_du_jour = ?', [date_du_jour], (err, results) => {
      if (err) {
        console.error('Erreur lors de la vérification de la journée :', err);
        return res.status(500).json({ message: 'Erreur lors de la vérification de la journée' });
      }
      if (results.length > 0) {
        // Si la journée existe déjà
        return res.status(200).json({ ID_journee: results[0].ID_journee });
      }
      // Si la journée n'existe pas, l'ajouter
      db.query('INSERT INTO journee (date_du_jour) VALUES (?)', [date_du_jour], (err, results) => {
        if (err) {
          console.error('Erreur lors de l\'ajout de la journée :', err);
          return res.status(500).json({ message: 'Erreur lors de l\'ajout de la journée' });
        }
        res.status(201).json({ ID_journee: results.insertId });
      });
    });
  });
  
// ------------------------------------------------------------------------------------------------
// Route pour obtenir les données combinées pour la liste de matériel
app.get('/materiels', (req, res) => {
    const query = `
        SELECT 
            j.date_du_jour AS date,
            m.nom_mat,
            m.Quantite_mat,
            m.ID_mat
        FROM materiel m
        JOIN journee j ON m.ID_journee = j.ID_journee;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des matériels:', err);
            res.status(500).json({ error: 'Erreur lors de la récupération des matériels' });
        } else {
            res.json(results);
        }
    });
});

// ----------------------------------------------------------------------------------------------------------------------------------------

// Route pour obtenir les transactions
app.get('/transactionsMateriel', (req, res) => {
    const query = `
        SELECT 
            Date_transaction AS date,
            Nom_mat AS nom_mat,
            Type_transaction AS type_trans,
            Quantite AS Quantite
        FROM transaction_materiel;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des transactions:', err);
            res.status(500).json({ error: 'Erreur lors de la récupération des transactions' });
        } else {
            res.json(results);
        }
    });
});

// ----------------------------------------------------------------------------------------------------------------------------------------

// Ajouter une transaction et mettre à jour le matériel

app.post('/transaction_materiel', (req, res) => {
  const { ID_journee, Nom_mat, Type_transaction, Quantite, Date_transaction } = req.body;

  const query = 'INSERT INTO transaction_materiel (ID_journee, Nom_mat, Type_transaction, Quantite, Date_transaction) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [ID_journee, Nom_mat, Type_transaction, Quantite, Date_transaction], (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'ajout de la transaction :', err);
      return res.status(500).json({ message: 'Erreur lors de l\'ajout de la transaction' });
    }
    res.status(201).json({ message: 'Transaction ajoutée avec succès', insertId: results.insertId });
  });
});

// Mettre à jour la quantité de matériel après une transaction
app.post('/update-materiel-quantite', (req, res) => {
  const { ID_materiel, nouvelleQuantite } = req.body;

  if (!ID_materiel || nouvelleQuantite === undefined) {
    return res.status(400).json({ message: 'ID_materiel et nouvelleQuantite sont requis' });
  }

  // Vérifiez si le matériel existe
  const checkQuery = 'SELECT Quantite_mat FROM materiel WHERE ID_mat = ?';
  db.query(checkQuery, [ID_materiel], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification du matériel :', err);
      return res.status(500).json({ message: 'Erreur lors de la vérification du matériel' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Matériel non trouvé' });
    }

    // Mettre à jour la nouvelle quantité
    const queryUpdate = 'UPDATE materiel SET Quantite_mat = ? WHERE ID_mat = ?';
    db.query(queryUpdate, [nouvelleQuantite, ID_materiel], (err) => {
      if (err) {
        console.error('Erreur lors de la mise à jour de la quantité :', err);
        return res.status(500).json({ message: 'Erreur lors de la mise à jour de la quantité' });
      }
      res.status(200).json({ message: 'Quantité mise à jour avec succès' });
    });
  });
});



// ----------------------------------------------------------------------------------------------------------------------------------------

app.get('/materielsQuantite', (req, res) => {
    const sqlQuery = "SELECT nom_mat, Quantite_mat FROM materiel";

    db.query(sqlQuery, (err, results) => {
      if (err) {
        console.error("Erreur lors de l'exécution de la requête SQL :", err);
        res.status(500).json({ error: "Erreur lors de la récupération des données du graphique" });
      } else {
        res.json({ data: results });
      }
    });
});

// ----------------------------------------------------------------------------------------------------------------------------------------


// Ajoutez cet endpoint pour récupérer le total des matériels
app.get('/countMateriels', (req, res) => {
  const sqlQuery = "SELECT COUNT(*) AS total_materiels FROM materiel";
  
  db.query(sqlQuery, (err, result) => {
    if (err) {
      console.error("Erreur lors de la récupération du nombre de matériels :", err);
      res.status(500).json({ error: "Erreur lors de la récupération du nombre de matériels" });
    } else {
      res.json({ total: result[0].total_materiels });
    }
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------

app.post('/aliments', (req, res) => {
    const { ID_journee, nom_al, Quantite_al } = req.body;
  
    // Vérifier si le nom de l'aliment existe déjà
    const checkQuery = 'SELECT * FROM aliment WHERE nom_al = ?';
    db.query(checkQuery, [nom_al], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification de l\'aliment :', err);
            return res.status(500).json({ message: 'Erreur lors de la vérification de l\'aliment' });
        }
  
        if (results.length > 0) {
            // Si l'aliment existe déjà, renvoyer une alerte
            return res.status(400).json({ message: 'Le nom de l\'aliment existe déjà' });
        }
  
        // Si l'aliment n'existe pas, on l'ajoute
        const insertQuery = 'INSERT INTO aliment (ID_journee, nom_al, Quantite_al) VALUES (?, ?, ?)';
        db.query(insertQuery, [ID_journee, nom_al, Quantite_al], (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'ajout de l\'aliment :', err);
                return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'aliment' });
            }
  
            // Insertion dans la table transaction_aliment
            const type_trans = 'entrée';
            const insertTransactionQuery = 'INSERT INTO transaction_aliment (ID_journee, Nom_al, Type_transaction, Quantite) VALUES (?, ?, ?, ?)';
            db.query(insertTransactionQuery, [ID_journee, nom_al, type_trans, Quantite_al], (err) => {
                if (err) {
                    console.error('Erreur lors de l\'ajout de la transaction :', err);
                    return res.status(500).json({ error: 'Erreur lors de l\'ajout de la transaction' });
                }
                res.status(201).json({ message: 'Aliment et transaction ajoutés avec succès' });
            });
        });
    });
  });

// ---------------------------------------------------------------------------------------------------------------------------------------------  
// modifier un aliment
app.put('/aliments/:ID_al', (req, res) => {
  const { ID_al } = req.params;
  const { nom_al, Quantite_al } = req.body;

  // Récupération de l'ID_journee de l'aliment à modifier
  const queryGetJournee = 'SELECT ID_journee FROM aliment WHERE ID_al = ?';

  db.query(queryGetJournee, [ID_al], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'aliment :', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération de l\'aliment' });
    }

    const ID_journee = results[0].ID_journee; // Récupération de l'ID_journee

    // Insertion dans la table transaction_aliment
    const type_trans = 'modifie';
    const queryTransaction = 'INSERT INTO transaction_aliment (ID_journee, Nom_al, Type_transaction, Quantite) VALUES (?, ?, ?, ?)';

    db.query(queryTransaction, [ID_journee, nom_al, type_trans, Quantite_al], (err) => {
      if (err) {
        console.error('Erreur lors de l\'ajout de la transaction :', err);
        return res.status(500).json({ error: 'Erreur lors de l\'ajout de la transaction' });
      }
    });

    // Mise à jour de l'aliment
    const queryUpdate = 'UPDATE aliment SET nom_al = ?, Quantite_al = ? WHERE ID_al = ?';
    db.query(queryUpdate, [nom_al, Quantite_al, ID_al], (err, results) => {
      if (err) {
        console.error('Erreur lors de la modification de l\'aliment :', err);
        return res.status(500).json({ message: 'Erreur lors de la modification de l\'aliment' });
      }

      res.status(200).json({ message: 'Aliment modifié avec succès' });
    });
  });
});



// Ajouter une transaction d'aliment
app.post('/transaction_aliment', (req, res) => {
  const { ID_journee, Nom_al, Type_transaction, Quantite, Date_transaction } = req.body;

  const query = 'INSERT INTO transaction_aliment (ID_journee, Nom_al, Type_transaction, Quantite, Date_transaction) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [ID_journee, Nom_al, Type_transaction, Quantite, Date_transaction], (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'ajout de la transaction :', err);
      return res.status(500).json({ message: 'Erreur lors de l\'ajout de la transaction' });
    }
    res.status(201).json({ message: 'Transaction ajoutée avec succès', insertId: results.insertId });
  });
});

// Mettre à jour la quantité d'aliment
app.post('/update-aliment-quantite', (req, res) => {
  const { ID_aliment, nouvelleQuantite } = req.body;

  if (!ID_aliment || nouvelleQuantite === undefined) {
    return res.status(400).json({ message: 'ID_aliment et nouvelleQuantite sont requis' });
  }

  db.query('UPDATE aliment SET Quantite_al = ? WHERE ID_al = ?', [nouvelleQuantite, ID_aliment], (err) => {
    if (err) {
      console.error('Erreur lors de la mise à jour de la quantité :', err);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour de la quantité' });
    }
    res.status(200).json({ message: 'Quantité mise à jour avec succès' });
  });
});  

// ______________________________________________________________________________________________________________

app.delete('/aliments/:id', (req, res) => {
    const ID_al = req.params.id;
  
    // Récupérer les informations de l'aliment avant de le supprimer
    const queryGetAliment = 'SELECT * FROM aliment WHERE ID_al = ?';
    db.query(queryGetAliment, [ID_al], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération de l\'aliment :', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération de l\'aliment' });
        }
  
        if (results.length === 0) {
            return res.status(404).json({ error: 'Aliment non trouvé' });
        }
  
        const aliment = results[0];
  
        const ID_journee = aliment.ID_journee;
  
        // Ajouter une transaction pour la suppression de l'aliment
        const type_trans = 'Supprimer'; // Valeur par défaut pour la suppression
        const queryTransaction = 'INSERT INTO transaction_aliment (ID_journee, Nom_al, Type_transaction, Quantite) VALUES (?, ?, ?, ?)';
        
        db.query(queryTransaction, [ID_journee, aliment.nom_al, type_trans, aliment.Quantite_al], (err) => {
            if (err) {
                console.error('Erreur lors de l\'ajout de la transaction :', err);
                return res.status(500).json({ error: 'Erreur lors de l\'ajout de la transaction' });
            }
  
            // Supprimer l'aliment
            const queryDeleteAliment = 'DELETE FROM aliment WHERE ID_al = ?';
            db.query(queryDeleteAliment, [ID_al], (err) => {
                if (err) {
                    console.error('Erreur lors de la suppression de l\'aliment :', err);
                    return res.status(500).json({ error: 'Erreur lors de la suppression de l\'aliment' });
                }
  
                res.status(200).json({ message: 'Aliment supprimé avec succès' });
            });
        });
    });
  });

  app.get('/aliments', (req, res) => {
    const query = `
        SELECT 
            j.date_du_jour AS date,
            a.nom_al,
            a.Quantite_al,
            a.ID_al
        FROM aliment a
        JOIN journee j ON a.ID_journee = j.ID_journee;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des aliments:', err);
            res.status(500).json({ error: 'Erreur lors de la récupération des aliments' });
        } else {
            res.json(results);
        }
    });
  });


  app.get('/transactionsAliment', (req, res) => {
    const query = `
        SELECT 
            Date_transaction AS date,
            Nom_al AS nom_al,
            Type_transaction AS type_trans,
            Quantite AS Quantite
        FROM transaction_aliment;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des transactions d\'aliments:', err);
            res.status(500).json({ error: 'Erreur lors de la récupération des transactions d\'aliments' });
        } else {
            res.json(results);
        }
    });
  });
    
  app.get('/countAliments', (req, res) => {
    const sqlQuery = "SELECT COUNT(*) AS total_aliments FROM aliment";
    
    db.query(sqlQuery, (err, result) => {
      if (err) {
        console.error("Erreur lors de la récupération du nombre d'aliments :", err);
        res.status(500).json({ error: "Erreur lors de la récupération du nombre d'aliments" });
      } else {
        res.json({ total: result[0].total_aliments });
      }
    });
  });

  app.get('/alimentsQuantite', (req, res) => {
    const query = `
      SELECT nom_al, SUM(Quantite_al) AS Quantite_al
      FROM aliment
      GROUP BY nom_al
    `;
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Erreur lors de la récupération des données :', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des données' });
      } else {
        res.json({ data: result });
      }
    });
  });

  app.get('/transactionsQuantite', (req, res) => {
    const query = `
      SELECT Type_transaction, COUNT(*) as count FROM transaction_materiel GROUP BY Type_transaction;`;
  
    db.query(query, (error, results) => {
      if (error) {
        console.error('Erreur lors de la récupération des transactions:', error);
        res.status(500).send('Erreur lors de la récupération des transactions');
      } else {
        res.json({ data: results });
      }
    });
  });
  
  app.get('/countTransactions', (req, res) => {
    const sqlQuery = "SELECT COUNT(*) AS total_transactions FROM transaction_materiel";
    
    db.query(sqlQuery, (err, result) => {
      if (err) {
        console.error("Erreur lors de la récupération du nombre de transactions :", err);
        res.status(500).json({ error: "Erreur lors de la récupération du nombre de transactions" });
      } else {
        if (result.length > 0) {
          res.json({ total: result[0].total_transactions });
        } else {
          res.json({ total: 0 }); // Si aucun résultat, retourner 0
        }
      }
    });
  });

  app.get('/transactionsQuantiteAliments', (req, res) => {
    const sqlQuery = `
      SELECT Type_transaction, COUNT(*) AS count
      FROM transaction_aliment
      GROUP BY Type_transaction
    `;
  
    db.query(sqlQuery, (err, result) => {
      if (err) {
        console.error("Erreur lors de la récupération des transactions d'aliments :", err);
        res.status(500).json({ error: "Erreur lors de la récupération des transactions d'aliments" });
      } else {
        res.json({ data: result });
      }
    });
  });

  app.use(express.json());

app.get('/api/materielIA', (req, res) => {
  const query = 'SELECT * FROM materiel';
  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
  
