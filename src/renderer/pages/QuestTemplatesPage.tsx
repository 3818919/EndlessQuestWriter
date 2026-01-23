import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, Snackbar, Paper, Grid, Card, CardContent, CardActions, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { loadTemplates, TemplateData, clearTemplatesCache } from '../services/templateService';
import { EQFParser, QuestData } from '../../eqf-parser';
import QuestEditor from '../components/quests/QuestEditor';

interface QuestTemplatesPageProps {
  theme: 'dark' | 'light';
}

const QuestTemplatesPage: React.FC<QuestTemplatesPageProps> = ({ theme }) => {
  const [templates, setTemplates] = useState<Record<string, TemplateData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [questEditorOpen, setQuestEditorOpen] = useState(false);
  const [currentQuest, setCurrentQuest] = useState<QuestData | null>(null);
  
  
  const loadTemplatesData = async () => {
    try {
      setLoading(true);
      // Clear cache to ensure we get fresh data
      clearTemplatesCache();
      const loadedTemplates = await loadTemplates();
      setTemplates(loadedTemplates);
      setError(null);
    } catch (err) {
      setError('Failed to load templates. Please check if templates directory exists.');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load templates on mount and whenever the component is rendered
  useEffect(() => {
    loadTemplatesData();
  }, []);
  
  const handleOpenDialog = (templateFileName?: string) => {
    if (templateFileName && templates[templateFileName]) {
      
      const template = templates[templateFileName];
      setEditingTemplate(templateFileName);
      setTemplateName(templateFileName.replace('.eqf', ''));
      
      
      const questData: QuestData = {
        id: 0, 
        ...template
      };
      setCurrentQuest(questData);
      setQuestEditorOpen(true);
    } else {
      
      setEditingTemplate(null);
      setTemplateName('');
      setDialogOpen(true);
    }
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setTemplateName('');
  };
  
  const handleCloseQuestEditor = () => {
    setQuestEditorOpen(false);
    setCurrentQuest(null);
  };
  
  const handleSaveQuestEditor = async (questId: number, updates: Partial<QuestData>) => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }
    
    try {
      // Merge updates with current quest
      const questData = { ...currentQuest, ...updates } as QuestData;
      
      // Update the current quest state so the editor reflects the changes
      setCurrentQuest(questData);
      
      // Save to file
      const eqfContent = generateEQFContent(questData);
      const configDir = await window.electronAPI.getConfigDir();
      const templatesDir = `${configDir}/templates`;
      const templateFileName = `${templateName}.eqf`;
      const templatePath = `${templatesDir}/${templateFileName}`;
      
      await window.electronAPI.writeTextFile(templatePath, eqfContent);
      
      // Refresh the templates list in the background (don't close editor)
      clearTemplatesCache();
      loadTemplates().then(setTemplates);
      
      // Don't close the editor - just show a brief success indication
      // The user can continue editing or manually close when done
    } catch (err) {
      setError(`Failed to save template: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error saving template:', err);
    }
  };
  
  const generateEQFContent = (questData: QuestData): string => {
    let content = `quest "${questData.questName}"\nversion ${questData.version}\n`;
    
    if (questData.hidden) content += 'hidden\n';
    if (questData.hiddenEnd) content += 'hiddenend\n';
    if (questData.disabled) content += 'disabled\n';
    if (questData.minLevel !== undefined) content += `minlevel ${questData.minLevel}\n`;
    if (questData.maxLevel !== undefined) content += `maxlevel ${questData.maxLevel}\n`;
    if (questData.needAdmin !== undefined) content += `needadmin ${questData.needAdmin}\n`;
    if (questData.needClass !== undefined) content += `needclass ${questData.needClass}\n`;
    if (questData.needQuest !== undefined) content += `needquest ${questData.needQuest}\n`;
    
    if (questData.startNpc && questData.startNpc.length > 0) {
      content += `startnpc ${questData.startNpc.join(' ')}\n`;
    }
    
    content += '\n';
    
    
    questData.states.forEach(state => {
      content += `State ${state.name}\n{\n`;
      content += `    desc "${state.description}"\n`;
      
      if (state.items && state.items.length > 0) {
        state.items.forEach(item => {
          if (item.kind === 'action') {
            content += `    action ${item.data.rawText}\n`;
          } else {
            content += `    rule ${item.data.rawText}\n`;
          }
        });
      } else {
        state.actions.forEach(action => {
          content += `    action ${action.rawText}\n`;
        });
        state.rules.forEach(rule => {
          content += `    rule ${rule.rawText}\n`;
        });
      }
      
      content += '}\n\n';
    });
    
    return content.trim();
  };
  
  const handleCreateNewTemplate = () => {
    
    const newQuest: QuestData = {
      id: 0,
      questName: 'New Template',
      version: 1,
      states: [
        {
          name: 'Begin',
          description: 'Quest start',
          actions: [],
          rules: []
        },
        {
          name: 'End',
          description: 'Quest completed',
          actions: [],
          rules: []
        }
      ],
      randomBlocks: []
    };
    
    setCurrentQuest(newQuest);
    setQuestEditorOpen(true);
  };
  
  const handleDeleteTemplate = async (templateFileName: string) => {
    const displayName = templateFileName.replace(/\.eqf$/i, '');
    if (!confirm(`Are you sure you want to delete template "${displayName}"?`)) {
      return;
    }
    
    try {
      const configDir = await window.electronAPI.getConfigDir();
      const templatesDir = `${configDir}/templates`;
      const templatePath = `${templatesDir}/${templateFileName}`;
      
      await window.electronAPI.deleteFile(templatePath);
      await loadTemplatesData();
      setSuccessMessage('Template deleted successfully!');
    } catch (err) {
      setError('Failed to delete template. Please try again.');
      console.error('Error deleting template:', err);
    }
  };
  
  const handleExportTemplate = async (questId: number) => {
    
  };
  
  const handleDeleteQuest = async (questId: number) => {
    
  };
  
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography>Loading templates...</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      p: 3, 
      width: '100%',
      height: '100%', 
      overflow: 'auto',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h4" component="h1" sx={{ color: 'var(--text-primary)' }}>
          Quest Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            backgroundColor: 'var(--accent-primary)',
            '&:hover': {
              backgroundColor: 'var(--accent-hover)'
            }
          }}
        >
          Add New Template
        </Button>
      </Box>
      
      <Typography variant="body1" sx={{ 
        mb: 3, 
        color: 'var(--text-secondary)' 
      }}>
        Manage quest templates that can be used when creating new quests. Templates are stored in config/templates/.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ 
          mb: 2,
          backgroundColor: 'var(--accent-danger)',
          color: 'white'
        }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={2}>
        {Object.entries(templates).map(([fileName, template]) => (
          <Grid item xs={12} md={6} lg={4} key={fileName}>
            <Card sx={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)'
            }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom sx={{ color: 'var(--text-primary)' }}>
                  {fileName.replace('.eqf', '')}
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: 'var(--text-secondary)' }}>
                  <strong>Quest:</strong> {template.questName}
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: 'var(--text-secondary)' }}>
                  <strong>Version:</strong> {template.version}
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: 'var(--text-secondary)' }}>
                  <strong>States:</strong> {template.states.length}
                </Typography>
                {template.hidden && (
                  <Typography variant="caption" sx={{ color: 'var(--accent-warning)' }}>
                    Hidden Quest
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenDialog(fileName)}
                    sx={{ color: 'var(--text-primary)' }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteTemplate(fileName)}
                    sx={{ color: 'var(--accent-danger)' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {Object.keys(templates).length === 0 && !loading && (
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)'
        }}>
          <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
            No templates found. Add your first template to get started.
          </Typography>
        </Paper>
      )}
      
      {/* Name Dialog for New Templates */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          New Template Name
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--bg-primary)' }}>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              fullWidth
              helperText="Filename (without .eqf extension)"
              sx={{
                '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                '& .MuiInputBase-input': { color: 'var(--text-primary)' },
                '& .MuiFormHelperText-root': { color: 'var(--text-tertiary)' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'var(--border-primary)' },
                  '&:hover fieldset': { borderColor: 'var(--border-hover)' },
                  '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' }
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-primary)'
        }}>
          <Button 
            onClick={handleCloseDialog} 
            startIcon={<CancelIcon />}
            sx={{ color: 'var(--text-primary)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              handleCloseDialog();
              handleCreateNewTemplate();
            }}
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={!templateName.trim()}
            sx={{
              backgroundColor: 'var(--accent-primary)',
              '&:hover': {
                backgroundColor: 'var(--accent-hover)'
              }
            }}
          >
            Create Template
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Quest Editor Dialog */}
      {questEditorOpen && currentQuest && (
        <Dialog 
          open={questEditorOpen} 
          onClose={handleCloseQuestEditor}
          maxWidth="xl"
          fullWidth
          fullScreen
          PaperProps={{
            sx: {
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6">
              {editingTemplate ? `Edit Template: ${templateName}` : 'Create New Template'}
            </Typography>
            <Button
              onClick={handleCloseQuestEditor}
              sx={{ color: 'var(--text-primary)' }}
            >
              Close
            </Button>
          </DialogTitle>
          <DialogContent sx={{ 
            backgroundColor: 'var(--bg-primary)',
            p: 0,
            height: 'calc(100vh - 64px)'
          }}>
            <QuestEditor
              quest={currentQuest}
              onSave={handleSaveQuestEditor}
              onExport={handleExportTemplate}
              onDelete={handleDeleteQuest}
              isTemplateMode={true}
              theme={theme}
            />
          </DialogContent>
        </Dialog>
      )}
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success"
          sx={{
            backgroundColor: 'var(--accent-success)',
            color: 'white'
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuestTemplatesPage;