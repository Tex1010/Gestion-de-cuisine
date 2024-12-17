# Étape 1 : Construire l'application Angular
FROM node:18 AS build

# Définit le dossier de travail
WORKDIR /app

# Copie package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie les fichiers source Angular dans le conteneur
COPY . .

# Compile le projet Angular en mode production
RUN npm run build --prod

# Étape 2 : Exécuter l'application avec un serveur NGINX
FROM nginx:1.23.0

# Copie les fichiers build dans le dossier NGINX
COPY --from=build /app/dist/mon-projet-angular /usr/share/nginx/html

# Expose le port 80
EXPOSE 80

# Commande de démarrage de NGINX (par défaut)
CMD ["nginx", "-g", "daemon off;"]
