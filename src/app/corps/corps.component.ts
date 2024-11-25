import { Component, ViewChild, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { formatDate } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input'; 
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatTable } from '@angular/material/table';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import io from 'socket.io-client';

// --------------------------------------------------------------------------------------------------------------

interface Journee {
  ID_journee: number;
  date_du_jour: string;
}

interface Materiel {
  ID_mat: number;
  nom_mat: string;
  Quantite_mat: number;
  date: string;
}

interface Aliment {
  ID_al: number;
  nom_al: string;
  Quantite_al: number;
  date: string;
}

interface TransactionMateriel {
  date: string;
  nom_mat: string;
  type_trans: string;
  Quantite: number;
}

interface TransactionAliment {
  date: string;
  nom_al: string;
  type_trans: string;
  Quantite: number;
}

// --------------------------------------------------------------------------------------------------------------

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule,MatTable, CommonModule, HttpClientModule, RouterLink, RouterOutlet,MatInputModule,MatFormFieldModule,MatSelectModule,MatTableModule,MatButtonModule],
  templateUrl: './corps.component.html',
  styleUrls: ['./corps.component.css']
})

// --------------------------------------------------------------------------------------------------------------

export class CorpsComponent {
  private socket: any;
  private messageSubject = new Subject<string>();

  selectedButton: string = '';

// --------------------------------------------------------------------------------------------------------------

  displayedColumns: string[] = ['date', 'nom_mat', 'Quantite_mat', 'options'];
  dataSource = new MatTableDataSource<any>([]);
  type_trans: any;
  Quantite_trans: any;
  type_trans_al: any;
  Quantite_trans_al: any;
  modifierQuantite(_t45: any) {
  throw new Error('Method not implemented.');
  }

  seuilCritique = 10;

  public searchTerm: string = '';

  aliments: Aliment[] = [];
  transactionsAliment: TransactionAliment[] = [];

  nom_al: string = '';
  Quantite_al: number | null = null;
  selectedAliment: any = null;

  chartMateriels: any;
  chartAliments: any;
  transactionChart : any;

  nouveauMateriel: any;
  ajouterMateriel() {
  throw new Error('Method not implemented.');
  }

  filterDate: any;
  transactionsMateriel: TransactionMateriel[] = [];
  confirmerModification(_t45: Materiel) {
  throw new Error('Method not implemented.');
  }
  i = 0;
  datt: string = '';
  
  miseho1 = true;
  miseho2 = false;
  miseho3 = false;

  materiels: any[] = [];

  transactions: any[] = [];
  nom_mat: string = '';
  Quantite_mat: number | null = null;
  selectedMateriel: any = null;
  journee: Journee = { ID_journee: 0, date_du_jour: '' };
  totalMateriels: number = 0;
  totalAliments: number = 0; 
  refreshInterval: any;
  alimentTransactionChart: any;

  // --------------------------------------------------------------------------------------------------------------

  constructor(private http: HttpClient, private router: Router, private snackBar: MatSnackBar,) {
    this.socket = io('http://localhost:3000');
    this.socket.on('notification', (message: string) => {
      this.messageSubject.next(message);
    });
  }

  get notifications() {
    return this.messageSubject.asObservable();
  }

// --------------------------------------------------------------------------------------------------------------

  ngOnInit(): void {
    this.getDattToday();
    this.fetchMateriels();

    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        this.router.navigate(['/login']);
    }
    this.getMateriels();
    this.getTransactions();
    this.getTotalMateriels();
    this.getTotalAliments();
    this.getAliments(); 
    this.getTransactionsAliment();
    this.transactionsMateriel.reverse();
    this.materiels.reverse();
    this.snackBar.open('Bienvenue dans le STOCK KARIBOTEL', 'Fermer', { duration: 3000 });
    this.http.get<any[]>('http://localhost:3000/transactionsMateriel').subscribe(
      data => {
        this.transactionsMateriel = data; // Assurez-vous que ceci est correct
      },
      error => {
        console.error('Erreur lors de la récupération des transactions:', error);
        this.snackBar.open('Erreur lors de la récupération des transactions', 'Fermer', { duration: 3000 });
      }
    );
    this.getChartDataAliments();
    this.getChartData();
    this.getChartDataTransactions();
    this.getChartpieAliments();

    

