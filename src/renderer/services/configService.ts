/**
 * Service for loading and parsing configuration files (actions.json, rules.json)
 * 
 * Config files are now stored per-project in the project settings directory.
 * Format has changed from INI to JSON for better structure and easier parsing.
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

export interface ActionJsonEntry {
  description: string;
  params: ParamInfo[];
}

export interface RuleJsonEntry {
  description: string;
  params: ParamInfo[];
}

export type ActionsJson = Record<string, ActionJsonEntry>;
export type RulesJson = Record<string, RuleJsonEntry>;

/**
 * Generate a signature string from action/rule name and params
 */
function generateSignature(name: string, params: ParamInfo[], isAction: boolean): string {
  const paramStrings = params.map(param => {
    if (param.type === 'string') {
      return `"${param.name}"`;
    }
    return param.name;
  });
  const signature = `${name}(${paramStrings.join(', ')})`;
  return isAction ? `${signature};` : signature;
}


/**
 * Convert internal ConfigData format to JSON format for saving
 */
let configCache: Map<string, ConfigData> = new Map();
let configLoadPromises: Map<string, Promise<ConfigData>> = new Map();

/**
 * Load actions and rules configuration for a specific project
 * @param projectPath - The project settings directory path (e.g., ~/.endless-quest-writer/MyProject)
 */
export async function loadConfig(projectPath?: string): Promise<ConfigData> {
  if (!projectPath) {
    return loadGlobalConfig();
  }
  
  const cacheKey = projectPath;
  
  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey)!;
  }
    
  if (configLoadPromises.has(cacheKey)) {
    return configLoadPromises.get(cacheKey)!;
  }
  
  const loadPromise = (async () => {
    const config: ConfigData = {
      actions: {},
      rules: {}
    };
    
    if (!window.electronAPI) {
      console.warn('Electron API not available, using empty config');
      return config;
    }
    
    try {
      const actionsPath = `${projectPath}/actions.json`;
      const actionsResult = await window.electronAPI.readTextFile(actionsPath);
      
      if (actionsResult.success && actionsResult.data) {
        try {
          const actionsJson: ActionsJson = JSON.parse(actionsResult.data);
          for (const [name, entry] of Object.entries(actionsJson)) {
            const signature = generateSignature(name, entry.params, true);
            config.actions[name] = {
              signature,
              description: entry.description,
              params: entry.params,
              rawSignature: `\`${signature}\``
            };
          }
          console.log(`Loaded ${Object.keys(config.actions).length} actions from project config (JSON)`);
        } catch (parseError) {
          console.warn('Failed to parse actions.json:', parseError);
        }
      } else {
        console.log('No actions.json found in project, will use defaults');
      }

      const rulesPath = `${projectPath}/rules.json`;
      const rulesResult = await window.electronAPI.readTextFile(rulesPath);
      
      if (rulesResult.success && rulesResult.data) {
        try {
          const rulesJson: RulesJson = JSON.parse(rulesResult.data);
          for (const [name, entry] of Object.entries(rulesJson)) {
            const signature = generateSignature(name, entry.params, false);
            config.rules[name] = {
              signature,
              description: entry.description,
              params: entry.params,
              rawSignature: `\`${signature}\``
            };
          }
          console.log(`Loaded ${Object.keys(config.rules).length} rules from project config (JSON)`);
        } catch (parseError) {
          console.warn('Failed to parse rules.json:', parseError);
        }
      } else {
        console.log('No rules.json found in project, will use defaults');
      }
      
      if (Object.keys(config.actions).length === 0 || Object.keys(config.rules).length === 0) {
        const globalConfig = await loadGlobalConfig();
        if (Object.keys(config.actions).length === 0) {
          config.actions = globalConfig.actions;
        }
        if (Object.keys(config.rules).length === 0) {
          config.rules = globalConfig.rules;
        }
      }
    } catch (error) {
      console.error('Error loading project config files:', error);
    }
    
    configCache.set(cacheKey, config);
    return config;
  })();
  
  configLoadPromises.set(cacheKey, loadPromise);
  return loadPromise;
}

