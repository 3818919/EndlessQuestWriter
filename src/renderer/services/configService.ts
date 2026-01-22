/**
 * Service for loading and parsing external configuration files (actions.ini, rules.ini)
 */

export interface ParamInfo {
  name: string;
  type: 'string' | 'integer';
}

export interface ActionOrRuleDoc {
  signature: string;
  description: string;
  params: ParamInfo[];
  rawSignature: string; 
}

export interface ConfigData {
  actions: Record<string, ActionOrRuleDoc>;
  rules: Record<string, ActionOrRuleDoc>;
}

/**
 * Parse parameters from a signature string like `ActionName(param1, "param2");`
 * Parameters in double quotes are strings, others are integers
 */
function parseParamsFromSignature(signature: string): ParamInfo[] {  
  const match = signature.match(/\(([^)]*)\)/);
  if (!match || !match[1].trim()) return [];
  
  const paramsStr = match[1];
  const params: ParamInfo[] = [];
    
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < paramsStr.length; i++) {
    const char = paramsStr[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ',' && !inQuotes) {
      const param = current.trim();
      if (param) {
        params.push(parseParamType(param));
      }
      current = '';
    } else {
      current += char;
    }
  }
    
  const lastParam = current.trim();
  if (lastParam) {
    params.push(parseParamType(lastParam));
  }
  
  return params;
}

/**
 * Determine if a parameter is a string or integer based on whether it's in quotes
 */
function parseParamType(param: string): ParamInfo {  
  const cleanParam = param.replace(/`/g, '');
    
  if (cleanParam.startsWith('"') && cleanParam.endsWith('"')) {    
    const name = cleanParam.slice(1, -1);
    return { name, type: 'string' };
  }
    
  return { name: cleanParam, type: 'integer' };
}

/**
 * Parse an INI file content into a record of action/rule definitions
 */
function parseIniContent(content: string): Record<string, ActionOrRuleDoc> {
  const result: Record<string, ActionOrRuleDoc> = {};
  const lines = content.split('\n');
  
  let currentSection: string | null = null;
  let currentData: { signature?: string; description?: string } = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
        
    if (!trimmed || trimmed.startsWith(';')) {
      continue;
    }
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {      
      if (currentSection && currentData.signature && currentData.description) {
        const params = parseParamsFromSignature(currentData.signature);
        result[currentSection] = {
          signature: currentData.signature,
          description: currentData.description,
          params,
          rawSignature: currentData.signature
        };
      }
            
      currentSection = sectionMatch[1];
      currentData = {};
      continue;
    }
        
    const keyValueMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
    if (keyValueMatch && currentSection) {
      const [, key, value] = keyValueMatch;
      if (key === 'signature') {
        currentData.signature = value;
      } else if (key === 'description') {
        currentData.description = value;
      }
    }
  }
    
  if (currentSection && currentData.signature && currentData.description) {
    const params = parseParamsFromSignature(currentData.signature);
    result[currentSection] = {
      signature: currentData.signature,
      description: currentData.description,
      params,
      rawSignature: currentData.signature
    };
  }
  
  return result;
}

let configCache: ConfigData | null = null;
let configLoadPromise: Promise<ConfigData> | null = null;

/**
 * Load actions and rules configuration from external INI files
 */
export async function loadConfig(): Promise<ConfigData> {  
  if (configCache) {
    return configCache;
  }
    
  if (configLoadPromise) {
    return configLoadPromise;
  }
  
  configLoadPromise = (async () => {
    const config: ConfigData = {
      actions: {},
      rules: {}
    };
    
    if (!window.electronAPI) {
      console.warn('Electron API not available, using empty config');
      return config;
    }
    
    try {
      const configDir = await window.electronAPI.getConfigDir();
            
      const actionsPath = `${configDir}/actions.ini`;
      const actionsResult = await window.electronAPI.readTextFile(actionsPath);
      if (actionsResult.success && actionsResult.data) {
        config.actions = parseIniContent(actionsResult.data);
        console.log(`Loaded ${Object.keys(config.actions).length} actions from config`);
      } else {
        console.warn('Could not load actions.ini:', actionsResult.error);
      }
            
      const rulesPath = `${configDir}/rules.ini`;
      const rulesResult = await window.electronAPI.readTextFile(rulesPath);
      if (rulesResult.success && rulesResult.data) {
        config.rules = parseIniContent(rulesResult.data);
        console.log(`Loaded ${Object.keys(config.rules).length} rules from config`);
      } else {
        console.warn('Could not load rules.ini:', rulesResult.error);
      }
    } catch (error) {
      console.error('Error loading config files:', error);
    }
    
    configCache = config;
    return config;
  })();
  
  return configLoadPromise;
}

/**
 * Get documentation for a specific action or rule
 */
export function getDocumentation(config: ConfigData, word: string): ActionOrRuleDoc | null {
  return config.actions[word] || config.rules[word] || null;
}

/**
 * Get all action names
 */
export function getActionNames(config: ConfigData): string[] {
  return Object.keys(config.actions);
}

/**
 * Get all rule names
 */
export function getRuleNames(config: ConfigData): string[] {
  return Object.keys(config.rules);
}

/**
 * Clear the config cache (useful for reloading)
 */
export function clearConfigCache(): void {
  configCache = null;
  configLoadPromise = null;
}
