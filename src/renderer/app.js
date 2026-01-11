/**
 * Main Application Logic for EO Pub Editor
 */

// Application State
const AppState = {
  currentFile: null,
  filePath: null,
  eifData: null,
  selectedItemId: null,
  gfxFolder: null,
  gfxCache: new Map(),
  isDirty: false,
  previewMode: 'static', // 'static' or 'animated'
  animator: null
};

// Item Type Names
const ItemTypes = {
  0: 'Static',
  1: 'Unknown1',
  2: 'Money',
  3: 'Heal',
  4: 'Teleport',
  5: 'Spell',
  6: 'EXP Reward',
  7: 'Stat Reward',
  8: 'Skill Reward',
  9: 'Key',
  10: 'Weapon',
  11: 'Shield',
  12: 'Armor',
  13: 'Hat',
  14: 'Boots',
  15: 'Gloves',
  16: 'Accessory',
  17: 'Belt',
  18: 'Necklace',
  19: 'Ring',
  20: 'Armlet',
  21: 'Bracer',
  22: 'Beer',
  23: 'EffectPotion',
  24: 'HairDye',
  25: 'CureCurse'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  updateUI();
});

function initializeEventListeners() {
  // File operations
  document.getElementById('openFileBtn').addEventListener('click', openFile);
  document.getElementById('saveFileBtn').addEventListener('click', saveFile);
  document.getElementById('openGFXBtn').addEventListener('click', openGFXFolder);
  
  // Item operations
  document.getElementById('addItemBtn').addEventListener('click', addItem);
  document.getElementById('deleteItemBtn').addEventListener('click', deleteItem);
  document.getElementById('duplicateItemBtn').addEventListener('click', duplicateItem);
  
  // Search
  document.getElementById('searchInput').addEventListener('input', filterItems);
  
  // GFX operations
  document.getElementById('gfxInput').addEventListener('change', onGFXInputChange);
  document.getElementById('browseGFXBtn').addEventListener('click', openGFXBrowser);
  
  // Preview mode toggle
  document.getElementById('staticPreviewBtn').addEventListener('click', () => setPreviewMode('static'));
  document.getElementById('animatedPreviewBtn').addEventListener('click', () => setPreviewMode('animated'));
  
  // Modal
  document.querySelector('.close-modal').addEventListener('click', closeGFXBrowser);
  document.getElementById('gfxBrowserModal').addEventListener('click', (e) => {
    if (e.target.id === 'gfxBrowserModal') {
      closeGFXBrowser();
    }
  });
  
  // Initialize character animator
  AppState.animator = new CharacterAnimator();
}

// File Operations
async function openFile() {
  try {
    const filePath = await window.electronAPI.openFile([
      { name: 'Item Files', extensions: ['eif'] },
      { name: 'All Files', extensions: ['*'] }
    ]);
    
    if (!filePath) return;
    
    setStatus('Loading file...');
    
    const result = await window.electronAPI.readFile(filePath);
    if (!result.success) {
      alert(`Error reading file: ${result.error}`);
      setStatus('Error loading file');
      return;
    }
    
    // Parse EIF file
    const fileData = new Uint8Array(result.data);
    AppState.eifData = EIFParser.parse(fileData);
    AppState.filePath = filePath;
    AppState.currentFile = filePath.split(/[\\/]/).pop();
    AppState.isDirty = false;
    
    setStatus(`Loaded ${AppState.currentFile} - ${AppState.eifData.records.length} items`);
    updateUI();
    renderItemList();
    
  } catch (error) {
    console.error('Error opening file:', error);
    alert(`Error parsing file: ${error.message}`);
    setStatus('Error');
  }
}

