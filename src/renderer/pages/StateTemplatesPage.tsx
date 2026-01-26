import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, Snackbar, Paper, Grid, Card, CardContent, CardActions, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { loadStateTemplates, StateTemplateData, clearStateTemplatesCache } from '../services/stateTemplateService';
import StateNodeEditor from '../components/quests/StateNodeEditor';
import { QuestState, QuestAction, QuestRule } from '../../eqf-parser';

interface StateTemplatesPageProps {
  theme: 'dark' | 'light';
}

const StateTemplatesPage: React.FC<StateTemplatesPageProps> = ({ theme }) => {
  const [templates, setTemplates] = useState<Record<string, StateTemplateData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [actions, setActions] = useState<QuestAction[]>([]);
  const [rules, setRules] = useState<QuestRule[]>([]);
  const [stateEditorOpen, setStateEditorOpen] = useState(false);
  const [currentState, setCurrentState] = useState<QuestState>({
    name: 'TemplateState',
    description: '',
    actions: [],
    rules: []
  });
  
  
  useEffect(() => {
    loadTemplatesData();
  }, []);
  
  const loadTemplatesData = async () => {
    try {
      setLoading(true);
      clearStateTemplatesCache();
      const loadedTemplates = await loadStateTemplates();
      setTemplates(loadedTemplates);
      setError(null);
    } catch (err) {
      setError('Failed to load state templates. Please check if templates/states directory exists.');
      console.error('Error loading state templates:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDialog = (templateFileName?: string) => {
    if (templateFileName && templates[templateFileName]) {
      const template = templates[templateFileName];
      setEditingTemplate(templateFileName);
      const nameWithoutExt = templateFileName.replace(/\.eqf$/i, '');
      setTemplateName(nameWithoutExt);
      setCurrentState({
        name: nameWithoutExt,
        description: template.description,
        actions: [...template.actions],
        rules: [...template.rules],
        items: template.items ? [...template.items] : []
      });
      setStateEditorOpen(true);
    } else {
      setEditingTemplate(null);
      setTemplateName('');
      setDescription('');
      setActions([]);
      setRules([]);
      setDialogOpen(true);
    }
  };
  
  const handleOpenStateEditor = () => {
    setDialogOpen(false);
    setCurrentState({
      name: templateName || 'NewTemplate',
      description: description,
      actions: [...actions],
      rules: [...rules],
      items: []
    });
    setStateEditorOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setTemplateName('');
    setDescription('');
    setActions([]);
    setRules([]);
  };
  
  const handleCloseStateEditor = () => {
    setStateEditorOpen(false);
  };
  
  const handleSaveStateEditor = async (updates: Partial<QuestState>, nameChanged: boolean, oldName: string) => {
    const finalTemplateName = templateName || updates.name || 'NewTemplate';
    
    if (!finalTemplateName.trim()) {
      setError('Template name is required');
      return;
    }
    
    try {
      const templatesDir = await window.electronAPI.getTemplatesDir();
      const statesDir = `${templatesDir}/states`;
      const templateFileName = `${finalTemplateName}.eqf`;
      const templatePath = `${statesDir}/${templateFileName}`;
      
      let content = `desc "${updates.description || ''}"\n`;
      
      // Use items array if present (preserves interleaved order)
      if (updates.items && updates.items.length > 0) {
        updates.items.forEach(item => {
          if (item.kind === 'action') {
            content += `action ${item.data.rawText}\n`;
          } else {
            content += `rule ${item.data.rawText}\n`;
          }
        });
      } else {
        (updates.actions || []).forEach(action => {
          content += `action ${action.rawText}\n`;
        });
        (updates.rules || []).forEach(rule => {
          content += `rule ${rule.rawText}\n`;
        });
      }
      
      await window.electronAPI.ensureDir(statesDir);
      await window.electronAPI.writeTextFile(templatePath, content.trim());

      clearStateTemplatesCache();
      await loadTemplatesData();
      
      setSuccessMessage(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!');
      setStateEditorOpen(false);
      setEditingTemplate(null);
      setTemplateName('');
    } catch (err) {
      setError('Failed to save template. Please try again.');
      console.error('Error saving template:', err);
    }
  };
  
  const generateStateTemplateContent = (): string => {
    let content = `desc "${description}"\n`;
    
    actions.forEach(action => {
      content += `action ${action.rawText}\n`;
    });
    
    rules.forEach(rule => {
      content += `rule ${rule.rawText}\n`;
    });
    
    return content.trim();
  };
  
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }
    
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    
    try {
      const templatesDir = await window.electronAPI.getTemplatesDir();
      const statesDir = `${templatesDir}/states`;
      const templateFileName = `${templateName}.eqf`;
      const templatePath = `${statesDir}/${templateFileName}`;
      const content = generateStateTemplateContent();

      await window.electronAPI.ensureDir(statesDir);
      await window.electronAPI.writeTextFile(templatePath, content);
      await loadTemplatesData();
      
      setSuccessMessage(editingTemplate ? 'Template updated successfully!' : 'Template added successfully!');
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save template. Please try again.');
      console.error('Error saving template:', err);
    }
  };
  
  const handleDeleteTemplate = async (templateFileName: string) => {
    const displayName = templateFileName.replace(/\.eqf$/i, '');
    if (!confirm(`Are you sure you want to delete state template "${displayName}"?`)) {
      return;
    }
    
    try {
      const templatesDir = await window.electronAPI.getTemplatesDir();
      const statesDir = `${templatesDir}/states`;
      const templatePath = `${statesDir}/${templateFileName}`;
      
      await window.electronAPI.deleteFile(templatePath);
      
      clearStateTemplatesCache();
      await loadTemplatesData();
      
      setSuccessMessage('Template deleted successfully!');
    } catch (err) {
      setError('Failed to delete template. Please try again.');
      console.error('Error deleting template:', err);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography>Loading state templates...</Typography>
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
          State Templates
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
        Manage state templates that can be used when creating quest states. Templates are stored in config/templates/states/.
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
                  <strong>Description:</strong> {template.description || '(No description)'}
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: 'var(--text-secondary)' }}>
                  <strong>Actions:</strong> {template.actions.length}
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  <strong>Rules:</strong> {template.rules.length}
                </Typography>
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
            No state templates found. Add your first template to get started.
          </Typography>
        </Paper>
      )}
      
      {/* New Template Name Dialog */}
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
          New State Template
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--bg-primary)' }}>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              fullWidth
              autoFocus
              helperText="Enter a name for your new state template"
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
            onClick={handleOpenStateEditor} 
            variant="contained" 
            disabled={!templateName.trim()}
            sx={{
              backgroundColor: 'var(--accent-primary)',
              '&:hover': {
                backgroundColor: 'var(--accent-hover)'
              }
            }}
          >
            Continue to Editor
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* State Editor Dialog */}
      {stateEditorOpen && (
        <Dialog 
          open={stateEditorOpen} 
          onClose={handleCloseStateEditor}
          maxWidth="lg"
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
            borderBottom: '1px solid var(--border-primary)'
          }}>
            Edit State Template
          </DialogTitle>
          <DialogContent sx={{ backgroundColor: 'var(--bg-primary)', p: 0 }}>
            <StateNodeEditor
              state={currentState}
              stateIndex={0}
              originalStateName="TemplateState"
              allStates={[currentState]}
              onClose={handleCloseStateEditor}
              onSave={handleSaveStateEditor}
              isTemplateMode={true}
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

export default StateTemplatesPage;