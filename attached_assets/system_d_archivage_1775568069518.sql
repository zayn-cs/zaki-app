-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mar. 07 avr. 2026 à 14:58
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `system d'archivage`
--

-- --------------------------------------------------------

--
-- Structure de la table `associer par`
--

CREATE TABLE `associer par` (
  `id_document` int(11) NOT NULL,
  `id_tag` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `bet`
--

CREATE TABLE `bet` (
  `id_bet` int(11) NOT NULL,
  `nom_bet` varchar(255) NOT NULL,
  `adresse` varchar(255) NOT NULL,
  `téléphone fixe` int(11) NOT NULL,
  `nom_gérant` text NOT NULL,
  `prenom_gérant` text NOT NULL,
  `téléphone_bet` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `blocks`
--

CREATE TABLE `blocks` (
  `id_block` int(11) NOT NULL,
  `nom_blocks` text NOT NULL,
  `surface` float NOT NULL,
  `nature structure` varchar(255) NOT NULL,
  `situation` text NOT NULL,
  `date_tansmission` datetime NOT NULL,
  `id_projet` int(11) NOT NULL,
  `id_lots` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `block_lot`
--

CREATE TABLE `block_lot` (
  `id_lot` int(11) NOT NULL,
  `id_block` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `cmd`
--

CREATE TABLE `cmd` (
  `id_CMD` int(11) NOT NULL,
  `nom_ CMD` int(11) NOT NULL,
  `id_région` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `document`
--

CREATE TABLE `document` (
  `id_document` int(11) NOT NULL,
  `nom_doc` text NOT NULL,
  `chemin` varchar(255) NOT NULL,
  `is globl` tinyint(1) NOT NULL,
  `date_creation` date NOT NULL,
  `id_phase` int(11) NOT NULL,
  `commentaire` longtext NOT NULL,
  `id_version` int(11) NOT NULL,
  `id_projret` int(11) NOT NULL,
  `id_type` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `département`
--

CREATE TABLE `département` (
  `id-département` int(11) NOT NULL,
  `nom` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `historique`
--

CREATE TABLE `historique` (
  `id_historique` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `date_action` date NOT NULL,
  `id_utilisateur` int(11) NOT NULL,
  `entite type` varchar(255) NOT NULL,
  `entite_id` int(11) NOT NULL,
  `comentaire` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `lot`
--

CREATE TABLE `lot` (
  `id_lot` int(11) NOT NULL,
  `nom_lot` text NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_departement` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `phase`
--

CREATE TABLE `phase` (
  `id_phase` int(11) NOT NULL,
  `nome_phase` text NOT NULL,
  `date_début` date NOT NULL,
  `date_fin` date NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_lot` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `projet`
--

CREATE TABLE `projet` (
  `id_projet` int(11) NOT NULL,
  `N°` double NOT NULL,
  `id_unite` int(11) NOT NULL,
  `PA` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `N°OP` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `montant_delegue` double NOT NULL,
  `montant_engagement` double NOT NULL,
  `montant_paiement` double NOT NULL,
  `programme` longtext CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `programme a realiser` longtext CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `stade` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `situation de l'objectif` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `contrainte` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `codification cc` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `id_bet` int(11) NOT NULL,
  `delais` int(11) NOT NULL,
  `debut_etude` datetime NOT NULL,
  `fin_etude` datetime NOT NULL,
  `essais` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `fin prev` datetime NOT NULL,
  `observation` longtext CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `interne` longtext CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `priorité` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `type` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `reference_priorité` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `date_ achevement` datetime NOT NULL,
  `chef_projet` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `région`
--

CREATE TABLE `région` (
  `id_région` int(11) NOT NULL,
  `nom_Région` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `tag`
--

CREATE TABLE `tag` (
  `id_tag` int(11) NOT NULL,
  `lib_tag` varchar(255) NOT NULL,
  `description` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `type`
--

CREATE TABLE `type` (
  `id_type` int(11) NOT NULL,
  `lib_type` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `type phase`
--

CREATE TABLE `type phase` (
  `id_type phasre` int(11) NOT NULL,
  `id_phase` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `unite`
--

CREATE TABLE `unite` (
  `id_unite` int(11) NOT NULL,
  `nom_unite` text NOT NULL,
  `id_CMD` int(11) NOT NULL,
  `id_projet` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

CREATE TABLE `utilisateur` (
  `id-user` int(11) NOT NULL,
  `nom` text NOT NULL,
  `prenom` text NOT NULL,
  `messager` varchar(255) NOT NULL,
  `mot-pass` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `telephone_professional` int(11) NOT NULL,
  `telephone_personnel` int(11) NOT NULL,
  `grade` text NOT NULL,
  `adresse` varchar(255) NOT NULL,
  `is chef project` tinyint(1) NOT NULL,
  `id_ département` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `version`
--

CREATE TABLE `version` (
  `id_version` int(11) NOT NULL,
  `numero-version` int(11) NOT NULL,
  `date_modification` date NOT NULL,
  `fichier path` varchar(255) NOT NULL,
  `commentaire` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `zone`
--

CREATE TABLE `zone` (
  `id_zone` int(11) NOT NULL,
  `nom_zone` text NOT NULL,
  `id_block` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `associer par`
--
ALTER TABLE `associer par`
  ADD KEY `id_document` (`id_document`),
  ADD KEY `id_tag` (`id_tag`);

--
-- Index pour la table `bet`
--
ALTER TABLE `bet`
  ADD PRIMARY KEY (`id_bet`);

--
-- Index pour la table `blocks`
--
ALTER TABLE `blocks`
  ADD PRIMARY KEY (`id_block`),
  ADD KEY `id_projet` (`id_projet`),
  ADD KEY `id_lots` (`id_lots`);

--
-- Index pour la table `block_lot`
--
ALTER TABLE `block_lot`
  ADD UNIQUE KEY `id_lot` (`id_lot`),
  ADD UNIQUE KEY `id_block` (`id_block`);

--
-- Index pour la table `cmd`
--
ALTER TABLE `cmd`
  ADD PRIMARY KEY (`id_CMD`),
  ADD KEY `id_région` (`id_région`) USING BTREE;

--
-- Index pour la table `document`
--
ALTER TABLE `document`
  ADD PRIMARY KEY (`id_document`),
  ADD UNIQUE KEY `id_type` (`id_type`),
  ADD KEY `id_phase` (`id_phase`),
  ADD KEY `id_version` (`id_version`),
  ADD KEY `id_projret` (`id_projret`);

--
-- Index pour la table `département`
--
ALTER TABLE `département`
  ADD PRIMARY KEY (`id-département`);

--
-- Index pour la table `historique`
--
ALTER TABLE `historique`
  ADD PRIMARY KEY (`id_historique`),
  ADD KEY `id_utilisateur` (`id_utilisateur`);

--
-- Index pour la table `lot`
--
ALTER TABLE `lot`
  ADD PRIMARY KEY (`id_lot`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `id_departement` (`id_departement`);

--
-- Index pour la table `phase`
--
ALTER TABLE `phase`
  ADD PRIMARY KEY (`id_phase`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `id_lot` (`id_lot`);

--
-- Index pour la table `projet`
--
ALTER TABLE `projet`
  ADD PRIMARY KEY (`id_projet`),
  ADD KEY `id_unite` (`id_unite`,`id_bet`,`chef_projet`),
  ADD KEY `id_bet` (`id_bet`),
  ADD KEY `chef_projet` (`chef_projet`);

--
-- Index pour la table `région`
--
ALTER TABLE `région`
  ADD PRIMARY KEY (`id_région`);

--
-- Index pour la table `tag`
--
ALTER TABLE `tag`
  ADD PRIMARY KEY (`id_tag`);

--
-- Index pour la table `type`
--
ALTER TABLE `type`
  ADD PRIMARY KEY (`id_type`);

--
-- Index pour la table `type phase`
--
ALTER TABLE `type phase`
  ADD PRIMARY KEY (`id_type phasre`),
  ADD UNIQUE KEY `id_phase` (`id_phase`);

--
-- Index pour la table `unite`
--
ALTER TABLE `unite`
  ADD PRIMARY KEY (`id_unite`),
  ADD UNIQUE KEY `id_projet` (`id_projet`),
  ADD KEY `id_CMD` (`id_CMD`);

--
-- Index pour la table `utilisateur`
--
ALTER TABLE `utilisateur`
  ADD PRIMARY KEY (`id-user`),
  ADD KEY `id_ département` (`id_ département`);

--
-- Index pour la table `version`
--
ALTER TABLE `version`
  ADD PRIMARY KEY (`id_version`);

--
-- Index pour la table `zone`
--
ALTER TABLE `zone`
  ADD PRIMARY KEY (`id_zone`),
  ADD KEY `id_block` (`id_block`);

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `associer par`
--
ALTER TABLE `associer par`
  ADD CONSTRAINT `associer par_ibfk_1` FOREIGN KEY (`id_document`) REFERENCES `document` (`id_document`),
  ADD CONSTRAINT `associer par_ibfk_2` FOREIGN KEY (`id_tag`) REFERENCES `tag` (`id_tag`);

--
-- Contraintes pour la table `blocks`
--
ALTER TABLE `blocks`
  ADD CONSTRAINT `blocks_ibfk_1` FOREIGN KEY (`id_projet`) REFERENCES `projet` (`id_projet`),
  ADD CONSTRAINT `blocks_ibfk_2` FOREIGN KEY (`id_lots`) REFERENCES `lot` (`id_lot`);

--
-- Contraintes pour la table `block_lot`
--
ALTER TABLE `block_lot`
  ADD CONSTRAINT `block_lot_ibfk_1` FOREIGN KEY (`id_block`) REFERENCES `blocks` (`id_block`),
  ADD CONSTRAINT `block_lot_ibfk_2` FOREIGN KEY (`id_lot`) REFERENCES `lot` (`id_lot`);

--
-- Contraintes pour la table `cmd`
--
ALTER TABLE `cmd`
  ADD CONSTRAINT `cmd_ibfk_1` FOREIGN KEY (`id_région`) REFERENCES `région` (`id_région`);

--
-- Contraintes pour la table `document`
--
ALTER TABLE `document`
  ADD CONSTRAINT `document_ibfk_1` FOREIGN KEY (`id_phase`) REFERENCES `phase` (`id_phase`),
  ADD CONSTRAINT `document_ibfk_2` FOREIGN KEY (`id_version`) REFERENCES `version` (`id_version`),
  ADD CONSTRAINT `document_ibfk_3` FOREIGN KEY (`id_projret`) REFERENCES `projet` (`id_projet`),
  ADD CONSTRAINT `document_ibfk_4` FOREIGN KEY (`id_type`) REFERENCES `type` (`id_type`);

--
-- Contraintes pour la table `historique`
--
ALTER TABLE `historique`
  ADD CONSTRAINT `historique_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id-user`);

--
-- Contraintes pour la table `lot`
--
ALTER TABLE `lot`
  ADD CONSTRAINT `lot_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `utilisateur` (`id-user`);

--
-- Contraintes pour la table `phase`
--
ALTER TABLE `phase`
  ADD CONSTRAINT `phase_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `utilisateur` (`id-user`),
  ADD CONSTRAINT `phase_ibfk_2` FOREIGN KEY (`id_lot`) REFERENCES `lot` (`id_lot`);

--
-- Contraintes pour la table `projet`
--
ALTER TABLE `projet`
  ADD CONSTRAINT `projet_ibfk_1` FOREIGN KEY (`id_unite`) REFERENCES `unite` (`id_unite`),
  ADD CONSTRAINT `projet_ibfk_2` FOREIGN KEY (`id_bet`) REFERENCES `bet` (`id_bet`),
  ADD CONSTRAINT `projet_ibfk_3` FOREIGN KEY (`chef_projet`) REFERENCES `utilisateur` (`id-user`);

--
-- Contraintes pour la table `type phase`
--
ALTER TABLE `type phase`
  ADD CONSTRAINT `type phase_ibfk_1` FOREIGN KEY (`id_phase`) REFERENCES `phase` (`id_phase`);

--
-- Contraintes pour la table `unite`
--
ALTER TABLE `unite`
  ADD CONSTRAINT `unite_ibfk_1` FOREIGN KEY (`id_CMD`) REFERENCES `cmd` (`id_CMD`),
  ADD CONSTRAINT `unite_ibfk_2` FOREIGN KEY (`id_projet`) REFERENCES `projet` (`id_projet`);

--
-- Contraintes pour la table `utilisateur`
--
ALTER TABLE `utilisateur`
  ADD CONSTRAINT `utilisateur_ibfk_1` FOREIGN KEY (`id_ département`) REFERENCES `département` (`id-département`);

--
-- Contraintes pour la table `zone`
--
ALTER TABLE `zone`
  ADD CONSTRAINT `zone_ibfk_1` FOREIGN KEY (`id_block`) REFERENCES `blocks` (`id_block`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
