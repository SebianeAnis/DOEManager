const { ipcRenderer } = require('electron');

// Sélectionner le dossier source
document.getElementById('selectFolder').addEventListener('click', async () => {
  const path = await ipcRenderer.invoke('select-folder');
  if (path) document.getElementById('sourcePath').value = path;
});

// Sélectionner le dossier de destination
document.getElementById('selectDestFolder').addEventListener('click', async () => {
  const path = await ipcRenderer.invoke('select-destination');
  if (path) document.getElementById('destPath').value = path;
});

// Lancer la génération du dossier DOE
document.getElementById('generateDOE').addEventListener('click', async () => {
  const sourcePath = document.getElementById('sourcePath').value;
  const destPath = document.getElementById('destPath').value;
  const projectName = document.getElementById('projectName').value;
  const doeVersion = document.getElementById('doeVersion').value;
  const doeDate = document.getElementById('doeDate').value;

  if (sourcePath && destPath) {
    document.getElementById('logMessages').innerText = "🚀 Démarrage de la copie...\n";
    
    const result = await ipcRenderer.invoke('generate-doe', sourcePath, destPath, { projectName, doeVersion, doeDate });
    
    document.getElementById('logMessages').innerText = result;
    document.getElementById('logContainer').scrollTop = document.getElementById('logContainer').scrollHeight;
  } else {
    alert('Veuillez sélectionner les deux dossiers.');
  }
});