    this.refreshInterval = setInterval(() => {
      this.getChartDataAliments();
      this.getChartData();
      this.getChartDataTransactions();
      this.getChartDataAliments();
      this.getChartpieAliments();
    }, 15000); 
}

// --------------------------------------------------------------------------------------------------------------

  ngOnDestroy(): void {
    // Nettoyer l'intervalle lors de la destruction du composant
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // --------------------------------------------------------------------------------------------------------------

  fetchMateriels(): void {
    this.http.get<any[]>('http://localhost:3000/api/materielIA')
      .subscribe(data => {
        this.materiels = data;
        this.checkStockLevels();
      });
  }

  // --------------------------------------------------------------------------------------------------------------

  checkStockLevels(): void {
    this.materiels.forEach(materiel => {
      if (materiel.Quantite_mat <= this.seuilCritique) {
        this.sendAlert(materiel);
      }
    });
  }

  // --------------------------------------------------------------------------------------------------------------

  sendAlert(materiel: any): void {
    const message = `Alerte : Le stock de ${materiel.nom_mat} est critique. Quantité restante : ${materiel.Quantite_mat}.`;
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }

// --------------------------------------------------------------------------------------------------------------

getDattToday() {
  const currentDate = new Date(); 
  this.datt = formatDate(currentDate, 'yyyy-MM-dd', 'en');
}

// --------------------------------------------------------------------------------------------------------------

  toggleAccueil(button: string): void {
    this.miseho1 = true;
    this.miseho2 = false;
    this.miseho3 = false;
    this.getChartData();
    this.getTotalMateriels();
    this.getChartDataAliments();
    this.getTotalAliments();
    this.getChartDataTransactions();
    this.getChartpieAliments();
    this.selectedButton = button;
  }
  // --------------------------------------------------------------------------------------------------------------

  toggleMateriel(button: string): void {
    this.miseho1 = false;
    this.miseho2 = true;
    this.miseho3 = false;
    this.selectedButton = button;
    
  }

  // --------------------------------------------------------------------------------------------------------------

  toggleCourse(button: string): void {
    this.miseho1 = false;
    this.miseho2 = false;
    this.miseho3 = true;
    this.selectedButton = button;
    
  }

  // --------------------------------------------------------------------------------------------------------------

  getTotalMateriels() {
    this.http.get<{ total: number }>('http://localhost:3000/countMateriels')
      .subscribe(response => {
        this.totalMateriels = response.total;
      });
  }

  // --------------------------------------------------------------------------------------------------------------

  getTotalAliments() {
    this.http.get<{ total: number }>('http://localhost:3000/countAliments')
      .subscribe(response => {
        this.totalAliments = response.total;
      });
  }
  
  // --------------------------------------------------------------------------------------------------------------

  getMateriels() {
    this.http.get<Materiel[]>('http://localhost:3000/materiels').subscribe(
      data => {
        this.materiels = data;
        this.materiels.reverse();
      },
      error => {
        console.error('Erreur lors de la récupération des matériels:', error);
        this.snackBar.open('Erreur lors de la récupération des matériels', 'Fermer', { duration: 3000 });
      }
    );
  }
  
  // --------------------------------------------------------------------------------------------------------------

  getAliments() {
    this.http.get<Aliment[]>('http://localhost:3000/aliments').subscribe(
      data => {
        this.aliments = data.reverse();
      },
      error => {
        console.error('Erreur lors de la récupération des aliments:', error);
        this.snackBar.open('Erreur lors de la récupération des aliments', 'Fermer', { duration: 3000 });
      }
    );
  }

  // --------------------------------------------------------------------------------------------------------------

  getTransactions() {
    this.http.get<TransactionMateriel[]>('http://localhost:3000/transactionsMateriel').subscribe(
      data => {
        this.transactionsMateriel = data;
        this.transactionsMateriel.reverse();
      },
      error => {
        console.error('Erreur lors de la récupération des transactions:', error);
        this.snackBar.open('Erreur lors de la récupération des transactions', 'Fermer', { duration: 3000 });
      }
    );
  }

  // --------------------------------------------------------------------------------------------------------------

  getTransactionsAliment() {
    this.http.get<TransactionAliment[]>('http://localhost:3000/transactionsAliment').subscribe(
      data => {
        this.transactionsAliment = data.reverse();
      },
      error => {
        console.error('Erreur lors de la récupération des transactions des aliments:', error);
        this.snackBar.open('Erreur lors de la récupération des transactions des aliments', 'Fermer', { duration: 3000 });
      }
    );
  }

  // --------------------------------------------------------------------------------------------------------------

  ajouterMaterielAvecTransaction() {
    if (!this.nom_mat || !this.Quantite_mat) {
      this.snackBar.open('Nom et quantité du matériel sont requis', 'Fermer', { duration: 3000 });
      return;
    }
  
    this.http.post<Journee>('http://localhost:3000/journee', { date_du_jour: this.datt }).subscribe(
      (journee) => {
        this.http.post('http://localhost:3000/materiels', {
          ID_journee: journee.ID_journee,
          nom_mat: this.nom_mat,
          Quantite_mat: this.Quantite_mat
        }).subscribe(
          () => {
            this.snackBar.open('Matériel ajouté avec succès', 'Fermer', { duration: 3000 });
            this.getMateriels();
            this.nom_mat = ''; // Réinitialiser le champ nom_mat
            this.Quantite_mat = null; // Réinitialiser le champ Quantite_mat
            this.getTransactions(); // Actualiser les transactions
            this.getChartData();
          },
          error => {
            if (error.status === 400) {
              // Si le serveur retourne un statut 400, cela signifie que le matériel existe déjà
              this.snackBar.open('Le nom du matériel existe déjà', 'Fermer', { duration: 3000 });
            } else {
              // Pour toute autre erreur
              this.snackBar.open('Erreur lors de l\'ajout du matériel', 'Fermer', { duration: 3000 });
            }
            console.error('Erreur lors de l\'ajout du matériel :', error);
          }
        );
      },
      error => {
        console.error('Erreur lors de l\'ajout de la journée :', error);
        this.snackBar.open('Erreur lors de l\'ajout de la journée', 'Fermer', { duration: 3000 });
      }
    );
  }  

  // --------------------------------------------------------------------------------------------------------------

  modifierMateriel(materiel: Materiel) {
    if (!materiel.nom_mat || !materiel.Quantite_mat) {
      this.snackBar.open('Nom et quantité du matériel sont requis', 'Fermer', { duration: 3000 });
      return;
    }


    this.http.put(`http://localhost:3000/materiels/${materiel.ID_mat}`, {
      nom_mat: materiel.nom_mat,
      Quantite_mat: materiel.Quantite_mat
      
    }).subscribe(
      () => { 
        this.snackBar.open('Matériel modifié avec succès', 'Fermer', { duration: 3000 });
        this.getMateriels(); 
        this.cancelSelection();
        this.getTransactions();
        this.getChartData();
        this.nom_mat = '';
        this.Quantite_mat = null; 
      },
      error => {
        console.error('Erreur lors de la modification du matériel :', error);
        this.snackBar.open('Erreur lors de la modification du matériel', 'Fermer', { duration: 3000 });
      }
    );
  }

  // --------------------------------------------------------------------------------------------------------------

  supprimerMateriel(ID_mat: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) {
        // D'abord, supprimer le matériel
        this.http.delete(`http://localhost:3000/materiels/${ID_mat}`).subscribe(
            response => {
                this.snackBar.open('Matériel supprimé avec succès', 'Fermer', { duration: 3000 });
                this.getMateriels();
                this.getTransactions();
                this.nom_mat = '';
                this.Quantite_mat = null;
                this.getChartData();
            },
            error => {
                console.error('Erreur lors de la suppression du matériel:', error);
                this.snackBar.open('Erreur lors de la suppression du matériel', 'Fermer', { duration: 3000 });
            }
        );
    }
}

