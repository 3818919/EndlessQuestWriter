/**
 * Service for loading and parsing external configuration files (actions.ini, rules.ini)
 */

export interface ActionOrRuleDoc {
  signature: string;
  description: string;
}

export interface ConfigData {
  actions: Record<string, ActionOrRuleDoc>;
  rules: Record<string, ActionOrRuleDoc>;
}

/**
 * Parse an INI file content into a record of action/rule definitions
 */
function parseIniContent(content: string): Record<string, ActionOrRuleDoc> {
  const result: Record<string, ActionOrRuleDoc> = {};
  const lines = content.split('\n');
  
  let currentSection: string | null = null;
  let currentData: Partial<ActionOrRuleDoc> = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith(';')) {
      continue;
    }
    
    // Check for section header [SectionName]
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      // Save previous section if exists
      if (currentSection && currentData.signature && currentData.description) {
        result[currentSection] = {
          signature: currentData.signature,
          description: currentData.description
        };
      }
      
      // Start new section
      currentSection = sectionMatch[1];
      currentData = {};
      continue;
    }
    
    // Parse key = value
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
  
  // Don't forget the last section
  if (currentSection && currentData.signature && currentData.description) {
    result[currentSection] = {
      signature: currentData.signature,
      description: currentData.description
    };
  }
  
  return result;
}

// Cache for loaded config
let configCache: ConfigData | null = null;
let configLoadPromise: Promise<ConfigData> | null = null;

/**
 * Load actions and rules configuration from external INI files
 */
export async function loadConfig(): Promise<ConfigData> {
  // Return cached config if available
  if (configCache) {
    return configCache;
  }
  
  // If already loading, wait for that promise
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
      
      // Load actions.ini
      const actionsPath = `${configDir}/actions.ini`;
      const actionsResult = await window.electronAPI.readTextFile(actionsPath);
      if (actionsResult.success && actionsResult.data) {
        config.actions = parseIniContent(actionsResult.data);
        console.log(`Loaded ${Object.keys(config.actions).length} actions from config`);
      } else {
        console.warn('Could not load actions.ini:', actionsResult.error);
      }
      
      // Load rules.ini
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
