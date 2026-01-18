import { Esf, EsfRecord, EoReader, EoWriter } from 'eolib';

interface Skill {
  id: number;
  name: string;
  chant: string;
  iconId: number;
  graphicId: number;
  tpCost: number;
  spCost: number;
  castTime: number;
  nature: number;
  type: number;
  element: number;
  elementPower: number;
  targetRestrict: number;
  targetType: number;
  targetTime: number;
  maxSkillLevel: number;
  minDamage: number;
  maxDamage: number;
  accuracy: number;
  evade: number;
  armor: number;
  returnDamage: number;
  hpHeal: number;
  tpHeal: number;
  spHeal: number;
  str: number;
  intl: number;
  wis: number;
  agi: number;
  con: number;
  cha: number;
}

interface ParsedESF {
  rid: number[];
  totalSkillsCount: number;
  version: number;
  records: Skill[];
}

function convertEsfRecord(record: EsfRecord, id: number): Skill {
  return {
    id,
    name: record.name || '',
    chant: record.chant || '',
    iconId: record.iconId || 0,
    graphicId: record.graphicId || 0,
    tpCost: record.tpCost || 0,
    spCost: record.spCost || 0,
    castTime: record.castTime || 0,
    nature: record.nature || 0,
    type: record.type || 0,
    element: record.element || 0,
    elementPower: record.elementPower || 0,
    targetRestrict: record.targetRestrict || 0,
    targetType: record.targetType || 0,
    targetTime: record.targetTime || 0,
    maxSkillLevel: record.maxSkillLevel || 0,
    minDamage: record.minDamage || 0,
    maxDamage: record.maxDamage || 0,
    accuracy: record.accuracy || 0,
    evade: record.evade || 0,
    armor: record.armor || 0,
    returnDamage: record.returnDamage || 0,
    hpHeal: record.hpHeal || 0,
    tpHeal: record.tpHeal || 0,
    spHeal: record.spHeal || 0,
    str: record.str || 0,
    intl: record.intl || 0,
    wis: record.wis || 0,
    agi: record.agi || 0,
    con: record.con || 0,
    cha: record.cha || 0
  };
}

export class ESFParser {
  static parse(buffer: ArrayBuffer): ParsedESF {
    const reader = new EoReader(new Uint8Array(buffer));
    const esf = Esf.deserialize(reader);

    const records: Skill[] = [];
    
    for (let i = 0; i < esf.skills.length; i++) {
      const skill = esf.skills[i];
      const id = i + 1;
      records.push(convertEsfRecord(skill, id));
    }

    return {
      rid: esf.rid,
      totalSkillsCount: esf.totalSkillsCount,
      version: esf.version,
      records
    };
  }

  static serialize(data: ParsedESF): Uint8Array {
    const writer = new EoWriter();
    
    const esf = new Esf();
    esf.rid = data.rid;
    esf.totalSkillsCount = data.totalSkillsCount;
    esf.version = data.version;
    
    const records: EsfRecord[] = [];
    for (const skill of data.records) {
      const record = new EsfRecord();
      record.name = skill.name;
      record.chant = skill.chant;
      record.iconId = skill.iconId;
      record.graphicId = skill.graphicId;
      record.tpCost = skill.tpCost;
      record.spCost = skill.spCost;
      record.castTime = skill.castTime;
      record.nature = skill.nature;
      record.type = skill.type;
      record.element = skill.element;
      record.elementPower = skill.elementPower;
      record.targetRestrict = skill.targetRestrict;
      record.targetType = skill.targetType;
      record.targetTime = skill.targetTime;
      record.maxSkillLevel = skill.maxSkillLevel;
      record.minDamage = skill.minDamage;
      record.maxDamage = skill.maxDamage;
      record.accuracy = skill.accuracy;
      record.evade = skill.evade;
      record.armor = skill.armor;
      record.returnDamage = skill.returnDamage;
      record.hpHeal = skill.hpHeal;
      record.tpHeal = skill.tpHeal;
      record.spHeal = skill.spHeal;
      record.str = skill.str;
      record.intl = skill.intl;
      record.wis = skill.wis;
      record.agi = skill.agi;
      record.con = skill.con;
      record.cha = skill.cha;
      records.push(record);
    }
    
    esf.skills = records;
    Esf.serialize(writer, esf);
    
    return writer.toByteArray();
  }
}