// --------------------------------------------------------------------------------------------------------------

ajouterTransactionMateriel() {
  const date_du_jour = new Date().toISOString().split('T')[0]; // La date actuelle au format YYYY-MM-DD
  if (this.type_trans === 'sortie') {
    if (this.Quantite_trans > this.selectedMateriel.Quantite_mat) {
      this.snackBar.open('La quantité de sortie dépasse la quantité disponible.', 'Fermer', { duration: 3000 });
      return;
    }
  }
  // Appel backend pour ajouter ou récupérer l'ID de la journée
  this.http.post('http://localhost:3000/journee', { date_du_jour }).subscribe(
    (response: any) => {
      const ID_journee = response.ID_journee;

      // Ajouter la transaction
      const transactionData = {
        ID_journee: ID_journee,
        Nom_mat: this.selectedMateriel.nom_mat,
        Type_transaction: this.type_trans,
        Quantite: this.Quantite_trans,
        Date_transaction: date_du_jour
      };

      this.http.post('http://localhost:3000/transaction_materiel', transactionData).subscribe(
        (response) => {
          console.log('Transaction ajoutée avec succès:', response);
          this.snackBar.open('Transaction ajoutée avec succès', 'Fermer', { duration: 3000 });
          this.getMateriels();
          this.getTransactions();

          // Calculer la nouvelle quantité de matériel
          let nouvelleQuantite;
          if (this.type_trans === 'entrée') {
            nouvelleQuantite = this.selectedMateriel.Quantite_mat + this.Quantite_trans;
          } else if (this.type_trans === 'sortie' || this.type_trans === 'Cassé') {
            if (this.Quantite_trans > this.selectedMateriel.Quantite_mat) {
              this.snackBar.open('La quantité de sortie dépasse la quantité disponible.', 'Fermer', { duration: 3000 });
              return;
            }
            nouvelleQuantite = this.selectedMateriel.Quantite_mat - this.Quantite_trans;
          }

          // Mise à jour des données
          const updateData = {
            ID_materiel: this.selectedMateriel.ID_mat,
            nouvelleQuantite: nouvelleQuantite
          };

          this.http.post('http://localhost:3000/update-materiel-quantite', updateData).subscribe(
            (response) => {
              console.log('Quantité de matériel mise à jour avec succès:', response);
              this.getMateriels();
              this.getTransactions();
              this.type_trans =null;
              this.Quantite_trans = null;
              this.cancelSelection();
            },
            (error) => {
              console.error('Erreur lors de la mise à jour de la quantité de matériel :', error);
            }
          );
        },
        (error) => {
          console.error('Erreur lors de l\'ajout de la transaction:', error);
        }
      );
    },
    (error) => {
      console.error('Erreur lors de l\'ajout ou de la récupération de la journée:', error);
    }
  );
}

  // --------------------------------------------------------------------------------------------------------------

  selectMateriel(materiel: Materiel) {
    this.selectedMateriel = { ...materiel };
  }

  // --------------------------------------------------------------------------------------------------------------

  cancelSelection() {
    this.selectedMateriel = null;
  }

  // --------------------------------------------------------------------------------------------------------------

    ajouterAlimentAvecTransaction() {
    if (!this.nom_al || !this.Quantite_al) {
      this.snackBar.open('Nom et quantité de l\'aliment sont requis', 'Fermer', { duration: 3000 });
      return;
    }

    this.http.post<Journee>('http://localhost:3000/journee', { date_du_jour: this.datt }).subscribe(
      (journee) => {
        this.http.post('http://localhost:3000/aliments', {
          ID_journee: journee.ID_journee,
          nom_al: this.nom_al,
          Quantite_al: this.Quantite_al
        }).subscribe(
          () => {
            this.snackBar.open('Aliment ajouté avec succès', 'Fermer', { duration: 3000 });
            this.getAliments();
            this.nom_al = '';
            this.Quantite_al = null;
            this.getTransactionsAliment();
          },
          error => {
            this.snackBar.open('Erreur lors de l\'ajout de l\'aliment', 'Fermer', { duration: 3000 });
            console.error('Erreur lors de l\'ajout de l\'aliment :', error);
          }
        );
      },
      error => {
        this.snackBar.open('Erreur lors de l\'ajout de la journée', 'Fermer', { duration: 3000 });
        console.error('Erreur lors de l\'ajout de la journée :', error);
      }
    );
  }

  // Modifier un aliment
  modifierAliment(aliment: Aliment) {
    if (!aliment.nom_al || !aliment.Quantite_al) {
      this.snackBar.open('Nom et quantité de l\'aliment sont requis', 'Fermer', { duration: 3000 });
      return;
    }
  
    this.http.put(`http://localhost:3000/aliments/${aliment.ID_al}`, {
      nom_al: aliment.nom_al,
      Quantite_al: aliment.Quantite_al
    }).subscribe(
      () => { 
        this.snackBar.open('Aliment modifié avec succès', 'Fermer', { duration: 3000 });
        this.getAliments(); 
        this.cancelSelection();
        this.getTransactions();
        this.getTransactionsAliment();
        this.nom_al = '';
        this.Quantite_al = null; 
      },
      error => {
        console.error('Erreur lors de la modification de l\'aliment :', error);
        this.snackBar.open('Erreur lors de la modification de l\'aliment', 'Fermer', { duration: 3000 });
      }
    );
  }
  

  // Supprimer un aliment
  supprimerAliment(ID_al: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet aliment ?')) {
      this.http.delete(`http://localhost:3000/aliments/${ID_al}`).subscribe(
        () => {
          this.snackBar.open('Aliment supprimé avec succès', 'Fermer', { duration: 3000 });
          this.getAliments();
          this.getTransactionsAliment();
        },
        error => {
          console.error('Erreur lors de la suppression de l\'aliment:', error);
          this.snackBar.open('Erreur lors de la suppression de l\'aliment', 'Fermer', { duration: 3000 });
        }
      );
    }
  }

  // Sélectionner un aliment pour modification
  selectAliment(aliment: Aliment) {
    this.selectedAliment = { ...aliment };
  }

  cancelAlimentSelection() {
    this.selectedAliment = null;
  }

  // Ajouter une transaction pour un aliment
  ajouterTransactionAliment() {
    const date_du_jour = new Date().toISOString().split('T')[0]; // La date actuelle au format YYYY-MM-DD

    if (!this.selectedAliment.ID_al || !this.Quantite_trans_al) {
      this.snackBar.open('Tous les champs sont requis', 'Fermer', { duration: 3000 });
      return;
    }

    // Ajouter ou récupérer l'ID de la journée
    this.http.post('http://localhost:3000/journee', { date_du_jour }).subscribe(
      (response: any) => {
        const ID_journee = response.ID_journee;
        if (this.type_trans_al === 'sortie') {
          if (this.Quantite_trans_al > this.selectedAliment.Quantite_al) {
            this.snackBar.open('La quantité de sortie dépasse la quantité disponible.', 'Fermer', { duration: 3000 });
            return;
          }
        }

        // Ajouter la transaction
        const transactionData = {
          ID_journee: ID_journee,
          Nom_al: this.selectedAliment.nom_al,
          Type_transaction: this.type_trans_al,
          Quantite: this.Quantite_trans_al,
          Date_transaction: date_du_jour
        };

        this.http.post('http://localhost:3000/transaction_aliment', transactionData).subscribe(
          () => {
            console.log('Transaction ajoutée avec succès');
            this.snackBar.open('Transaction ajoutée avec succès.', 'Fermer', { duration: 3000 });

            // Calculer la nouvelle quantité d'aliment
            let nouvelleQuantite;
          
            if (this.type_trans_al === 'entrée') {
              nouvelleQuantite = this.selectedAliment.Quantite_al + this.Quantite_trans_al;
            } else if (this.type_trans_al === 'sortie' || this.type_trans_al === 'cassé') {
              if (this.Quantite_trans_al > this.selectedAliment.Quantite_al) {
                this.snackBar.open('La quantité de sortie dépasse la quantité disponible.', 'Fermer', { duration: 3000 });
                return;
              }
              nouvelleQuantite = this.selectedAliment.Quantite_al - this.Quantite_trans_al;
            }

            // Mise à jour des données
            const updateData = {
              ID_aliment: this.selectedAliment.ID_al,
              nouvelleQuantite: nouvelleQuantite
            };

            this.http.post('http://localhost:3000/update-aliment-quantite', updateData).subscribe(
              () => {
                console.log('Quantité d\'aliment mise à jour avec succès');
                this.getAliments(); // Rafraîchir la liste des aliments
                this.getTransactionsAliment(); // Rafraîchir la liste des transactions
                this.type_trans_al =null;
                this.Quantite_trans_al = null;
                this.cancelSelection();
              },
              error => {
                console.error('Erreur lors de la mise à jour de la quantité d\'aliment :', error);
                this.snackBar.open('Erreur lors de la mise à jour de la quantité d\'aliment', 'Fermer', { duration: 3000 });
              }
            );
          },
          error => {
            console.error('Erreur lors de l\'ajout de la transaction :', error);
            this.snackBar.open('Erreur lors de l\'ajout de la transaction', 'Fermer', { duration: 3000 });
          }
        );
      },
      error => {
        console.error('Erreur lors de l\'ajout ou de la récupération de la journée :', error);
        this.snackBar.open('Erreur lors de l\'ajout ou de la récupération de la journée', 'Fermer', { duration: 3000 });
      }
    );
  }

  getChartData() {
    this.http.get<{ data: any[] }>('http://localhost:3000/materielsQuantite')
      .subscribe(response => {
        const noms: string[] = [];
        const quantites: number[] = [];
        console.log('Données récupérées pour le diagramme :', response.data); // Vérifier les données récupérées
        response.data.forEach(item => {
          noms.push(item.nom_mat); // Nom du matériel pour l'axe X
          quantites.push(item.Quantite_mat); // Quantité pour l'axe Y
        });
        this.generateBarChart(noms, quantites); // Utiliser un graphique en bâtons
      });
  }

  generateBarChart(noms: string[], quantites: number[]) {
    if (this.chartMateriels) {
      this.chartMateriels.destroy(); // Détruire l'ancien graphique avant d'en créer un nouveau
    }
    this.chartMateriels = new Chart('canvas1', {
      type: 'bar',
      data: {
        labels: noms,
        datasets: [{
          label: 'Quantité de matériel',
          data: quantites,
          backgroundColor: quantites.map(() => this.getRandomColor()), // Couleurs aléatoires pour chaque barre
          borderColor: 'rgba(0, 0, 0, 0.2)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: (context) => `Quantité: ${context.raw}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Matériel'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantité'
            }
          }
        }
      }
    });
  }

  getChartDataAliments() {
    this.http.get<{ data: any[] }>('http://localhost:3000/alimentsQuantite')
      .subscribe(response => {
        const nomsAliments: string[] = [];
        const quantitesAliments: number[] = [];
        console.log('Données récupérées pour le diagramme des aliments :', response.data); // Vérifier les données récupérées

        response.data.forEach(item => {
          nomsAliments.push(item.nom_al); // Nom de l'aliment pour l'axe X
          quantitesAliments.push(item.Quantite_al); // Quantité pour l'axe Y
        });

        this.generateBarChartAliments(nomsAliments, quantitesAliments); // Générer le graphique
      });
  }

  generateBarChartAliments(nomsAliments: string[], quantitesAliments: number[]) {
    if (this.chartAliments) {
      this.chartAliments.destroy(); // Détruire l'ancien graphique avant d'en créer un nouveau
    }

    this.chartAliments = new Chart('canvas2', { // Utiliser un canvas ID différent pour les aliments
      type: 'bar',
      data: {
        labels: nomsAliments,
        datasets: [{
          label: 'Quantité d\'aliment',
          data: quantitesAliments,
          backgroundColor: quantitesAliments.map(() => this.getRandomColor()), // Couleurs aléatoires pour chaque barre
          borderColor: 'rgba(0, 0, 0, 0.2)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: (context) => `Quantité: ${context.raw}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Aliment'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantité'
            }
          }
        }
      }
    });
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }


  getChartDataTransactions() {
    this.http.get<{ data: any[] }>('http://localhost:3000/transactionsQuantite')
      .subscribe(response => {
        const transactionTypes: string[] = [];
        const transactionCounts: number[] = [];
        const colors: string[] = [];
  
        response.data.forEach(transaction => {
          transactionTypes.push(transaction.Type_transaction); // Nom du type de transaction
          transactionCounts.push(transaction.count); // Nombre de transactions pour ce type
  
          // Assigner une couleur en fonction du type de transaction
          switch (transaction.Type_transaction) {
            case 'supprimer':
              colors.push('red');
              break;
            case 'modifie':
              colors.push('blue');
              break;
            case 'entrée':
              colors.push('green');
              break;
            case 'sortie':
              colors.push('orange');
              break;
            case 'cassé':
              colors.push('grey');
              break;
            default:
              colors.push('grey'); // Couleur par défaut si un type de transaction est inconnu
          }
        });
  
        this.generateDoughnutChart(transactionTypes, transactionCounts, colors); // Générer le doughnut chart
      });
  }
  
  generateDoughnutChart(transactionTypes: string[], transactionCounts: number[], colors: string[]) {
    if (this.transactionChart) {
      this.transactionChart.destroy(); // Détruire l'ancien graphique avant d'en créer un nouveau
    }
  
    this.transactionChart = new Chart('canvas3', {
      type: 'pie',
      data: {
        labels: transactionTypes,
        datasets: [{
          data: transactionCounts,
          backgroundColor: colors, 
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.raw} transactions`
            }
          },
          datalabels: {
            color: '#fff', // Couleur du texte
            formatter: (value) => value, // Afficher la valeur brute
            font: {
              weight: 'bold',
              size: 14 // Taille de la police
            },
          }
        }
      },
      plugins: [ChartDataLabels] // Ajouter le plugin de datalabels
    });
  }
  
  getChartpieAliments() {
    this.http.get<{ data: any[] }>('http://localhost:3000/transactionsQuantiteAliments')
      .subscribe(response => {
        const transactionTypes: string[] = [];
        const transactionCounts: number[] = [];
        const colors: string[] = [];

        response.data.forEach(transaction => {
          transactionTypes.push(transaction.Type_transaction); // Nom du type de transaction
          transactionCounts.push(transaction.count); // Nombre de transactions pour ce type

          // Assigner une couleur en fonction du type de transaction
          switch (transaction.Type_transaction) {
            case 'supprimer':
              colors.push('red');
              break;
            case 'modifie':
              colors.push('blue');
              break;
            case 'entrée':
              colors.push('green');
              break;
            case 'sortie':
              colors.push('orange');
              break;
            case 'cassé':
              colors.push('grey');
              break;
            default:
              colors.push('grey');
          }
        });

        this.generateDoughnutChartAliment(transactionTypes, transactionCounts, colors);
      });
  }

  generateDoughnutChartAliment(transactionTypes: string[], transactionCounts: number[], colors: string[]) {
    if (this.alimentTransactionChart) {
      this.alimentTransactionChart.destroy(); 
    }

    this.alimentTransactionChart = new Chart('canvas4', {
      type: 'pie',
      data: {
        labels: transactionTypes,
        datasets: [{
          data: transactionCounts,
          backgroundColor: colors,
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.raw} transactions`
            }
          },
          datalabels: {
            color: '#fff', // Couleur du texte
            formatter: (value) => value, // Afficher la valeur brute
            font: {
              weight: 'bold',
              size: 14 // Taille de la police
            },
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

// ___________________________________________________________________________________________________________________________
searChercheur(critere: string): void {
  // Filtrage des matériels
  this.materiels = this.materiels.filter(materiel => {
    const values: Array<any> = Object.values(materiel);
    return values.some(value => value.toString().toLowerCase().includes(critere.toLowerCase()));
  });

  // Filtrage des aliments
  this.aliments = this.aliments.filter(aliment => {
    const values: Array<any> = Object.values(aliment);
    return values.some(value => value.toString().toLowerCase().includes(critere.toLowerCase()));
  });

  // Filtrage des transactions d'aliments
  this.transactionsAliment = this.transactionsAliment.filter(transaction => {
    const values: Array<any> = Object.values(transaction);
    return values.some(value => value.toString().toLowerCase().includes(critere.toLowerCase()));
  });

  // Filtrage des transactions de matériels (si nécessaire, sinon ignorez cette partie)
  this.transactionsMateriel = this.transactionsMateriel.filter(transaction => {
    const values: Array<any> = Object.values(transaction);
    return values.some(value => value.toString().toLowerCase().includes(critere.toLowerCase()));
  });
}

onInputChange(event: any): void {
  const searchTerm = event?.target?.value || '';
  if (searchTerm === '') {
    this.getMateriels();
    this.getAliments();
    this.getTransactions();
    this.getTransactionsAliment(); // Réinitialiser les transactions d'aliments
  }
  this.searChercheur(searchTerm);
}


}

