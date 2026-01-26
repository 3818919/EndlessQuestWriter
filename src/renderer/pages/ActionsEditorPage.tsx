import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
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
  Grid,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { loadConfig, clearConfigCache, saveActionsConfig, ActionOrRuleDoc, ParamInfo } from '../services/configService';

interface ParamEditor {
  name: string;
  type: 'string' | 'integer';
  id: number;
}

interface ActionsEditorPageProps {
  theme: 'dark' | 'light';
  projectPath?: string;
}

const ActionsEditorPage: React.FC<ActionsEditorPageProps> = ({ theme, projectPath }) => {
  const [actions, setActions] = useState<Record<string, ActionOrRuleDoc>>({});
  const [actionOrder, setActionOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [actionName, setActionName] = useState('');
  const [description, setDescription] = useState('');
  const [params, setParams] = useState<ParamEditor[]>([]);
  const [nextParamId, setNextParamId] = useState(1);
  
  
  useEffect(() => {
    loadActions();
  }, [projectPath]);
  
  const loadActions = async () => {
    try {
      setLoading(true);
      clearConfigCache(projectPath);
      const config = await loadConfig(projectPath);
      setActions(config.actions);
      setActionOrder(Object.keys(config.actions));
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
    
    if (!projectPath) {
      setError('No project selected. Please select a project first.');
      return;
    }
    
    try {
      const signature = generateSignature(actionName, params);
      const newAction: ActionOrRuleDoc = {
        signature: `${signature};`,
        description: description.trim(),
        params: params.map(p => ({ name: p.name, type: p.type })),
        rawSignature: `\`${signature};\``
      };

      const newActions = { ...actions };
      
      if (editingAction && editingAction !== actionName) {
        delete newActions[editingAction];
        const newOrder = actionOrder.map(name => name === editingAction ? actionName : name);
        setActionOrder(newOrder);
      } else if (!editingAction) {
        setActionOrder([...actionOrder, actionName]);
      }
      
      newActions[actionName] = newAction;
      setActions(newActions);

      await saveActionsConfig(projectPath, newActions);
      setSuccessMessage(editingAction ? 'Action updated successfully!' : 'Action added successfully!');
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save action. Please try again.');
      console.error('Error saving action:', err);
    }
  };
  
  const saveActionsInOrder = async (orderedNames: string[]) => {
    if (!projectPath) {
      setError('No project selected');
      return;
    }
    
    try {
      const orderedActions: Record<string, ActionOrRuleDoc> = {};
      for (const name of orderedNames) {
        if (actions[name]) {
          orderedActions[name] = actions[name];
        }
      }
      
      await saveActionsConfig(projectPath, orderedActions);
      setSuccessMessage('Actions reordered successfully!');
    } catch (err) {
      setError('Failed to save action order. Please try again.');
      console.error('Error saving action order:', err);
    }
  };
  
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };
  
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };
  
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...actionOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setActionOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
    await saveActionsInOrder(newOrder);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  const handleDeleteAction = async (actionNameToDelete: string) => {
    if (!confirm(`Are you sure you want to delete action "${actionNameToDelete}"?`)) {
      return;
    }
    
    if (!projectPath) {
      setError('No project selected');
      return;
    }
    
    try {
      const newActions = { ...actions };
      delete newActions[actionNameToDelete];
      
      const newOrder = actionOrder.filter(name => name !== actionNameToDelete);
      
      setActions(newActions);
      setActionOrder(newOrder);
      
      await saveActionsConfig(projectPath, newActions);
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
  
  if (!projectPath) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" sx={{ color: 'var(--text-secondary)' }}>No Project Selected</Typography>
        <Typography sx={{ color: 'var(--text-tertiary)' }}>
          Please select a project to edit its actions configuration.
        </Typography>
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
        Manage quest actions for this project. Actions are stored in the project's actions.json file.
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
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {actionOrder.map((name, index) => {
          const action = actions[name];
          if (!action) return null;
          
          return (
            <Card 
              key={name}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              sx={{
                backgroundColor: 'var(--bg-secondary)',
                border: dragOverIndex === index 
                  ? '2px solid var(--accent-primary)' 
                  : '1px solid var(--border-primary)',
                opacity: draggedIndex === index ? 0.5 : 1,
                transition: 'border 0.2s, opacity 0.2s',
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Tooltip title="Drag to reorder">
                    <Box
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      sx={{ 
                        cursor: 'grab',
                        color: 'var(--text-tertiary)',
                        '&:hover': { color: 'var(--text-primary)' },
                        '&:active': { cursor: 'grabbing' },
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <DragIndicatorIcon />
                    </Box>
                  </Tooltip>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="h6" component="h2" sx={{ color: 'var(--text-primary)', m: 0 }}>
                        {name}
                      </Typography>
                      <Typography variant="caption" component="div" sx={{ 
                        fontFamily: 'monospace',
                        color: 'var(--accent-primary)',
                        backgroundColor: 'var(--bg-tertiary)',
                        px: 1,
                        py: 0.25,
                        borderRadius: 1
                      }}>
                        {action.signature}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
                      {action.description}
                    </Typography>
                    {action.params.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {action.params.map((param, paramIndex) => (
                          <Chip
                            key={paramIndex}
                            label={`${param.name}: ${param.type}`}
                            size="small"
                            sx={{ 
                              backgroundColor: param.type === 'string' ? 'var(--accent-primary)' : 'var(--accent-success)',
                              color: 'white'
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
      
      {actionOrder.length === 0 && !loading && (
        <Card sx={{ 
          p: 3, 
          textAlign: 'center',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)'
        }}>
          <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
            No actions found. Add your first action to get started.
          </Typography>
        </Card>
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
