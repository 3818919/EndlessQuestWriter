/**
 * Service for loading quest templates from external .eqf files
 */

import { EQFParser, QuestData } from '../../eqf-parser';

export interface TemplateData extends Omit<QuestData, 'id'> {  
}

let templatesCache: Record<string, TemplateData> | null = null;
let templatesLoadPromise: Promise<Record<string, TemplateData>> | null = null;

/**
 * Load all templates from the config/templates directory
 */
export async function loadTemplates(): Promise<Record<string, TemplateData>> {  
  if (templatesCache) {
    return templatesCache;
  }
    
  if (templatesLoadPromise) {
    return templatesLoadPromise;
  }
  
  templatesLoadPromise = (async () => {
    const templates: Record<string, TemplateData> = {};
    
    if (!window.electronAPI) {
      console.warn('Electron API not available, using empty templates');
      return templates;
    }
    
    try {
      const configDir = await window.electronAPI.getConfigDir();
      const templatesDir = `${configDir}/templates`;
            
      const dirExists = await window.electronAPI.fileExists(templatesDir);
      if (!dirExists) {
        console.log('Templates directory does not exist, creating it');
        await window.electronAPI.ensureDir(templatesDir);
        return templates;
      }
            
      const listResult = await window.electronAPI.listFiles(templatesDir, '.eqf');
      if (!listResult.success || listResult.files.length === 0) {
        console.log('No template files found');
        return templates;
      }
            
      const filePaths = listResult.files.map(filename => `${templatesDir}/${filename}`);
      const batchResults = await window.electronAPI.readTextBatch(filePaths);
            
      for (let i = 0; i < listResult.files.length; i++) {
        const filename = listResult.files[i];
        const filePath = filePaths[i];
        const result = batchResults[filePath];
        
        if (result?.success && result.data) {
          try {            
            const quest = EQFParser.parse(result.data, 0);
                        
            const templateName = quest.questName || filename.replace(/\.eqf$/i, '');
                        
            const { id, ...templateData } = quest;
            templates[templateName] = templateData;
            
            console.log(`Loaded template: ${templateName}`);
          } catch (parseError) {
            console.warn(`Failed to parse template ${filename}:`, parseError);
          }
        }
      }
      
      console.log(`Loaded ${Object.keys(templates).length} templates`);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
    
    templatesCache = templates;
    return templates;
  })();
  
  return templatesLoadPromise;
}

/**
 * Get list of available template names
 */
export async function getTemplateNames(): Promise<string[]> {
  const templates = await loadTemplates();
  return Object.keys(templates);
}

/**
 * Clear the templates cache (useful for reloading)
 */
export function clearTemplatesCache(): void {
  templatesCache = null;
  templatesLoadPromise = null;
}
