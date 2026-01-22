


export interface QuestAction {
  type: string;
  params: (string | number)[];
  rawText: string;
}

export interface QuestRule {
  type: string;
  params: (string | number)[];
  gotoState: string;
  rawText: string;
}

export interface QuestState {
  name: string;
  description: string;
  actions: QuestAction[];
  rules: QuestRule[];
}

export interface QuestRandomBlock {
  name: string;
  entries: {
    type: 'coord' | 'item';
    params: (string | number)[];
  }[];
}

export interface QuestData {
  id: number;
  questName: string;
  version: number;
  hidden?: boolean;
  hiddenEnd?: boolean;
  disabled?: boolean;
  minLevel?: number;
  maxLevel?: number;
  needAdmin?: number;
  needClass?: number;
  needQuest?: number;
  startNpc?: number[];
  states: QuestState[];
  randomBlocks: QuestRandomBlock[];
}

export type ParamType = 
  | 'string' 
  | 'number' 
  | 'npcId' 
  | 'itemId' 
  | 'mapId' 
  | 'spellId' 
  | 'classId' 
  | 'coordinate'
  | 'randomName'
  | 'stat'
  | 'raceId'
  | 'home'
  | 'title'
  | 'name'
  | 'effectId'
  | 'soundId'
  | 'musicId'
  | 'questId'
  | 'inputId'
  | 'time'
  | 'boolean';

export interface ActionMetadata {
  name: string;
  description: string;
  category: 'Dialog' | 'Items' | 'Rewards' | 'Effects' | 'State Control' | 'Player Modification' | 'Map' | 'Display';
  params: {
    name: string;
    type: ParamType;
    optional?: boolean;
  }[];
}

export interface RuleMetadata {
  name: string;
  description: string;
  category: 'Interaction' | 'Items' | 'Combat' | 'Location' | 'Skills' | 'Stats' | 'Character' | 'Equipment' | 'Quest Progress' | 'Misc';
  params: {
    name: string;
    type: ParamType;
    optional?: boolean;
  }[];
}


