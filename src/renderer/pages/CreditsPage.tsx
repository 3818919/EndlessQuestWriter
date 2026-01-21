import React from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';

interface CreditsPageProps {
  theme: 'dark' | 'light';
}

const CreditsPage: React.FC<CreditsPageProps> = ({ theme }) => {
  const openExternalLink = (url: string) => {
    if (window.electronAPI) {
      // Use shell.openExternal via IPC if available
      window.open(url, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'auto'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '8px',
          color: 'var(--text-primary)'
        }}>
          Endless Quest Writer
        </h1>
        
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginBottom: '40px'
        }}>
          A visual editor for Endless Online quest files
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Original Project Credit */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid var(--border-primary)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              Original Project
            </h2>
            
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              lineHeight: '1.6'
            }}>
              This application is forked from <strong style={{ color: 'var(--text-primary)' }}>OakTree</strong>, 
              a comprehensive Endless Online pub editor created by <strong style={{ color: 'var(--text-primary)' }}>CoderDan</strong>.
            </p>
            
            <button
              onClick={() => openExternalLink('https://github.com/do4k/OakTree')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.borderColor = 'var(--border-primary)';
              }}
            >
              <GitHubIcon style={{ fontSize: '20px' }} />
              View OakTree on GitHub
              <OpenInNewIcon style={{ fontSize: '16px', opacity: 0.7 }} />
            </button>
          </div>

          {/* Quest Editor Credit */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid var(--border-primary)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              Quest Editor Modifications
            </h2>
            
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              lineHeight: '1.6'
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Endless Quest Writer</strong> was 
              adapted and modified by <strong style={{ color: 'var(--text-primary)' }}>Vexx</strong> to 
              focus specifically on quest editing with enhanced visual tools and external configuration support.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => openExternalLink('https://vexx.info/')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                }}
              >
                <LanguageIcon style={{ fontSize: '20px' }} />
                Visit Vexx's Website
                <OpenInNewIcon style={{ fontSize: '16px', opacity: 0.7 }} />
              </button>
              
              <button
                onClick={() => openExternalLink('https://github.com/3818919/EndlessQuestWriter')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                }}
              >
                <GitHubIcon style={{ fontSize: '20px' }} />
                View Project on GitHub
                <OpenInNewIcon style={{ fontSize: '16px', opacity: 0.7 }} />
              </button>
            </div>
          </div>

          {/* Additional Credits */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid var(--border-primary)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              Technologies & Resources
            </h2>
            
            <ul style={{
              textAlign: 'left',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.8',
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li>• <strong style={{ color: 'var(--text-primary)' }}>Electron</strong> - Desktop application framework</li>
              <li>• <strong style={{ color: 'var(--text-primary)' }}>React</strong> - UI framework</li>
              <li>• <strong style={{ color: 'var(--text-primary)' }}>Monaco Editor</strong> - Code editor component</li>
              <li>• <strong style={{ color: 'var(--text-primary)' }}>React Flow</strong> - Visual flow diagram editor</li>
              <li>• <strong style={{ color: 'var(--text-primary)' }}>Material UI Icons</strong> - Icon library</li>
              <li>• File format specifications from EndlessClient</li>
            </ul>
          </div>
        </div>

        <p style={{
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          marginTop: '32px'
        }}>
          Licensed under MIT License
        </p>
      </div>
    </div>
  );
};

export default CreditsPage;
