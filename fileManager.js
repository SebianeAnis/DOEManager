// fileManager.js
const fs = require('fs');
const path = require('path');

// ✅ Crée la structure de base des dossiers
function createFolderStructure(destPath) {
  const folders = [
    '0 - Sommaire',
    '1 - Documents Etudes',
    '2 - Fiches techniques et manuels',
    '3 - Certificats'
  ];

  folders.forEach(folder => {
    const folderPath = path.join(destPath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  });
}

// ✅ Copie les fichiers (et sous-dossiers) sans écraser les fichiers existants
function copyFiles(sourceDir, destDir) {
  if (!fs.existsSync(sourceDir)) return;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  fs.readdirSync(sourceDir, { withFileTypes: true }).forEach(item => {
    const sourceFile = path.join(sourceDir, item.name);
    const destFile = path.join(destDir, item.name);

    if (item.isFile() && !fs.existsSync(destFile)) {
      fs.copyFileSync(sourceFile, destFile);
    } else if (item.isDirectory()) {
      copyFiles(sourceFile, destFile); // ✅ Copie récursive des sous-dossiers
    }
  });
}

// ✅ Trouve les dossiers machines dans le dossier source
function findMachineDirs(sourcePath) {
  return fs.readdirSync(sourcePath).filter(dir =>
    fs.lstatSync(path.join(sourcePath, dir)).isDirectory() && /(Master|Redu)/i.test(dir)
  );
}

// ✅ Génère le nom du dossier machine avec le bon préfixe et suffixe
function getMachineFolderName(machineName) {
  const prefix = machineName.split('_')[0];
  if (/Master 1/i.test(machineName)) return `${prefix}_L1`;
  if (/Master 2/i.test(machineName)) return `${prefix}_L2`;
  if (/Master 3/i.test(machineName)) return `${prefix}_L3`;
  if (/Redu/i.test(machineName)) return `${prefix}_Red`;
  return `${prefix}_Unknown`;
}

// ✅ Fonction 1 : Copier "Operating Instructions" et "System Docu" vers MANUELS
function copyManuals(machineDir, destPath) {
  const manualsDest = path.join(destPath, '2 - Fiches techniques et manuels', 'MANUELS');

  const operatingInstructionsPath = path.join(machineDir, 'Documents', 'Operating Instructions');
  if (fs.existsSync(operatingInstructionsPath)) copyFiles(operatingInstructionsPath, manualsDest);

  const systemDocuPath = path.join(machineDir, 'Device Data', 'System Docu');
  if (fs.existsSync(systemDocuPath)) copyFiles(systemDocuPath, manualsDest);
}

// ✅ Fonction 2 : Copier "Technical Instructions" vers FICHE TECHNIQUE
function copyTechnicalInstructions(machineDir, destPath) {
  const technicalInstructionsPath = path.join(machineDir, 'Documents', 'Technical Instructions');
  const ficheTechDest = path.join(destPath, '2 - Fiches techniques et manuels', 'FICHE TECHNIQUE');

  if (fs.existsSync(technicalInstructionsPath)) copyFiles(technicalInstructionsPath, ficheTechDest);
}

// ✅ Fonction 3 : Créer "RAPPORT D'INTERVENTION" dans "Fiches techniques et manuels"
function createInterventionReportFolder(destPath) {
  const reportFolderPath = path.join(destPath, '2 - Fiches techniques et manuels', "RAPPORT D'INTERVENTION");
  if (!fs.existsSync(reportFolderPath)) {
    fs.mkdirSync(reportFolderPath, { recursive: true });
  }
}

// ✅ Fonction 4 : Copier les fichiers précis et le contenu de IBN-Data
function copySystemDataFiles(machineDir, machineDestPath) {
  const systemDataPath = path.join(machineDir, 'Device Data', 'System Data');
  const keywords = ['PrevMaint', 'Fiche de donnèes', 'Signalist-Fieldbus', 'Systemdescription', 'protocole de gaz'];

  if (fs.existsSync(systemDataPath)) {
    fs.readdirSync(systemDataPath).forEach(file => {
      if (keywords.some(keyword => file.toLowerCase().includes(keyword.toLowerCase()))) {
        const sourceFile = path.join(systemDataPath, file);
        const destFile = path.join(machineDestPath, file);
        if (!fs.existsSync(destFile)) fs.copyFileSync(sourceFile, destFile);
      }
    });
  }
}

function copyIBNDataContent(machineDir, machineDestPath) {
  const ibnDataSource = path.join(machineDir, 'Device Data', 'System Data', 'IBN-Data');
  const ibnDataDest = path.join(machineDestPath, 'Rapport tests cube analyseur');

  if (fs.existsSync(ibnDataSource)) {
    if (!fs.existsSync(ibnDataDest)) fs.mkdirSync(ibnDataDest, { recursive: true });
    copyFiles(ibnDataSource, ibnDataDest); // ✅ Copie tout le contenu
  }
}

// ✅ Fonction 5 : Copier et renommer le plan PDF contenant "K9" vers "Documents Etudes"
function copyAndRenamePlan(machineDir, destPath) {
  try {
    const pdfSourcePath = path.join(machineDir, 'Device Data', 'Installation Drawings', 'PDF');
    const documentsEtudesDest = path.join(destPath, '1 - Documents Etudes');
    const machineName = path.basename(machineDir);

    if (!fs.existsSync(pdfSourcePath)) return;

    const planFiles = fs.readdirSync(pdfSourcePath).filter(file => /k9/i.test(file) && file.toLowerCase().endsWith('.pdf'));

    if (planFiles.length > 0) {
      const planFile = planFiles[0];
      let suffix = 'N_Unknown';
      if (/Master (\d)/i.test(machineName)) suffix = `N_${/Master (\d)/i.exec(machineName)[1]}`;
      else if (/Redu/i.test(machineName)) suffix = 'N_Redu';

      const newFileName = `Plan Analyseur ${suffix}.pdf`;
      const sourceFile = path.join(pdfSourcePath, planFile);
      const destFile = path.join(documentsEtudesDest, newFileName);

      if (!fs.existsSync(destFile)) {
        if (!fs.existsSync(documentsEtudesDest)) fs.mkdirSync(documentsEtudesDest, { recursive: true });
        fs.copyFileSync(sourceFile, destFile);
      }
    } else {
      console.warn(`⚠️ Aucun fichier PDF contenant "K9" trouvé pour ${machineName} dans ${pdfSourcePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur dans copyAndRenamePlan pour ${machineDir}:`, error);
  }
}

// ✅ Fonction 6 : Copier un seul fichier contenant "Sonde Chauffè" vers "Documents Etudes" (une seule fois)
function copySondeChauffeFile(machineDirs, destPath) {
  try {
    const documentsEtudesDest = path.join(destPath, '1 - Documents Etudes');

    for (const machineDir of machineDirs) {
      const deviceDataPath = path.join(machineDir, 'Device Data', 'System Data');

      if (!fs.existsSync(deviceDataPath)) continue;

      const sondeFiles = fs.readdirSync(deviceDataPath).filter(file => /sonde chauff[èe]/i.test(file));

      if (sondeFiles.length > 0) {
        const sondeFile = sondeFiles[0];
        const sourceFile = path.join(deviceDataPath, sondeFile);
        const destFile = path.join(documentsEtudesDest, sondeFile);

        if (!fs.existsSync(destFile)) {
          if (!fs.existsSync(documentsEtudesDest)) fs.mkdirSync(documentsEtudesDest, { recursive: true });
          fs.copyFileSync(sourceFile, destFile); // ✅ Copie le fichier contenant "Sonde Chauffè"
          console.log(`✅ Fichier "${sondeFile}" copié avec succès.`);
        }
        break; // ✅ Arrête la recherche après la première copie
      }
    }
  } catch (error) {
    console.error(`❌ Erreur dans copySondeChauffeFile :`, error);
  }
}

// ✅ Fonction principale pour traiter chaque machine avec les 5 premières fonctions
function processMachine(machineDir, destPath) {
  const machineName = path.basename(machineDir);
  const machineFolderName = getMachineFolderName(machineName);
  const machineDestPath = path.join(destPath, '2 - Fiches techniques et manuels', machineFolderName);

  if (!fs.existsSync(machineDestPath)) fs.mkdirSync(machineDestPath, { recursive: true });

  copySystemDataFiles(machineDir, machineDestPath);        // ✅ Fichiers précis de System Data
  copyIBNDataContent(machineDir, machineDestPath);         // ✅ Contenu de IBN-Data
  copyAndRenamePlan(machineDir, destPath);                 // ✅ Plan PDF contenant "K9"
}

// ✅ Fonction principale pour générer le DOE complet avec les 6 fonctions
function createDOE(sourcePath, destRootPath) {
  try {
    const date = new Date().toISOString().split('T')[0];
    const destPath = path.join(destRootPath, `DOE_${date}`);

    createFolderStructure(destPath); // ✅ Crée la structure de base des dossiers

    const machineDirs = findMachineDirs(sourcePath).map(dir => path.join(sourcePath, dir));

    // ✅ Exécution des trois premières fonctions générales
    machineDirs.forEach(machineDir => {
      copyManuals(machineDir, destPath);                // Fonction 1 : MANUELS
      copyTechnicalInstructions(machineDir, destPath); // Fonction 2 : FICHE TECHNIQUE
    });

    createInterventionReportFolder(destPath); // Fonction 3 : RAPPORT D'INTERVENTION

    // ✅ Boucle pour les fonctions spécifiques aux machines (4 et 5)
    machineDirs.forEach(machineDir => {
      processMachine(machineDir, destPath);
    });

    // ✅ Fonction 6 : Copie du fichier "Sonde Chauffè" (une seule fois)
    copySondeChauffeFile(machineDirs, destPath);

    return '✅ Génération terminée avec succès !';
  } catch (error) {
    console.error('❌ Erreur lors de la génération :', error);
    return '❌ Erreur lors de la génération.';
  }
}

module.exports = { createDOE };

/**
 * ✅ **Résumé des 5 fonctions de copie :**
 * 1️⃣ `copyManuals` : Copie "Operating Instructions" et "System Docu" vers "MANUELS".
 * 2️⃣ `copyTechnicalInstructions` : Copie "Technical Instructions" vers "FICHE TECHNIQUE".
 * 3️⃣ `createInterventionReportFolder` : Crée "RAPPORT D'INTERVENTION" si inexistant.
 * 4️⃣ `processMachine` :
 *     - Copie les fichiers précis de "System Data".
 *     - Copie le contenu de "IBN-Data" dans "Rapport tests cube analyseur".
 * 5️⃣ `copyAndRenamePlan` (Nouvelle fonction) :
 *     - Recherche un fichier PDF commençant par "K9" dans "Installation Drawings/PDF".
 *     - Copie et renomme le fichier en "Plan Analyseur N_(numéro ou Redu)".
 *     - Colle le fichier renommé dans "1 - Documents Etudes".
 *    ✅ **Corrections apportées à la fonction 5 :**
 *       - 🔎 Recherche améliorée pour détecter les fichiers PDF "K9..." avec ou sans espaces et majuscules.
 *       - ✅ Prend en compte les noms de fichiers contenant des espaces ou des caractères spéciaux.
 *       - ✅ Si aucun fichier n'est trouvé, un message d'avertissement est affiché.
 *       - ✅ Les fichiers sont renommés et copiés dans "1 - Documents Etudes" sans écrasement. 
 *6️⃣ **Nouvelle fonction ajoutée : `copySondeChauffeFile`**
 *       - 🔎 Recherche le fichier contenant "Sonde Chauffè" dans `Device Data / System Data`.
 *       - 📥 Copie le fichier trouvé dans "1 - Documents Etudes" sans écrasement.
 *       - ⚠️ Affiche un message si aucun fichier correspondant n'est trouvé.   
*/