import React from 'react';
import { SkillType, SkillTargetType, SkillTargetRestrict, SkillNature } from 'eolib';

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

interface SkillEditorProps {
  skill: Skill;
  onUpdateSkill: (id: number, updates: Partial<Skill>) => void;
  onDuplicateSkill: (id: number) => void;
  onDeleteSkill: (id: number) => void;
}

export default function SkillEditor({ 
  skill, 
  onUpdateSkill,
  onDuplicateSkill,
  onDeleteSkill
}: SkillEditorProps) {
  const handleInputChange = (field: string, value: string | number) => {
    onUpdateSkill(skill.id, { [field]: value });
  };

  const handleNumberInputChange = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    onUpdateSkill(skill.id, { [field]: numValue });
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>Skill #{skill.id}</h2>
        <div className="editor-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => onDuplicateSkill(skill.id)}
            title="Duplicate this skill"
          >
            Duplicate
          </button>
          <button
            className="btn btn-danger"
            onClick={() => onDeleteSkill(skill.id)}
            title="Delete this skill"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="editor-content">
        {/* Basic Information */}
        <div className="editor-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>ID</label>
              <input
                type="number"
                value={skill.id}
                disabled
                className="read-only"
              />
            </div>
            <div className="form-group flex-2">
              <label>Name</label>
              <input
                type="text"
                value={skill.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Skill name"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group flex-3">
              <label>Chant</label>
              <input
                type="text"
                value={skill.chant}
                onChange={(e) => handleInputChange('chant', e.target.value)}
                placeholder="Chant text"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Icon ID</label>
              <input
                type="number"
                value={skill.iconId}
                onChange={(e) => handleNumberInputChange('iconId', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>Graphic ID</label>
              <input
                type="number"
                value={skill.graphicId}
                onChange={(e) => handleNumberInputChange('graphicId', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>Max Level</label>
              <input
                type="number"
                value={skill.maxSkillLevel}
                onChange={(e) => handleNumberInputChange('maxSkillLevel', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
          </div>
        </div>

        {/* Cost & Casting */}
        <div className="editor-section">
          <h3>Cost & Casting</h3>
          <div className="form-row">
            <div className="form-group">
              <label>TP Cost</label>
              <input
                type="number"
                value={skill.tpCost}
                onChange={(e) => handleNumberInputChange('tpCost', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>SP Cost</label>
              <input
                type="number"
                value={skill.spCost}
                onChange={(e) => handleNumberInputChange('spCost', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>Cast Time</label>
              <input
                type="number"
                value={skill.castTime}
                onChange={(e) => handleNumberInputChange('castTime', e.target.value)}
                min="0"
                max="252"
              />
            </div>
          </div>
        </div>

        {/* Type & Target */}
        <div className="editor-section">
          <h3>Type & Target</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nature</label>
              <select
                value={skill.nature}
                onChange={(e) => handleNumberInputChange('nature', e.target.value)}
              >
                <option value={SkillNature.Spell}>Spell</option>
                <option value={SkillNature.Skill}>Skill</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={skill.type}
                onChange={(e) => handleNumberInputChange('type', e.target.value)}
              >
                <option value={SkillType.Heal}>Heal</option>
                <option value={SkillType.Attack}>Attack</option>
                <option value={SkillType.Bard}>Bard</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target Type</label>
              <select
                value={skill.targetType}
                onChange={(e) => handleNumberInputChange('targetType', e.target.value)}
              >
                <option value={SkillTargetType.Normal}>Normal</option>
                <option value={SkillTargetType.Self}>Self</option>
                <option value={SkillTargetType.Reserved2}>Reserved</option>
                <option value={SkillTargetType.Group}>Group</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target Restrict</label>
              <select
                value={skill.targetRestrict}
                onChange={(e) => handleNumberInputChange('targetRestrict', e.target.value)}
              >
                <option value={SkillTargetRestrict.Npc}>NPC</option>
                <option value={SkillTargetRestrict.Friendly}>Friendly</option>
                <option value={SkillTargetRestrict.Opponent}>Opponent</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Target Time</label>
              <input
                type="number"
                value={skill.targetTime}
                onChange={(e) => handleNumberInputChange('targetTime', e.target.value)}
                min="0"
                max="252"
              />
            </div>
          </div>
        </div>

        {/* Element */}
        <div className="editor-section">
          <h3>Element</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Element</label>
              <input
                type="number"
                value={skill.element}
                onChange={(e) => handleNumberInputChange('element', e.target.value)}
                min="0"
                max="252"
              />
            </div>
            <div className="form-group">
              <label>Element Power</label>
              <input
                type="number"
                value={skill.elementPower}
                onChange={(e) => handleNumberInputChange('elementPower', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
          </div>
        </div>

        {/* Damage & Combat */}
        <div className="editor-section">
          <h3>Damage & Combat</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Min Damage</label>
              <input
                type="number"
                value={skill.minDamage}
                onChange={(e) => handleNumberInputChange('minDamage', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>Max Damage</label>
              <input
                type="number"
                value={skill.maxDamage}
                onChange={(e) => handleNumberInputChange('maxDamage', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>Accuracy</label>
              <input
                type="number"
                value={skill.accuracy}
                onChange={(e) => handleNumberInputChange('accuracy', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Evade</label>
              <input
                type="number"
                value={skill.evade}
                onChange={(e) => handleNumberInputChange('evade', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>Armor</label>
              <input
                type="number"
                value={skill.armor}
                onChange={(e) => handleNumberInputChange('armor', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>Return Damage</label>
              <input
                type="number"
                value={skill.returnDamage}
                onChange={(e) => handleNumberInputChange('returnDamage', e.target.value)}
                min="0"
                max="252"
              />
            </div>
          </div>
        </div>

        {/* Healing */}
        <div className="editor-section">
          <h3>Healing</h3>
          <div className="form-row">
            <div className="form-group">
              <label>HP Heal</label>
              <input
                type="number"
                value={skill.hpHeal}
                onChange={(e) => handleNumberInputChange('hpHeal', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>TP Heal</label>
              <input
                type="number"
                value={skill.tpHeal}
                onChange={(e) => handleNumberInputChange('tpHeal', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>SP Heal</label>
              <input
                type="number"
                value={skill.spHeal}
                onChange={(e) => handleNumberInputChange('spHeal', e.target.value)}
                min="0"
                max="252"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="editor-section">
          <h3>Stat Bonuses</h3>
          <div className="form-row">
            <div className="form-group">
              <label>STR</label>
              <input
                type="number"
                value={skill.str}
                onChange={(e) => handleNumberInputChange('str', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>INT</label>
              <input
                type="number"
                value={skill.intl}
                onChange={(e) => handleNumberInputChange('intl', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>WIS</label>
              <input
                type="number"
                value={skill.wis}
                onChange={(e) => handleNumberInputChange('wis', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>AGI</label>
              <input
                type="number"
                value={skill.agi}
                onChange={(e) => handleNumberInputChange('agi', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>CON</label>
              <input
                type="number"
                value={skill.con}
                onChange={(e) => handleNumberInputChange('con', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
            <div className="form-group">
              <label>CHA</label>
              <input
                type="number"
                value={skill.cha}
                onChange={(e) => handleNumberInputChange('cha', e.target.value)}
                min="0"
                max="64008"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