/**
 * Load default configuration from bundled app files
 */
async function loadGlobalConfig(): Promise<ConfigData> {
  const config: ConfigData = {
    actions: {},
    rules: {}
  };
  
  if (!window.electronAPI) {
    console.warn('Electron API not available, using empty config');
    return config;
  }
  
  try {
    const bundledConfigDir = await window.electronAPI.getBundledConfigDir();
    const actionsJsonPath = `${bundledConfigDir}/actions.json`;
    const actionsJsonResult = await window.electronAPI.readTextFile(actionsJsonPath);
    
    if (actionsJsonResult.success && actionsJsonResult.data) {
      try {
        const actionsJson: ActionsJson = JSON.parse(actionsJsonResult.data);
        for (const [name, entry] of Object.entries(actionsJson)) {
          const signature = generateSignature(name, entry.params, true);
          config.actions[name] = {
            signature,
            description: entry.description,
            params: entry.params,
            rawSignature: `\`${signature}\``
          };
        }
        console.log(`Loaded ${Object.keys(config.actions).length} actions from bundled config`);
      } catch (parseError) {
        console.warn('Failed to parse bundled actions.json:', parseError);
      }
    }

    const rulesJsonPath = `${bundledConfigDir}/rules.json`;
    const rulesJsonResult = await window.electronAPI.readTextFile(rulesJsonPath);
    
    if (rulesJsonResult.success && rulesJsonResult.data) {
      try {
        const rulesJson: RulesJson = JSON.parse(rulesJsonResult.data);
        for (const [name, entry] of Object.entries(rulesJson)) {
          const signature = generateSignature(name, entry.params, false);
          config.rules[name] = {
            signature,
            description: entry.description,
            params: entry.params,
            rawSignature: `\`${signature}\``
          };
        }
        console.log(`Loaded ${Object.keys(config.rules).length} rules from bundled config`);
      } catch (parseError) {
        console.warn('Failed to parse bundled rules.json:', parseError);
      }
    }
  } catch (error) {
    console.error('Error loading bundled config files:', error);
  }
  
  return config;
}

/**
 * Save actions configuration to a project
 */
export async function saveActionsConfig(projectPath: string, actions: Record<string, ActionOrRuleDoc>): Promise<void> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  
  const actionsJson: ActionsJson = {};
  for (const [name, doc] of Object.entries(actions)) {
    actionsJson[name] = {
      description: doc.description,
      params: doc.params
    };
  }
  
  const actionsPath = `${projectPath}/actions.json`;
  const result = await window.electronAPI.writeTextFile(actionsPath, JSON.stringify(actionsJson, null, 2));
  
  if (!result.success) {
    throw new Error(`Failed to save actions: ${result.error}`);
  }

  configCache.delete(projectPath);
  configLoadPromises.delete(projectPath);
}

/**
 * Save rules configuration to a project
 */
export async function saveRulesConfig(projectPath: string, rules: Record<string, ActionOrRuleDoc>): Promise<void> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  
  const rulesJson: RulesJson = {};
  for (const [name, doc] of Object.entries(rules)) {
    rulesJson[name] = {
      description: doc.description,
      params: doc.params
    };
  }
  
  const rulesPath = `${projectPath}/rules.json`;
  const result = await window.electronAPI.writeTextFile(rulesPath, JSON.stringify(rulesJson, null, 2));
  
  if (!result.success) {
    throw new Error(`Failed to save rules: ${result.error}`);
  }

  configCache.delete(projectPath);
  configLoadPromises.delete(projectPath);
}

/**
 * Get documentation for a specific action or rule
 */
export function getDocumentation(config: ConfigData, word: string): ActionOrRuleDoc | null {
  return config.actions[word] || config.rules[word] || null;
}

export function clearConfigCache(projectPath?: string): void {
  if (projectPath) {
    configCache.delete(projectPath);
    configLoadPromises.delete(projectPath);
  } else {
    configCache.clear();
    configLoadPromises.clear();
  }
}
