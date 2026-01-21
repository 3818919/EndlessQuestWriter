import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  LinearProgress, 
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import { Download, Refresh, Close } from '@mui/icons-material';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
}

interface UpdateNotificationProps {
  onUpdateCheck?: () => void;
}

export default function UpdateNotification({ onUpdateCheck }: UpdateNotificationProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [checking, setChecking] = useState(false);

  // Check for updates on component mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    if (!window.electronAPI) return;
    
    setChecking(true);
    try {
      const result = await window.electronAPI.checkForUpdates();
      
      if (result.success && result.hasUpdate && result.updateInfo) {
        setUpdateInfo(result.updateInfo);
        setUpdateAvailable(true);
        setShowDialog(true);
      } else {
        setSnackbarMessage('No updates available. You have the latest version!');
        setShowSnackbar(true);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setSnackbarMessage('Failed to check for updates. Please try again later.');
      setShowSnackbar(true);
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadUpdate = async () => {
    if (!window.electronAPI || !updateInfo) return;
    
    setDownloading(true);
    setDownloadProgress(0);
    
    try {
      // Start download
      await window.electronAPI.downloadAndInstall();
      
      // The app will restart automatically when download completes
      // This is handled by the main process
      
    } catch (error) {
      console.error('Error downloading update:', error);
      setSnackbarMessage('Failed to download update. Please try again.');
      setShowSnackbar(true);
      setDownloading(false);
    }
  };

  const handleCloseDialog = () => {
    if (!downloading) {
      setShowDialog(false);
      setUpdateAvailable(false);
    }
  };

  const handleManualCheck = () => {
    checkForUpdates();
    if (onUpdateCheck) {
      onUpdateCheck();
    }
  };

  return (
    <>
      {/* Manual Update Check Button */}
      <Button
        onClick={handleManualCheck}
        disabled={checking || downloading}
        startIcon={checking ? <Refresh className="animate-spin" /> : <Refresh />}
        size="small"
        style={{
          color: 'var(--text-secondary)',
          textTransform: 'none',
          fontSize: '12px'
        }}
      >
        {checking ? 'Checking...' : 'Check for Updates'}
      </Button>

      {/* Update Available Dialog */}
      <Dialog
        open={showDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)'
          }
        }}
      >
        <DialogTitle style={{ 
          color: 'var(--text-primary)',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Download />
          Update Available
        </DialogTitle>
        
        <DialogContent style={{ padding: '24px' }}>
          {updateInfo && (
            <Box>
              <Typography variant="h6" style={{ 
                color: 'var(--accent-primary)', 
                marginBottom: '8px' 
              }}>
                Version {updateInfo.version}
              </Typography>
              
              {updateInfo.releaseName && (
                <Typography variant="subtitle1" style={{ 
                  color: 'var(--text-secondary)', 
                  marginBottom: '16px' 
                }}>
                  {updateInfo.releaseName}
                </Typography>
              )}
              
              <Typography variant="body2" style={{ 
                color: 'var(--text-secondary)', 
                marginBottom: '16px' 
              }}>
                Released: {new Date(updateInfo.releaseDate).toLocaleDateString()}
              </Typography>
              
              {updateInfo.releaseNotes && (
                <Box style={{ 
                  backgroundColor: 'var(--bg-tertiary)', 
                  padding: '16px', 
                  borderRadius: '4px',
                  marginBottom: '16px',
                  border: '1px solid var(--border-primary)'
                }}>
                  <Typography variant="subtitle2" style={{ 
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Release Notes:
                  </Typography>
                  <Typography variant="body2" style={{ 
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {updateInfo.releaseNotes}
                  </Typography>
                </Box>
              )}
              
              {downloading && (
                <Box style={{ marginTop: '16px' }}>
                  <Typography variant="body2" style={{ 
                    color: 'var(--text-secondary)', 
                    marginBottom: '8px' 
                  }}>
                    Downloading update... {Math.round(downloadProgress)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={downloadProgress}
                    style={{
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-tertiary)'
                    }}
                    sx={{
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'var(--accent-primary)',
                        borderRadius: '4px'
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions style={{ 
          padding: '16px 24px',
          borderTop: '1px solid var(--border-primary)',
          gap: '8px'
        }}>
          <Button
            onClick={handleCloseDialog}
            disabled={downloading}
            style={{
              color: 'var(--text-secondary)',
              textTransform: 'none'
            }}
          >
            {downloading ? 'Downloading...' : 'Later'}
          </Button>
          <Button
            onClick={handleDownloadUpdate}
            disabled={downloading}
            variant="contained"
            startIcon={<Download />}
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-primary)',
              textTransform: 'none'
            }}
          >
            {downloading ? 'Downloading...' : 'Download & Install'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          severity="info"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}