async function saveFile() {
  if (!AppState.eifData) return;
  
  try {
    let savePath = AppState.filePath;
    
    // Ask for save location if not already set
    if (!savePath) {
      savePath = await window.electronAPI.saveFile(
        AppState.currentFile || 'items.eif',
        [
          { name: 'Item Files', extensions: ['eif'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      );
      
      if (!savePath) return;
    }
    
    setStatus('Saving file...');
    
    // Serialize EIF data
    const fileData = EIFParser.serialize(AppState.eifData);
    
    // Write to file
    const result = await window.electronAPI.writeFile(savePath, Array.from(fileData));
    
    if (!result.success) {
      alert(`Error saving file: ${result.error}`);
      setStatus('Error saving file');
      return;
    }
    
    AppState.filePath = savePath;
    AppState.currentFile = savePath.split(/[\\/]/).pop();
    AppState.isDirty = false;
    
    setStatus(`Saved ${AppState.currentFile}`);
    updateUI();
    
  } catch (error) {
    console.error('Error saving file:', error);
    alert(`Error saving file: ${error.message}`);
    setStatus('Error');
  }
}

async function openGFXFolder() {
  try {
    const folderPath = await window.electronAPI.openGFXFolder();
    if (!folderPath) return;
    
    AppState.gfxFolder = folderPath;
    AppState.gfxCache.clear();
    
    // Test loading GFX files
    const result = await window.electronAPI.listGFXFiles(folderPath);
    if (result.success) {
      setStatus(`GFX folder set - ${result.files.length} GFX files found`);
      document.getElementById('gfxFileInfo').textContent = 
        `${result.files.length} GFX files available`;
    } else {
      alert(`Error reading GFX folder: ${result.error}`);
    }
    
    updateUI();
    
    // Reload preview if item is selected
    if (AppState.selectedItemId) {
      loadGFXPreview(AppState.eifData.records[AppState.selectedItemId - 1].properties.graphic);
    }
    
  } catch (error) {
    console.error('Error opening GFX folder:', error);
    alert(`Error: ${error.message}`);
  }
}

// Item Operations
function addItem() {
  if (!AppState.eifData) return;
  
  const newId = AppState.eifData.records.length + 1;
  const newRecord = new EIFRecord(newId, `New Item ${newId}`);
  
  AppState.eifData.records.push(newRecord);
  AppState.eifData.totalLength = AppState.eifData.records.length;
  AppState.isDirty = true;
  
  renderItemList();
  selectItem(newId);
  updateUI();
  setStatus('Added new item');
}

function deleteItem() {
  if (!AppState.selectedItemId || !AppState.eifData) return;
  
  if (!confirm(`Delete item #${AppState.selectedItemId}?`)) return;
  
  // Remove the item
  AppState.eifData.records = AppState.eifData.records.filter(
    r => r.id !== AppState.selectedItemId
  );
  
  // Re-index items
  AppState.eifData.records.forEach((record, index) => {
    record.id = index + 1;
  });
  
  AppState.eifData.totalLength = AppState.eifData.records.length;
  AppState.selectedItemId = null;
  AppState.isDirty = true;
  
  renderItemList();
  clearEditor();
  updateUI();
  setStatus('Deleted item');
}

function duplicateItem() {
  if (!AppState.selectedItemId || !AppState.eifData) return;
  
  const original = AppState.eifData.records.find(r => r.id === AppState.selectedItemId);
  if (!original) return;
  
  const newId = AppState.eifData.records.length + 1;
  const duplicate = new EIFRecord(newId, original.name + ' (Copy)');
  
  // Copy all properties
  for (const key in original.properties) {
    duplicate.properties[key] = original.properties[key];
  }
  
  AppState.eifData.records.push(duplicate);
  AppState.eifData.totalLength = AppState.eifData.records.length;
  AppState.isDirty = true;
  
  renderItemList();
  selectItem(newId);
  updateUI();
  setStatus('Duplicated item');
}

// UI Rendering
function renderItemList(filter = '') {
  if (!AppState.eifData) return;
  
  const itemList = document.getElementById('itemList');
  itemList.innerHTML = '';
  
  const filteredRecords = AppState.eifData.records.filter(record => {
    if (!filter) return true;
    const searchLower = filter.toLowerCase();
    return record.name.toLowerCase().includes(searchLower) ||
           record.id.toString().includes(searchLower);
  });
  
  filteredRecords.forEach(record => {
    const card = document.createElement('div');
    card.className = 'item-card';
    if (record.id === AppState.selectedItemId) {
      card.classList.add('active');
    }
    
    const typeName = ItemTypes[record.properties.type] || 'Unknown';
    
    card.innerHTML = `
      <div class="item-card-header">
        <span class="item-id">#${record.id}</span>
      </div>
      <div class="item-name">${record.name || '(Unnamed)'}</div>
      <div class="item-type">Type: ${typeName}</div>
    `;
    
    card.addEventListener('click', () => selectItem(record.id));
    itemList.appendChild(card);
  });
  
  if (filteredRecords.length === 0) {
    itemList.innerHTML = '<div class="empty-state"><p>No items found</p></div>';
  }
}

function selectItem(itemId) {
  AppState.selectedItemId = itemId;
  renderItemList(document.getElementById('searchInput').value);
  renderEditor();
  updateUI();
}

function renderEditor() {
  const editorContent = document.getElementById('editorContent');
  
  if (!AppState.selectedItemId || !AppState.eifData) {
    clearEditor();
    return;
  }
  
  const record = AppState.eifData.records.find(r => r.id === AppState.selectedItemId);
  if (!record) {
    clearEditor();
    return;
  }
  
  document.getElementById('editorTitle').textContent = `Item #${record.id}`;
  
  editorContent.innerHTML = `
    <div class="form-section">
      <h3>Basic Information</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Item Name</label>
          <input type="text" id="itemName" value="${record.name}">
        </div>
        <div class="form-group">
          <label>Item ID</label>
          <input type="number" id="itemId" value="${record.id}" readonly>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Type</label>
          <select id="itemType">
            ${Object.entries(ItemTypes).map(([value, name]) => 
              `<option value="${value}" ${record.properties.type == value ? 'selected' : ''}>${name}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Sub Type</label>
          <input type="number" id="itemSubType" value="${record.properties.subType}" min="0">
        </div>
        <div class="form-group">
          <label>Graphic ID</label>
          <input type="number" id="itemGraphic" value="${record.properties.graphic}" min="0">
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>Stats</h3>
      <div class="form-row">
        <div class="form-group">
          <label>HP</label>
          <input type="number" id="itemHP" value="${record.properties.hp}" min="0">
        </div>
        <div class="form-group">
          <label>TP</label>
          <input type="number" id="itemTP" value="${record.properties.tp}" min="0">
        </div>
        <div class="form-group">
          <label>Min Damage</label>
          <input type="number" id="itemMinDam" value="${record.properties.minDam}" min="0">
        </div>
        <div class="form-group">
          <label>Max Damage</label>
          <input type="number" id="itemMaxDam" value="${record.properties.maxDam}" min="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Accuracy</label>
          <input type="number" id="itemAccuracy" value="${record.properties.accuracy}" min="0">
        </div>
        <div class="form-group">
          <label>Evade</label>
          <input type="number" id="itemEvade" value="${record.properties.evade}" min="0">
        </div>
        <div class="form-group">
          <label>Armor</label>
          <input type="number" id="itemArmor" value="${record.properties.armor}" min="0">
        </div>
        <div class="form-group">
          <label>Weight</label>
          <input type="number" id="itemWeight" value="${record.properties.weight}" min="0" max="255">
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>Stat Modifiers</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Strength</label>
          <input type="number" id="itemStr" value="${record.properties.str}" min="0" max="255">
        </div>
        <div class="form-group">
          <label>Intelligence</label>
          <input type="number" id="itemInt" value="${record.properties.int}" min="0" max="255">
        </div>
        <div class="form-group">
          <label>Wisdom</label>
          <input type="number" id="itemWis" value="${record.properties.wis}" min="0" max="255">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Agility</label>
          <input type="number" id="itemAgi" value="${record.properties.agi}" min="0" max="255">
        </div>
        <div class="form-group">
          <label>Constitution</label>
          <input type="number" id="itemCon" value="${record.properties.con}" min="0" max="255">
        </div>
        <div class="form-group">
          <label>Charisma</label>
          <input type="number" id="itemCha" value="${record.properties.cha}" min="0" max="255">
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>Requirements</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Level Req</label>
          <input type="number" id="itemLevelReq" value="${record.properties.levelReq}" min="0">
        </div>
        <div class="form-group">
          <label>Class Req</label>
          <input type="number" id="itemClassReq" value="${record.properties.classReq}" min="0">
        </div>
        <div class="form-group">
          <label>Str Req</label>
          <input type="number" id="itemStrReq" value="${record.properties.strReq}" min="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Int Req</label>
          <input type="number" id="itemIntReq" value="${record.properties.intReq}" min="0">
        </div>
        <div class="form-group">
          <label>Wis Req</label>
          <input type="number" id="itemWisReq" value="${record.properties.wisReq}" min="0">
        </div>
        <div class="form-group">
          <label>Agi Req</label>
          <input type="number" id="itemAgiReq" value="${record.properties.agiReq}" min="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Con Req</label>
          <input type="number" id="itemConReq" value="${record.properties.conReq}" min="0">
        </div>
        <div class="form-group">
          <label>Cha Req</label>
          <input type="number" id="itemChaReq" value="${record.properties.chaReq}" min="0">
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>Additional Properties</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Special</label>
          <input type="number" id="itemSpecial" value="${record.properties.special}" min="0" max="255">
        </div>
        <div class="form-group">
          <label>Size</label>
          <input type="number" id="itemSize" value="${record.properties.size}" min="0" max="255">
        </div>
        <div class="form-group">
          <label>Gender</label>
          <input type="number" id="itemGender" value="${record.properties.gender}" min="0" max="255">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Doll Graphic</label>
          <input type="number" id="itemDollGraphic" value="${record.properties.dollGraphic}" min="0">
        </div>
        <div class="form-group">
          <label>Element</label>
          <input type="number" id="itemElement" value="${record.properties.element}" min="0" max="255">
        </div>
        <div class="form-group">
          <label>Element Power</label>
          <input type="number" id="itemElementPower" value="${record.properties.elementPower}" min="0" max="255">
        </div>
      </div>
    </div>
  `;
  
  // Add change listeners to all inputs
  editorContent.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('change', () => saveItemChanges());
  });
  
  // Load GFX preview
  loadGFXPreview(record.properties.graphic);
}

function clearEditor() {
  const editorContent = document.getElementById('editorContent');
  editorContent.innerHTML = '<div class="empty-state"><p>Select an item to edit</p></div>';
  document.getElementById('editorTitle').textContent = 'Item Editor';
  clearGFXPreview();
}

function saveItemChanges() {
  if (!AppState.selectedItemId || !AppState.eifData) return;
  
  const record = AppState.eifData.records.find(r => r.id === AppState.selectedItemId);
  if (!record) return;
  
  // Update record from form
  const getValue = (id) => document.getElementById(id)?.value;
  const getNumValue = (id) => parseInt(getValue(id) || 0, 10);
  
  record.name = getValue('itemName');
  record.properties.type = getNumValue('itemType');
  record.properties.subType = getNumValue('itemSubType');
  record.properties.graphic = getNumValue('itemGraphic');
  record.properties.hp = getNumValue('itemHP');
  record.properties.tp = getNumValue('itemTP');
  record.properties.minDam = getNumValue('itemMinDam');
  record.properties.maxDam = getNumValue('itemMaxDam');
  record.properties.accuracy = getNumValue('itemAccuracy');
  record.properties.evade = getNumValue('itemEvade');
  record.properties.armor = getNumValue('itemArmor');
  record.properties.weight = getNumValue('itemWeight');
  record.properties.str = getNumValue('itemStr');
  record.properties.int = getNumValue('itemInt');
  record.properties.wis = getNumValue('itemWis');
  record.properties.agi = getNumValue('itemAgi');
  record.properties.con = getNumValue('itemCon');
  record.properties.cha = getNumValue('itemCha');
  record.properties.levelReq = getNumValue('itemLevelReq');
  record.properties.classReq = getNumValue('itemClassReq');
  record.properties.strReq = getNumValue('itemStrReq');
  record.properties.intReq = getNumValue('itemIntReq');
  record.properties.wisReq = getNumValue('itemWisReq');
  record.properties.agiReq = getNumValue('itemAgiReq');
  record.properties.conReq = getNumValue('itemConReq');
  record.properties.chaReq = getNumValue('itemChaReq');
  record.properties.special = getNumValue('itemSpecial');
  record.properties.size = getNumValue('itemSize');
  record.properties.gender = getNumValue('itemGender');
  record.properties.dollGraphic = getNumValue('itemDollGraphic');
  record.properties.element = getNumValue('itemElement');
  record.properties.elementPower = getNumValue('itemElementPower');
  
  AppState.isDirty = true;
  renderItemList(document.getElementById('searchInput').value);
  updateUI();
  
  // Update GFX preview if graphic changed
  loadGFXPreview(record.properties.graphic);
}

function filterItems(e) {
  renderItemList(e.target.value);
}

// GFX Preview
async function loadGFXPreview(graphicId) {
  const previewContent = document.getElementById('previewContent');
  const gfxInput = document.getElementById('gfxInput');
  
  gfxInput.value = graphicId;
  
  if (!AppState.gfxFolder || !graphicId) {
    clearGFXPreview();
    return;
  }
  
  if (AppState.previewMode === 'animated') {
    await loadAnimatedPreview(graphicId);
  } else {
    await loadStaticPreview(graphicId);
  }
}

async function loadStaticPreview(graphicId) {
  const previewContent = document.getElementById('previewContent');
  
  try {
    // Items are in GFX file 023 (gfx023.egf)
    const gfxFileNumber = 23;
    const cacheKey = `${gfxFileNumber}-${graphicId}`;
    
    if (AppState.gfxCache.has(cacheKey)) {
      displayGFX(AppState.gfxCache.get(cacheKey));
      return;
    }
    
    const result = await window.electronAPI.readGFX(AppState.gfxFolder, gfxFileNumber);
    
    if (!result.success) {
      previewContent.innerHTML = `<div class="empty-state"><p>Error loading GFX</p><p class="text-muted">${result.error}</p></div>`;
      return;
    }
    
    const gfxData = new Uint8Array(result.data);
    
    // Extract the specific bitmap by ID
    // Item graphics: inventory graphic = 2 * graphicId, resource ID = (2 * graphicId) + 100
    const resourceId = (2 * graphicId) + 100;
    const bitmapData = GFXLoader.extractBitmapByID(gfxData, resourceId);
    
    if (!bitmapData) {
      previewContent.innerHTML = '<div class="empty-state"><p>Graphic not found</p></div>';
      return;
    }
    
    const dataUrl = GFXLoader.createImageDataURL(bitmapData);
    AppState.gfxCache.set(cacheKey, dataUrl);
    displayGFX(dataUrl);
    
  } catch (error) {
    console.error('Error loading GFX:', error);
    previewContent.innerHTML = `<div class="empty-state"><p>Error loading graphic</p><p class="text-muted">${error.message}</p></div>`;
  }
}

async function loadAnimatedPreview(graphicId) {
  const previewContent = document.getElementById('previewContent');
  
  if (!AppState.selectedItemId || !AppState.eifData) {
    clearGFXPreview();
    return;
  }
  
  const record = AppState.eifData.records.find(r => r.id === AppState.selectedItemId);
  if (!record) {
    clearGFXPreview();
    return;
  }
  
  try {
    // Show loading state
    previewContent.innerHTML = '<div class="empty-state"><p>Loading animation...</p></div>';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    previewContent.innerHTML = '';
    previewContent.appendChild(canvas);
    
    // Initialize animator with canvas
    AppState.animator.initialize(canvas);
    
    console.log('Loading animated preview for item:', {
      id: AppState.selectedItemId,
      name: record.name,
      type: record.properties.type,
      graphicId: graphicId
    });
    
    // Load character sprites based on item type
    await AppState.animator.loadCharacterSprites(
      AppState.gfxFolder,
      record.properties.type,
      graphicId
    );
    
    // Start animation
    AppState.animator.start();
    
  } catch (error) {
    console.error('Error loading animated preview:', error);
    previewContent.innerHTML = `<div class="empty-state"><p>Error loading animation</p><p class="text-muted">${error.message}</p></div>`;
  }
}

function displayGFX(dataUrl) {
  const previewContent = document.getElementById('previewContent');
  previewContent.innerHTML = `<img src="${dataUrl}" alt="Item Graphic">`;
}

function clearGFXPreview() {
  const previewContent = document.getElementById('previewContent');
  previewContent.innerHTML = '<div class="empty-state"><p>No graphic to display</p></div>';
  document.getElementById('gfxInput').value = '';
  
  // Stop animator if running
  if (AppState.animator) {
    AppState.animator.clear();
  }
}

function onGFXInputChange(e) {
  const graphicId = parseInt(e.target.value, 10);
  if (!isNaN(graphicId) && AppState.selectedItemId) {
    const record = AppState.eifData.records.find(r => r.id === AppState.selectedItemId);
    if (record) {
      record.properties.graphic = graphicId;
      const graphicInput = document.getElementById('itemGraphic');
      if (graphicInput) {
        graphicInput.value = graphicId;
      }
      AppState.isDirty = true;
      updateUI();
    }
    loadGFXPreview(graphicId);
  }
}

// GFX Browser Modal
async function openGFXBrowser() {
  if (!AppState.gfxFolder) {
    alert('Please set GFX folder first');
    return;
  }
  
  const modal = document.getElementById('gfxBrowserModal');
  modal.classList.add('active');
  
  const grid = document.getElementById('gfxGrid');
  grid.innerHTML = '<div class="empty-state"><p>Loading graphics...</p></div>';
  
  try {
    // Load item graphics from gfx023.egf
    const gfxFileNumber = 23;
    const result = await window.electronAPI.readGFX(AppState.gfxFolder, gfxFileNumber);
    
    if (!result.success) {
      grid.innerHTML = `<div class="empty-state"><p>Error loading GFX</p><p class="text-muted">${result.error}</p></div>`;
      return;
    }
    
    const gfxData = new Uint8Array(result.data);
    const bitmaps = GFXLoader.extractAllBitmaps(gfxData);
    
    if (bitmaps.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>No graphics found in file</p></div>';
      return;
    }
    
    grid.innerHTML = '';
    
    bitmaps.forEach((bitmap) => {
      const dataUrl = GFXLoader.createImageDataURL(bitmap.data);
      
      const item = document.createElement('div');
      item.className = 'gfx-item';
      item.innerHTML = `
        <img src="${dataUrl}" alt="GFX ${bitmap.graphicId}">
        <div class="gfx-item-id">ID: ${bitmap.graphicId}</div>
      `;
      
      item.addEventListener('click', () => {
        selectGFX(bitmap.graphicId);
        closeGFXBrowser();
      });
      
      grid.appendChild(item);
    });
    
  } catch (error) {
    console.error('Error in GFX browser:', error);
    grid.innerHTML = `<div class="empty-state"><p>Error</p><p class="text-muted">${error.message}</p></div>`;
  }
}

function closeGFXBrowser() {
  document.getElementById('gfxBrowserModal').classList.remove('active');
}

function selectGFX(graphicId) {
  if (AppState.selectedItemId && AppState.eifData) {
    const record = AppState.eifData.records.find(r => r.id === AppState.selectedItemId);
    if (record) {
      record.properties.graphic = graphicId;
      const graphicInput = document.getElementById('itemGraphic');
      if (graphicInput) {
        graphicInput.value = graphicId;
      }
      AppState.isDirty = true;
      updateUI();
      loadGFXPreview(graphicId);
    }
  }
}

// UI Updates
function updateUI() {
  const hasFile = AppState.eifData !== null;
  const hasSelection = AppState.selectedItemId !== null;
  const hasGFX = AppState.gfxFolder !== null;
  
  document.getElementById('saveFileBtn').disabled = !hasFile || !AppState.isDirty;
  document.getElementById('addItemBtn').disabled = !hasFile;
  document.getElementById('deleteItemBtn').disabled = !hasSelection;
  document.getElementById('duplicateItemBtn').disabled = !hasSelection;
  document.getElementById('gfxInput').disabled = !hasGFX;
  document.getElementById('browseGFXBtn').disabled = !hasGFX || !hasSelection;
  
  // Update file info
  const fileInfo = document.getElementById('fileInfo');
  if (hasFile) {
    const dirtyMark = AppState.isDirty ? ' *' : '';
    fileInfo.textContent = `${AppState.currentFile}${dirtyMark} - ${AppState.eifData.records.length} items`;
  } else {
    fileInfo.textContent = '';
  }
}

function setStatus(message) {
  document.getElementById('statusText').textContent = message;
}

// Preview Mode
function setPreviewMode(mode) {
  AppState.previewMode = mode;
  
  // Update UI
  document.getElementById('staticPreviewBtn').classList.toggle('active', mode === 'static');
  document.getElementById('animatedPreviewBtn').classList.toggle('active', mode === 'animated');
  
  // Reload preview if item is selected
  if (AppState.selectedItemId && AppState.eifData) {
    const record = AppState.eifData.records.find(r => r.id === AppState.selectedItemId);
    if (record && record.properties.graphic) {
      loadGFXPreview(record.properties.graphic);
    }
  }
}
