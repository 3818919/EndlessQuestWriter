import React, { useEffect, useState } from 'react';
import { LinearProgress, Box, Typography, CircularProgress } from '@mui/material';

interface SplashScreenProps {
  isVisible: boolean;
  status: string;
  progress: number;
  onComplete?: () => void;
}

export default function SplashScreen({ isVisible, status, progress, onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (progress >= 100 && onComplete) {
      setFadeOut(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [progress, onComplete]);

  if (!isVisible && !fadeOut) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease-out'
      }}
    >
      {/* App Icon */}
      <div
        style={{
          width: '128px',
          height: '128px',
          marginBottom: '32px',
          backgroundImage: 'url(icon.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      />

      {/* App Title */}
      <Typography
        variant="h4"
        component="h1"
        style={{
          color: 'var(--text-primary)',
          marginBottom: '8px',
          fontWeight: 600,
          textAlign: 'center'
        }}
      >
        Endless Quest Writer
      </Typography>

      <Typography
        variant="subtitle1"
        style={{
          color: 'var(--text-secondary)',
          marginBottom: '48px',
          textAlign: 'center'
        }}
      >
        Visual Editor for Endless Online Quest Files
      </Typography>

      {/* Loading Section */}
      <Box
        style={{
          width: '400px',
          maxWidth: '90vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Status Text */}
        <Typography
          variant="body2"
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            textAlign: 'center',
            minHeight: '20px'
          }}
        >
          {status}
        </Typography>

        {/* Progress Bar or Spinner */}
        {progress >= 0 ? (
          <Box style={{ width: '100%', marginBottom: '16px' }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(progress, 100)}
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
            <Typography
              variant="caption"
              style={{
                color: 'var(--text-tertiary)',
                display: 'block',
                textAlign: 'center',
                marginTop: '8px'
              }}
            >
              {Math.round(progress)}%
            </Typography>
          </Box>
        ) : (
          <Box style={{ marginBottom: '32px' }}>
            <CircularProgress
              size={32}
              style={{
                color: 'var(--accent-primary)'
              }}
            />
          </Box>
        )}

        {/* Version Info */}
        <Typography
          variant="caption"
          style={{
            color: 'var(--text-tertiary)',
            textAlign: 'center'
          }}
        >
          Version 1.0.0
        </Typography>
      </Box>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          textAlign: 'center'
        }}
      >
        <Typography
          variant="caption"
          style={{
            color: 'var(--text-tertiary)'
          }}
        >
          Made with ❤️ for the Endless Online community
        </Typography>
      </div>
    </div>
  );
}