export const ACTION_METADATA: Record<string, ActionMetadata> = {
  AddNpcText: {
    name: 'AddNpcText',
    description: 'Add a simple message to the dialog window',
    category: 'Dialog',
    params: [
      { name: 'NPC Quest ID', type: 'npcId' },
      { name: 'Message', type: 'string' }
    ]
  },
  AddNpcInput: {
    name: 'AddNpcInput',
    description: 'Add a link option in the dialog window',
    category: 'Dialog',
    params: [
      { name: 'NPC Quest ID', type: 'npcId' },
      { name: 'Input ID', type: 'inputId' },
      { name: 'Message', type: 'string' }
    ]
  },
  AddNpcPM: {
    name: 'AddNpcPM',
    description: 'Add a message to the dialog window with custom name',
    category: 'Dialog',
    params: [
      { name: 'Name', type: 'name' },
      { name: 'Message', type: 'string' }
    ]
  },
  AddNpcChat: {
    name: 'AddNpcChat',
    description: 'Add an NPC chat balloon (random chance)',
    category: 'Dialog',
    params: [
      { name: 'NPC Quest ID', type: 'npcId' },
      { name: 'Message', type: 'string' }
    ]
  },
  
  
  GiveItem: {
    name: 'GiveItem',
    description: 'Reward a player with an item',
    category: 'Items',
    params: [
      { name: 'Item ID', type: 'itemId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  RemoveItem: {
    name: 'RemoveItem',
    description: 'Remove an item from player inventory',
    category: 'Items',
    params: [
      { name: 'Item ID', type: 'itemId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  GiveBankItem: {
    name: 'GiveBankItem',
    description: 'Reward item stored directly to player bank',
    category: 'Items',
    params: [
      { name: 'Item ID', type: 'itemId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  RemoveBankItem: {
    name: 'RemoveBankItem',
    description: 'Remove an item from player bank locker',
    category: 'Items',
    params: [
      { name: 'Item ID', type: 'itemId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  GiveRandomItem: {
    name: 'GiveRandomItem',
    description: 'Reward item chosen at random from a random bracket',
    category: 'Items',
    params: [
      { name: 'Random Bracket Name', type: 'randomName' }
    ]
  },
  AddMapItem: {
    name: 'AddMapItem',
    description: 'Add an item to a map location (visible to all)',
    category: 'Items',
    params: [
      { name: 'Map ID', type: 'mapId' },
      { name: 'X', type: 'coordinate' },
      { name: 'Y', type: 'coordinate' },
      { name: 'Item ID', type: 'itemId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  AddChestItem: {
    name: 'AddChestItem',
    description: 'Add an item to a map chest (visible to all)',
    category: 'Items',
    params: [
      { name: 'Map ID', type: 'mapId' },
      { name: 'X', type: 'coordinate' },
      { name: 'Y', type: 'coordinate' },
      { name: 'Item ID', type: 'itemId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  RemoveChestItem: {
    name: 'RemoveChestItem',
    description: 'Remove certain item from all chests on a map',
    category: 'Items',
    params: [
      { name: 'Map ID', type: 'mapId' },
      { name: 'Item ID', type: 'itemId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  RemoveMapItems: {
    name: 'RemoveMapItems',
    description: 'Remove all items from ground on a map',
    category: 'Map',
    params: [
      { name: 'Map ID', type: 'mapId' }
    ]
  },
  EmptyChests: {
    name: 'EmptyChests',
    description: 'Remove all items in all chests on a map',
    category: 'Map',
    params: [
      { name: 'Map ID', type: 'mapId' }
    ]
  },

  
  GiveExp: {
    name: 'GiveExp',
    description: 'Reward player with experience points',
    category: 'Rewards',
    params: [
      { name: 'Amount', type: 'number' }
    ]
  },
  GiveKarma: {
    name: 'GiveKarma',
    description: 'Reward karma to a player',
    category: 'Rewards',
    params: [
      { name: 'Amount', type: 'number' }
    ]
  },
  RemoveKarma: {
    name: 'RemoveKarma',
    description: 'Remove karma from a player',
    category: 'Rewards',
    params: [
      { name: 'Amount', type: 'number' }
    ]
  },
  GiveStat: {
    name: 'GiveStat',
    description: 'Add an amount to a player stat',
    category: 'Rewards',
    params: [
      { name: 'Stat', type: 'stat' },
      { name: 'Amount', type: 'number' }
    ]
  },
  RemoveStat: {
    name: 'RemoveStat',
    description: 'Remove an amount from a player stat',
    category: 'Rewards',
    params: [
      { name: 'Stat', type: 'stat' },
      { name: 'Amount', type: 'number' }
    ]
  },
  SetStat: {
    name: 'SetStat',
    description: 'Set a player stat to a specific value',
    category: 'Rewards',
    params: [
      { name: 'Stat', type: 'stat' },
      { name: 'Value', type: 'number' }
    ]
  },

  
  PlayEffect: {
    name: 'PlayEffect',
    description: 'Play a special effect on a player',
    category: 'Effects',
    params: [
      { name: 'Effect ID', type: 'effectId' }
    ]
  },
  PlaySound: {
    name: 'PlaySound',
    description: 'Play a sound effect',
    category: 'Effects',
    params: [
      { name: 'Sound ID', type: 'soundId' }
    ]
  },
  PlayMusic: {
    name: 'PlayMusic',
    description: 'Play a midi music file',
    category: 'Effects',
    params: [
      { name: 'Music ID', type: 'musicId' }
    ]
  },
  Quake: {
    name: 'Quake',
    description: 'Create an earthquake on a map',
    category: 'Effects',
    params: [
      { name: 'Magnitude', type: 'number' },
      { name: 'Map ID', type: 'mapId', optional: true }
    ]
  },
  QuakeWorld: {
    name: 'QuakeWorld',
    description: 'Create an earthquake on all maps',
    category: 'Effects',
    params: [
      { name: 'Magnitude', type: 'number' }
    ]
  },
  Reset: {
    name: 'Reset',
    description: 'Reset the current quest',
    category: 'State Control',
    params: []
  },
  End: {
    name: 'End',
    description: 'End quest permanently (shows in History)',
    category: 'State Control',
    params: []
  },
  SetState: {
    name: 'SetState',
    description: 'Force a state change',
    category: 'State Control',
    params: [
      { name: 'State Name', type: 'string' }
    ]
  },
  ResetDaily: {
    name: 'ResetDaily',
    description: 'Reset quest and increment daily completion counter',
    category: 'State Control',
    params: []
  },
  ResetQuest: {
    name: 'ResetQuest',
    description: 'Reset a different quest',
    category: 'State Control',
    params: [
      { name: 'Quest ID', type: 'questId' }
    ]
  },
  StartQuest: {
    name: 'StartQuest',
    description: 'Start a quest if not active',
    category: 'State Control',
    params: [
      { name: 'Quest ID', type: 'questId' }
    ]
  },
  Roll: {
    name: 'Roll',
    description: 'Generate a random number',
    category: 'State Control',
    params: [
      { name: 'Number', type: 'number' },
      { name: 'High Number', type: 'number', optional: true }
    ]
  },
  SetClass: {
    name: 'SetClass',
    description: 'Change player class',
    category: 'Player Modification',
    params: [
      { name: 'Class ID', type: 'classId' }
    ]
  },
  SetRace: {
    name: 'SetRace',
    description: 'Change player race',
    category: 'Player Modification',
    params: [
      { name: 'Race ID', type: 'raceId' }
    ]
  },
  SetCoord: {
    name: 'SetCoord',
    description: 'Move player to a coordinate',
    category: 'Player Modification',
    params: [
      { name: 'Map ID', type: 'mapId' },
      { name: 'X', type: 'coordinate' },
      { name: 'Y', type: 'coordinate' }
    ]
  },
  SetMap: {
    name: 'SetMap',
    description: 'Move player to a map coordinate',
    category: 'Player Modification',
    params: [
      { name: 'Map ID', type: 'mapId' },
      { name: 'X', type: 'coordinate' },
      { name: 'Y', type: 'coordinate' }
    ]
  },
  SetHome: {
    name: 'SetHome',
    description: 'Set player home town',
    category: 'Player Modification',
    params: [
      { name: 'Home', type: 'home' }
    ]
  },
  SetTitle: {
    name: 'SetTitle',
    description: 'Set player title',
    category: 'Player Modification',
    params: [
      { name: 'Title', type: 'title' }
    ]
  },
  SetFiance: {
    name: 'SetFiance',
    description: 'Set player fiance',
    category: 'Player Modification',
    params: [
      { name: 'Name', type: 'name' }
    ]
  },
  SetPartner: {
    name: 'SetPartner',
    description: 'Set player partner',
    category: 'Player Modification',
    params: [
      { name: 'Name', type: 'name' }
    ]
  },
  ShowHint: {
    name: 'ShowHint',
    description: 'Show hint in information bar',
    category: 'Display',
    params: [
      { name: 'Message', type: 'string' }
    ]
  },
  LoadMap: {
    name: 'LoadMap',
    description: 'Load a map or alternate version',
    category: 'Map',
    params: [
      { name: 'Map ID', type: 'mapId' },
      { name: 'Alias', type: 'string', optional: true }
    ]
  }
};


export const RULE_METADATA: Record<string, RuleMetadata> = {
  TalkedToNpc: {
    name: 'TalkedToNpc',
    description: 'Dialog window with NPC was opened',
    category: 'Interaction',
    params: [
      { name: 'NPC Quest ID', type: 'npcId' }
    ]
  },
  InputNpc: {
    name: 'InputNpc',
    description: 'Link value clicked in dialog',
    category: 'Interaction',
    params: [
      { name: 'Input ID', type: 'inputId' }
    ]
  },
  Always: {
    name: 'Always',
    description: 'Satisfied with no requirements',
    category: 'Interaction',
    params: []
  },
  GotItems: {
    name: 'GotItems',
    description: 'Player has required amount of items',
    category: 'Items',
    params: [
      { name: 'Item ID', type: 'itemId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  LostItems: {
    name: 'LostItems',
    description: 'Player lost required items (backtrack)',
    category: 'Items',
    params: [
      { name: 'Item ID', type: 'itemId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  UsedItem: {
    name: 'UsedItem',
    description: 'Item was used required times',
    category: 'Items',
    params: [
      { name: 'Item ID', type: 'itemId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  KilledNpcs: {
    name: 'KilledNpcs',
    description: 'Killed required amount of NPCs',
    category: 'Combat',
    params: [
      { name: 'NPC ID', type: 'npcId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  KilledPlayers: {
    name: 'KilledPlayers',
    description: 'Killed players in PK zones',
    category: 'Combat',
    params: [
      { name: 'Amount', type: 'number' }
    ]
  },
  EnterCoord: {
    name: 'EnterCoord',
    description: 'Player stood at coordinate',
    category: 'Location',
    params: [
      { name: 'Map ID', type: 'mapId' },
      { name: 'X', type: 'coordinate' },
      { name: 'Y', type: 'coordinate' }
    ]
  },
  LeaveCoord: {
    name: 'LeaveCoord',
    description: 'Player left coordinate',
    category: 'Location',
    params: [
      { name: 'Map ID', type: 'mapId' },
      { name: 'X', type: 'coordinate' },
      { name: 'Y', type: 'coordinate' }
    ]
  },
  EnterMap: {
    name: 'EnterMap',
    description: 'Player entered map',
    category: 'Location',
    params: [
      { name: 'Map ID', type: 'mapId' }
    ]
  },
  LeaveMap: {
    name: 'LeaveMap',
    description: 'Player left map',
    category: 'Location',
    params: [
      { name: 'Map ID', type: 'mapId' }
    ]
  },
  CitizenOf: {
    name: 'CitizenOf',
    description: 'Player is citizen of home town',
    category: 'Location',
    params: [
      { name: 'Home Name', type: 'home' }
    ]
  },
  GotSpell: {
    name: 'GotSpell',
    description: 'Player learned spell',
    category: 'Skills',
    params: [
      { name: 'Spell ID', type: 'spellId' }
    ]
  },
  LostSpell: {
    name: 'LostSpell',
    description: 'Player forgot spell (backtrack)',
    category: 'Skills',
    params: [
      { name: 'Spell ID', type: 'spellId' }
    ]
  },
  UsedSpell: {
    name: 'UsedSpell',
    description: 'Spell was used required times',
    category: 'Skills',
    params: [
      { name: 'Spell ID', type: 'spellId' },
      { name: 'Amount', type: 'number' }
    ]
  },
  StatIs: {
    name: 'StatIs',
    description: 'Stat equals value',
    category: 'Stats',
    params: [
      { name: 'Stat', type: 'stat' },
      { name: 'Value', type: 'number' }
    ]
  },
  StatNot: {
    name: 'StatNot',
    description: 'Stat not equal to value',
    category: 'Stats',
    params: [
      { name: 'Stat', type: 'stat' },
      { name: 'Value', type: 'number' }
    ]
  },
  StatGreater: {
    name: 'StatGreater',
    description: 'Stat greater than value',
    category: 'Stats',
    params: [
      { name: 'Stat', type: 'stat' },
      { name: 'Value', type: 'number' }
    ]
  },
  StatLess: {
    name: 'StatLess',
    description: 'Stat less than value',
    category: 'Stats',
    params: [
      { name: 'Stat', type: 'stat' },
      { name: 'Value', type: 'number' }
    ]
  },
  StatBetween: {
    name: 'StatBetween',
    description: 'Stat within range',
    category: 'Stats',
    params: [
      { name: 'Stat', type: 'stat' },
      { name: 'Low Value', type: 'number' },
      { name: 'High Value', type: 'number' }
    ]
  },
  IsClass: {
    name: 'IsClass',
    description: 'Player has class ID',
    category: 'Character',
    params: [
      { name: 'Class ID', type: 'classId' }
    ]
  },
  IsGender: {
    name: 'IsGender',
    description: 'Player has gender ID',
    category: 'Character',
    params: [
      { name: 'Gender ID', type: 'number' }
    ]
  },
  IsRace: {
    name: 'IsRace',
    description: 'Player has race ID',
    category: 'Character',
    params: [
      { name: 'Race ID', type: 'raceId' }
    ]
  },
  IsNamed: {
    name: 'IsNamed',
    description: 'Player name matches',
    category: 'Character',
    params: [
      { name: 'Name', type: 'name' }
    ]
  },
  IsWearing: {
    name: 'IsWearing',
    description: 'Player has item equipped',
    category: 'Equipment',
    params: [
      { name: 'Item ID', type: 'itemId' }
    ]
  },
  CheckDaily: {
    name: 'CheckDaily',
    description: 'Calendar day has passed since state entered',
    category: 'Quest Progress',
    params: []
  },
  DoneDaily: {
    name: 'DoneDaily',
    description: 'ResetDaily called X times today',
    category: 'Quest Progress',
    params: [
      { name: 'Amount', type: 'number' }
    ]
  }
};


export const STAT_KEYWORDS = [
  'accuracy', 'agi', 'armor', 'cha', 'con', 'base_agi', 'base_cha', 'base_con',
  'base_int', 'base_str', 'base_wis', 'evade', 'exp', 'goldbank', 'hp', 'int',
  'level', 'mapid', 'maxhp', 'maxtp', 'maxsp', 'maxdam', 'maxweight', 'mindam',
  'skillpoints', 'statpoints', 'str', 'tp', 'weight', 'wis', 'x', 'y'
];

export class EQFParser {
  static parse(text: string, questId: number): QuestData {
    const lines = text.split('\n');
    const quest: QuestData = {
      id: questId,
      questName: '',
      version: 1,
      states: [],
      randomBlocks: [],
      startNpc: []
    };

    let currentSection: 'main' | 'state' | 'random' | null = null;
    let currentState: QuestState | null = null;
    let currentRandomBlock: QuestRandomBlock | null = null;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      
      if (!line || line.startsWith('//')) continue;

      
      if (line.toLowerCase().startsWith('main')) {
        currentSection = 'main';
        continue;
      }

      if (line.toLowerCase().startsWith('state ')) {
        const stateName = line.substring(6).trim();
        currentState = {
          name: stateName,
          description: '',
          actions: [],
          rules: []
        };
        currentSection = 'state';
        continue;
      }

      if (line.toLowerCase().startsWith('random ')) {
        const randomName = line.substring(7).trim();
        currentRandomBlock = {
          name: randomName,
          entries: []
        };
        currentSection = 'random';
        continue;
      }

      
      if (line.includes('{')) braceDepth++;
      if (line.includes('}')) {
        braceDepth--;
        if (braceDepth === 0) {
          if (currentState) {
            quest.states.push(currentState);
            currentState = null;
          }
          if (currentRandomBlock) {
            quest.randomBlocks.push(currentRandomBlock);
            currentRandomBlock = null;
          }
          currentSection = null;
        }
        continue;
      }

      
      if (currentSection === 'main') {
        if (line.toLowerCase().startsWith('questname')) {
          quest.questName = this.extractQuotedString(line);
        } else if (line.toLowerCase().startsWith('version')) {
          const versionMatch = line.match(/version\s+([\d.]+)/i);
          if (versionMatch) quest.version = parseFloat(versionMatch[1]);
        } else if (line.toLowerCase().includes('hidden_end')) {
          quest.hiddenEnd = true;
        } else if (line.toLowerCase().includes('hidden')) {
          quest.hidden = true;
        } else if (line.toLowerCase().includes('disabled')) {
          quest.disabled = true;
        } else if (line.toLowerCase().startsWith('minlevel')) {
          quest.minLevel = this.extractNumber(line);
        } else if (line.toLowerCase().startsWith('maxlevel')) {
          quest.maxLevel = this.extractNumber(line);
        } else if (line.toLowerCase().startsWith('needadmin') || line.toLowerCase().startsWith('adminreq')) {
          quest.needAdmin = this.extractNumber(line);
        } else if (line.toLowerCase().startsWith('needclass') || line.toLowerCase().startsWith('classreq')) {
          quest.needClass = this.extractNumber(line);
        } else if (line.toLowerCase().startsWith('needquest') || line.toLowerCase().startsWith('questreq')) {
          quest.needQuest = this.extractNumber(line);
        } else if (line.toLowerCase().startsWith('startnpc')) {
          const npcId = this.extractNumber(line);
          if (npcId !== null) {
            quest.startNpc = quest.startNpc || [];
            quest.startNpc.push(npcId);
          }
        }
      }

      if (currentSection === 'state' && currentState) {
        if (line.toLowerCase().startsWith('desc')) {
          currentState.description = this.extractQuotedString(line);
        } else if (line.toLowerCase().startsWith('action')) {
          const action = this.parseAction(line);
          if (action) currentState.actions.push(action);
        } else if (line.toLowerCase().startsWith('rule')) {
          const rule = this.parseRule(line);
          if (rule) currentState.rules.push(rule);
        }
      }

      if (currentSection === 'random' && currentRandomBlock) {
        if (line.toLowerCase().startsWith('coord')) {
          const params = this.extractParams(line, 'coord');
          currentRandomBlock.entries.push({ type: 'coord', params });
        } else if (line.toLowerCase().startsWith('item')) {
          const params = this.extractParams(line, 'item');
          currentRandomBlock.entries.push({ type: 'item', params });
        }
      }
    }

    return quest;
  }

  static serialize(quest: QuestData): string {
    let output = 'Main\n{\n';
    output += `\tquestname\t"${quest.questName}"\n`;
    output += `\tversion\t\t${quest.version}\n`;
    if (quest.hidden) output += '\thidden\n';
    if (quest.hiddenEnd) output += '\thidden_end\n';
    if (quest.disabled) output += '\tdisabled\n';
    if (quest.minLevel !== undefined) output += `\tminlevel\t${quest.minLevel}\n`;
    if (quest.maxLevel !== undefined) output += `\tmaxlevel\t${quest.maxLevel}\n`;
    if (quest.needAdmin !== undefined) output += `\tneedadmin\t${quest.needAdmin}\n`;
    if (quest.needClass !== undefined) output += `\tneedclass\t${quest.needClass}\n`;
    if (quest.needQuest !== undefined) output += `\tneedquest\t${quest.needQuest}\n`;
    if (quest.startNpc && quest.startNpc.length > 0) {
      quest.startNpc.forEach(npcId => {
        output += `\tstartnpc\t${npcId}\n`;
      });
    }
    
    output += '}\n\n';

    
    quest.randomBlocks.forEach(block => {
      output += `random ${block.name}\n{\n`;
      block.entries.forEach(entry => {
        const params = entry.params.map(p => 
          typeof p === 'string' ? `"${p}"` : p
        ).join(', ');
        output += `\t${entry.type}(${params})\n`;
      });
      output += '}\n\n';
    });

    
    quest.states.forEach(state => {
      output += `state ${state.name}\n{\n`;
      if (state.description) {
        output += `\tdesc\t"${state.description}"\n`;
      }
      state.actions.forEach(action => {
        output += `\taction\t${action.rawText}\n`;
      });
      state.rules.forEach(rule => {
        output += `\trule\t${rule.rawText}\n`;
      });
      output += '}\n\n';
    });

    return output;
  }

  private static extractQuotedString(line: string): string {
    const match = line.match(/"([^"]*)"/);
    return match ? match[1] : '';
  }

  private static extractNumber(line: string): number | null {
    const match = line.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  private static parseAction(line: string): QuestAction | null {
    const actionMatch = line.match(/action\s+(\w+)\s*\((.*?)\)\s*;?/i);
    if (!actionMatch) return null;

    const type = actionMatch[1];
    const paramsStr = actionMatch[2];
    const params = this.parseParams(paramsStr);

    return {
      type,
      params,
      rawText: `${type}(${paramsStr});`
    };
  }

  private static parseRule(line: string): QuestRule | null {
    const ruleMatch = line.match(/rule\s+(\w+)\s*\((.*?)\)\s+goto\s+(\w+)/i);
    if (!ruleMatch) return null;
    const type = ruleMatch[1];
    const paramsStr = ruleMatch[2];
    const gotoState = ruleMatch[3];
    const params = this.parseParams(paramsStr);

    return {
      type,
      params,
      gotoState,
      rawText: `${type}(${paramsStr}) goto ${gotoState}`
    };
  }

  private static parseParams(paramsStr: string): (string | number)[] {
    if (!paramsStr.trim()) return [];
    const params: (string | number)[] = [];
    let current = '';
    let inQuotes = false;
    let depth = 0;

    for (let i = 0; i < paramsStr.length; i++) {
      const char = paramsStr[i];

      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === '(' && !inQuotes) {
        depth++;
        current += char;
      } else if (char === ')' && !inQuotes) {
        depth--;
        current += char;
      } else if (char === ',' && !inQuotes && depth === 0) {
        params.push(this.parseParam(current.trim()));
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      params.push(this.parseParam(current.trim()));
    }

    return params;
  }

  private static parseParam(param: string): string | number {
    if (param.startsWith('"') && param.endsWith('"')) {
      return param.slice(1, -1);
    }
    const num = parseFloat(param);
    if (!isNaN(num)) {
      return num;
    }
    return param;
  }

  private static extractParams(line: string, keyword: string): (string | number)[] {
    const match = line.match(new RegExp(`${keyword}\\s*\\((.*)\\)`, 'i'));
    if (!match) return [];
    return this.parseParams(match[1]);
  }
}
