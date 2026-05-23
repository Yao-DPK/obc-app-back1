# ---------- Étape de développement ----------
FROM node:alpine AS development

WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier uniquement les fichiers de dépendances (pour bénéficier du cache Docker)
COPY package.json ./

# Installer toutes les dépendances (y compris devDependencies)
RUN pnpm install

# Copier le reste du code source
COPY . .

# Compiler l'application NestJS
RUN pnpm build

# ---------- Étape de production ----------
FROM node:alpine AS production

WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de dépendances
COPY package.json ./

# Installer uniquement les dépendances de production
RUN pnpm install --prod

# Copier le code compilé depuis l'étape de développement
COPY --from=development /usr/src/app/dist ./dist

# Si vous avez des fichiers statiques (ex: .env, views, etc.), copiez-les explicitement
# COPY --from=development /usr/src/app/src/views ./dist/views

# Exposer le port (par défaut 3031, ajustez selon votre besoin)
EXPOSE 3031

# Démarrer l'application
CMD ["node", "dist/src/main"]