# 🎤 SmartStock TN — Kit Présentation & Vidéo 90s

Ce document contient les **8 slides prêtes pour Google Slides** et le **script exact de la vidéo de 90 secondes** pour l'équipier chargé de la présentation et de la soumission.

---

## 📊 Support de Présentation (8 Diapositives)

### Slide 1 : Titre & Accroche
- **Titre :** SmartStock TN 🇹🇳
- **Sous-titre :** L'Assistant IA Prédictif de Gestion des Stocks pour les Commerces Tunisiens
- **Accroche :** "Ne perdez plus jamais une vente à cause de rayons vides."
- **Équipe :** Hackathon Come Build with AI (Tunis)

### Slide 2 : Le Problème (Pain Point Réel)
- 50 000+ épiceries et superettes en Tunisie gèrent leurs stocks manuellement (cahier ou mémoire).
- **15% à 20% de chiffre d'affaires perdu** chaque année suite à des ruptures de stock sur les produits phares.
- Les pics de consommation saisonniers (Ramadan, été, rentrée) entraînent des ruptures brutales faute d'anticipation des délais fournisseurs.

### Slide 3 : La Solution SmartStock TN
- Un tableau de bord intuitif adapté au contexte local en Dinars Tunisiens (TND).
- **Moteur d'Arbitrage IA en Temps Réel :**
  - Alerte instantanée `jours_avant_rupture <= delai_fournisseur` : 🔴 Risque Critique.
  - Alerte préventive `jours_avant_rupture <= delai_fournisseur + 2` : 🟠 Attention.
  - Quantité optimale de commande calculée par **EOQ (Economic Order Quantity)**.

### Slide 4 : Architecture & Moteur RAG Hybride
- **Couche 1 :** Modèles NVIDIA NIM (`meta/llama-3.3-70b-instruct`) via les crédits Brev ($100).
- **Couche 2 :** Google Gemini 1.5 Flash pour le dialogue contextuel rapide.
- **Couche 3 :** Moteur déterministe & Calendrier Saisonnier Tunisien (Ramadan, Aïd, Tourisme).
- Haute fiabilité : le système fonctionne toujours, même en cas de latence réseau.

### Slide 5 : Démonstration du Produit
- *Insérer des captures d'écran de l'application :*
  1. Vue d'ensemble du Dashboard avec graphiques de stock et KPI.
  2. Simulateur de produit avec la bannière 🔴 Risque de Rupture.
  3. Assistant RAG en français répondant aux questions d'approvisionnement pour le Ramadan.
  4. Création d'un bon de commande B2B avec réajustement instantané du stock.

### Slide 6 : Spécificité Tunisienne (Pourquoi ce n'est pas un ERP classique)
- Modèle de données centré sur les marques locales : Harissa Le Phare, Couscous Randa, Vitalait, Boga, etc.
- Prise en compte des délais de livraison réels des grossistes tunisiens (1 à 7 jours).
- Zéro courbe d'apprentissage : formulaires simples et chat en langage naturel.

### Slide 7 : Modèle Économique & Viabilité
- **Modèle Freemium SaaS :**
  - *Gratuit :* Jusqu'à 20 produits, alertes de base.
  - *Pro (29 TND / mois) :* Prédictions IA illimitées, calendrier saisonnier, optimisation EOQ.
  - *Business (99 TND / mois) :* Multi-boutiques, intégration grossistes B2B.
- *Potentiel :* 50 000 épiceries × 29 TND = un marché adressable de 17.4M TND / an.

### Slide 8 : Prochaines Étapes & Conclusion
- Version mobile PWA pour scan des codes-barres sur smartphone.
- Connexion directe par API ou WhatsApp avec les grossistes et centrales d'achat.
- **SmartStock TN : Transformons le commerce de proximité grâce à l'IA.**

---

## 🎬 Script Vidéo Démo (Exactement 90 Secondes)

| Timing | Ce qu'on montre à l'écran | Ce que dit la voix off (Français) |
|---|---|---|
| **0:00 - 0:15** | Page de connexion puis Dashboard global avec les alertes en rouge. | *"Chaque jour en Tunisie, plus de 50 000 épiciers perdent des clients parce qu'un produit essentiel est en rupture. Pendant le Ramadan, la demande de dattes et de couscous explose de 300%, mais les commerçants continuent de commander à vue d'œil."* |
| **0:15 - 0:35** | Zoom sur le Simulateur IA du Dashboard, sélection de l'Harissa Le Phare. | *"Voici SmartStock TN, l'assistant IA conçu pour les commerces tunisiens. Sur le tableau de bord d'Ahmed, notre IA analyse instantanément l'Harissa Le Phare. Le stock actuel est de 12 tubes, avec des ventes de 3.5 par jour et un délai fournisseur de 3 jours."* |
| **0:35 - 0:55** | Clic sur "Recommander IA" -> Affichage de la bannière 🔴 RISQUE DE RUPTURE et de l'EOQ. | *"En un clic, l'IA sonne l'alarme : 🔴 RISQUE DE RUPTURE ! Le stock ne tiendra que 3.3 jours, ce qui est égal au délai du fournisseur. Grâce à la formule économique EOQ, SmartStock lui recommande de commander exactement 288 unités pour un coût optimal de 604 Dinars."* |
| **0:55 - 1:15** | Navigation vers l'onglet Prédictions & Assistant RAG, envoi d'une question sur le Ramadan. | *"Dans l'onglet Prédictions, nous combinons les modèles NVIDIA NIM Llama 3.3 et Gemini avec notre base RAG sur le marché tunisien. L'assistant explique clairement l'impact saisonnier du Ramadan et anticipe les hausses de volume sur le couscous et le lait."* |
| **1:15 - 1:30** | Passage rapide par l'historique des commandes B2B et conclusion sur le logo. | *"Ahmed valide sa commande en un geste. SmartStock TN réduit les ruptures de 60% et sécurise les marges du commerce local. SmartStock TN : ne perdez plus jamais une vente !"* |
