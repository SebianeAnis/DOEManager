const fs = require('fs');
const path = require('path');
const DocxTemplater = require('docxtemplater');
const PizZip = require('pizzip');

async function createWordDocs(doePath, formData) {
  try {
    const sommairePath = path.join(doePath, '0 - Sommaire');
    if (!fs.existsSync(sommairePath)) {
      fs.mkdirSync(sommairePath, { recursive: true });
    }

    const templates = [
      { file: '0_1 - En tete DOE.docx', output: 'En_tete_DOE.docx' },
      { file: '0_2 - Sommaire DOEV3.docx', output: 'Sommaire_DOE.docx' }
    ];

    templates.forEach(template => {
      const templatePath = path.join(__dirname, 'templates', template.file);
      const outputPath = path.join(sommairePath, template.output);

      if (!fs.existsSync(templatePath)) {
        console.warn(`⚠️ Template non trouvé : ${templatePath}`);
        return;
      }

      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new DocxTemplater(zip);

      if (template.file === '0_2 - Sommaire DOEV3.docx') {
        const generatedTree = generateFolderTree(doePath);
        doc.render({
          PROJECT_NAME: formData.projectName,
          DOE_VERSION: formData.doeVersion,
          DOE_DATE: formData.doeDate,
          FOLDER_STRUCTURE: generatedTree
        });
      } else {
        doc.render({
          PROJECT_NAME: formData.projectName,
          DOE_VERSION: formData.doeVersion,
          DOE_DATE: formData.doeDate
        });
      }

      const buffer = doc.getZip().generate({ type: 'nodebuffer' });
      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ Fichier généré dans le bon dossier : ${outputPath}`);
    });
  } catch (error) {
    console.error(`❌ Erreur lors de la génération des fichiers Word :`, error);
  }
}

// ✅ Génération correcte du sommaire avec une structure Word compatible
function generateFolderTree(rootPath) {
    function walk(dir, depth = 0) {
      let tree = '';
      const items = fs.readdirSync(dir, { withFileTypes: true });
  
      // Trier d'abord les dossiers, puis les fichiers
      items.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });
  
      items.forEach(item => {
        if (item.isDirectory()) {
          tree += `${'    '.repeat(depth)}📂 ${item.name}\n`; // Dossier
          tree += walk(path.join(dir, item.name), depth + 1);
        } else {
          tree += `${'    '.repeat(depth + 1)}📄 ${item.name}\n`; // Fichier
        }
      });
      return tree;
    }
    return walk(rootPath);
  }

module.exports = { createWordDocs };