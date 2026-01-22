import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Snackbar,
  Divider,
  Card,
  CardContent,
  CardActions,
  Grid,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { loadConfig, clearConfigCache, ActionOrRuleDoc, ParamInfo } from '../services/configService';

interface ParamEditor {
  name: string;
  type: 'string' | 'integer';
  id: number;
}

interface ActionsEditorPageProps {
  theme: 'dark' | 'light';
}

const ActionsEditorPage: React.FC<ActionsEditorPageProps> = ({ theme }) => {
  const [actions, setActions] = useState<Record<string, ActionOrRuleDoc>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [actionName, setActionName] = useState('');
  const [description, setDescription] = useState('');
  const [params, setParams] = useState<ParamEditor[]>([]);
  const [nextParamId, setNextParamId] = useState(1);
  
  
  useEffect(() => {
    loadActions();
  }, []);
  
  const loadActions = async () => {
    try {
      setLoading(true);
      const config = await loadConfig();
      setActions(config.actions);
      setError(null);
    } catch (err) {
      setError('Failed to load actions. Please check if config files exist.');
      console.error('Error loading actions:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddParam = () => {
    setParams([...params, { name: `param${nextParamId}`, type: 'integer', id: nextParamId }]);
    setNextParamId(nextParamId + 1);
  };
  
  const handleRemoveParam = (id: number) => {
    setParams(params.filter(param => param.id !== id));
  };
  
  const handleUpdateParam = (id: number, field: keyof ParamEditor, value: string) => {
    setParams(params.map(param => 
      param.id === id ? { ...param, [field]: value } : param
    ));
  };
  
  const handleOpenDialog = (actionName?: string) => {
    if (actionName && actions[actionName]) {
      
      setEditingAction(actionName);
      setActionName(actionName);
      setDescription(actions[actionName].description);
      
      
      const editorParams: ParamEditor[] = actions[actionName].params.map((param, index) => ({
        name: param.name,
        type: param.type,
        id: index + 1
      }));
      setParams(editorParams);
      setNextParamId(editorParams.length + 1);
    } else {
      
      setEditingAction(null);
      setActionName('');
      setDescription('');
      setParams([]);
      setNextParamId(1);
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAction(null);
    setActionName('');
    setDescription('');
    setParams([]);
  };
  
  const generateSignature = (name: string, params: ParamEditor[]): string => {
    const paramStrings = params.map(param => {
      if (param.type === 'string') {
        return `"${param.name}"`;
      }
      return param.name;
    });
    return `${name}(${paramStrings.join(', ')})`;
  };
  
  const handleSaveAction = async () => {
    if (!actionName.trim()) {
      setError('Action name is required');
      return;
    }
    
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    
    try {
      
      const configDir = await window.electronAPI.getConfigDir();
      const actionsPath = `${configDir}/actions.ini`;
      const result = await window.electronAPI.readTextFile(actionsPath);
      let content = result.success && result.data ? result.data : '';
      const signature = generateSignature(actionName, params);
      const newEntry = `\n\n[${actionName}]\nsignature = \`${signature};\`\ndescription = ${description}`;
      if (editingAction && actions[editingAction]) {
        const oldEntry = `[${editingAction}]\nsignature = \`${actions[editingAction].rawSignature}\`\ndescription = ${actions[editingAction].description}`;
        content = content.replace(oldEntry, '');
      }
      content += newEntry;
      await window.electronAPI.writeTextFile(actionsPath, content);
      clearConfigCache();
      await loadActions();
      setSuccessMessage(editingAction ? 'Action updated successfully!' : 'Action added successfully!');
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save action. Please try again.');
      console.error('Error saving action:', err);
    }
  };
  
  const handleDeleteAction = async (actionName: string) => {
    if (!confirm(`Are you sure you want to delete action "${actionName}"?`)) {
      return;
    }
    
    try {
      const configDir = await window.electronAPI.getConfigDir();
      const actionsPath = `${configDir}/actions.ini`;
      
      const result = await window.electronAPI.readTextFile(actionsPath);
      if (!result.success || !result.data) {
        throw new Error('Failed to read actions file');
      }
      let content = result.data;
      const action = actions[actionName];
      const entry = `[${actionName}]\nsignature = \`${action.rawSignature}\`\ndescription = ${action.description}`;
      content = content.replace(entry, '');
      
      await window.electronAPI.writeTextFile(actionsPath, content);
      clearConfigCache();
      await loadActions();
      setSuccessMessage('Action deleted successfully!');
    } catch (err) {
      setError('Failed to delete action. Please try again.');
      console.error('Error deleting action:', err);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography>Loading actions...</Typography>
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
          Actions Editor
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
          Add New Action
        </Button>
      </Box>
      
      <Typography variant="body1" sx={{ 
        mb: 3, 
        color: 'var(--text-secondary)' 
      }}>
        Manage quest actions that can be used in quest scripts. Actions are defined in config/actions.ini.
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
        {Object.entries(actions).map(([name, action]) => (
          <Grid item xs={12} md={6} lg={4} key={name}>
            <Card sx={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)'
            }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom sx={{ color: 'var(--text-primary)' }}>
                  {name}
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: 'var(--text-secondary)' }}>
                  {action.description}
                </Typography>
                <Typography variant="caption" component="div" sx={{ 
                  mt: 1, 
                  fontFamily: 'monospace',
                  color: 'var(--text-primary)'
                }}>
                  {action.signature}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {action.params.map((param, index) => (
                    <Chip
                      key={index}
                      label={`${param.name}: ${param.type}`}
                      size="small"
                      sx={{ 
                        mr: 0.5, 
                        mb: 0.5,
                        backgroundColor: param.type === 'string' ? 'var(--accent-primary)' : 'var(--accent-success)',
                        color: 'white'
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenDialog(name)}
                    sx={{ color: 'var(--text-primary)' }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteAction(name)}
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
      
      {Object.keys(actions).length === 0 && !loading && (
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)'
        }}>
          <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
            No actions found. Add your first action to get started.
          </Typography>
        </Paper>
      )}
      
      {/* Edit/Add Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
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
          {editingAction ? `Edit Action: ${editingAction}` : 'Add New Action'}
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--bg-primary)' }}>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Action Name"
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              fullWidth
              margin="normal"
              helperText="This will be used in quest scripts (e.g., OpenShopMenu)"
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
            
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              margin="normal"
              multiline
              rows={2}
              helperText="Describe what this action does"
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
            
            <Divider sx={{ 
              my: 3, 
              borderColor: 'var(--border-primary)',
              '& .MuiDivider-wrapper': { color: 'var(--text-secondary)' }
            }}>
              <Typography variant="subtitle2">Parameters</Typography>
            </Divider>
            
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddParam}
                size="small"
                sx={{
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                  '&:hover': {
                    borderColor: 'var(--border-hover)',
                    backgroundColor: 'var(--bg-hover)'
                  }
                }}
              >
                Add Parameter
              </Button>
            </Box>
            
            {params.map((param) => (
              <Paper key={param.id} sx={{ 
                p: 2, 
                mb: 2,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)'
              }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={5}>
                    <TextField
                      label="Parameter Name"
                      value={param.name}
                      onChange={(e) => handleUpdateParam(param.id, 'name', e.target.value)}
                      fullWidth
                      size="small"
                      helperText="Display name in editor"
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
                  </Grid>
                  <Grid item xs={5}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: 'var(--text-secondary)' }}>Type</InputLabel>
                      <Select
                        value={param.type}
                        label="Type"
                        onChange={(e) => handleUpdateParam(param.id, 'type', e.target.value as 'string' | 'integer')}
                        sx={{
                          color: 'var(--text-primary)',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'var(--border-primary)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'var(--border-hover)'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'var(--accent-primary)'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-primary)'
                            }
                          }
                        }}
                      >
                        <MenuItem 
                          value="integer" 
                          sx={{ 
                            color: 'var(--text-primary)',
                            '&:hover': {
                              backgroundColor: 'var(--bg-hover)'
                            }
                          }}
                        >
                          Integer
                        </MenuItem>
                        <MenuItem 
                          value="string" 
                          sx={{ 
                            color: 'var(--text-primary)',
                            '&:hover': {
                              backgroundColor: 'var(--bg-hover)'
                            }
                          }}
                        >
                          String
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton
                      onClick={() => handleRemoveParam(param.id)}
                      size="small"
                      sx={{ color: 'var(--accent-danger)' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            
            {params.length > 0 && (
              <Paper sx={{ 
                p: 2, 
                mt: 2, 
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)'
              }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--text-primary)' }}>
                  Preview Signature:
                </Typography>
                <Typography variant="body2" fontFamily="monospace" sx={{ color: 'var(--text-primary)' }}>
                  {generateSignature(actionName, params)};
                </Typography>
              </Paper>
            )}
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
            onClick={handleSaveAction} 
            variant="contained" 
            startIcon={<SaveIcon />}
            sx={{
              backgroundColor: 'var(--accent-primary)',
              '&:hover': {
                backgroundColor: 'var(--accent-hover)'
              }
            }}
          >
            {editingAction ? 'Update Action' : 'Add Action'}
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default ActionsEditorPage;