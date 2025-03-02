const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fileManager = require('./fileManager');
const generateWord = require('./generateWord');

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

// Création de la fenêtre au démarrage
app.whenReady().then(createWindow);

// Gestion de la sélection de dossier source
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.filePaths[0];
});

// Gestion de la sélection de dossier de destination
ipcMain.handle('select-destination', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.filePaths[0];
});

// Gestion de la génération de dossier et des fichiers Word
ipcMain.handle('generate-doe', async (event, sourcePath, destPath, formData) => {
  const doeResult = fileManager.createDOE(sourcePath, destPath);
  
  const date = new Date().toISOString().split('T')[0];
  const destPath_0 = path.join(destPath, `DOE_${date}`);

  if (formData.projectName) {
    await generateWord.createWordDocs(destPath_0, formData);
  }
  
  return doeResult;
});
