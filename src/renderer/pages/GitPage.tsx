import React, { useState, useEffect, useCallback } from 'react';
import { GitService, GitFileStatus, GitCommit } from '../services/gitService';

interface GitPageProps {
  currentProject: string;
  projectName: string;
}

const GitPage: React.FC<GitPageProps> = ({ currentProject, projectName }) => {
  const [isGitRepo, setIsGitRepo] = useState(false);
  const [files, setFiles] = useState<GitFileStatus[]>([]);
  const [selectedFile, setSelectedFile] = useState<GitFileStatus | null>(null);
  const [diff, setDiff] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('');
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [currentBranch, setCurrentBranch] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'changes' | 'history' | 'settings' | 'stashes'>('changes');
  const [loading, setLoading] = useState(false);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [amendMode, setAmendMode] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  
  // Settings state
  const [gitUserName, setGitUserName] = useState('');
  const [gitUserEmail, setGitUserEmail] = useState('');
  const [remotes, setRemotes] = useState<{ name: string; url: string }[]>([]);
  const [newRemoteName, setNewRemoteName] = useState('origin');
  const [newRemoteUrl, setNewRemoteUrl] = useState('');
  
  // Commit details state
  const [selectedCommit, setSelectedCommit] = useState<GitCommit | null>(null);
  const [commitDetails, setCommitDetails] = useState<{ files: string[]; diff: string } | null>(null);
  
  // Stash state
  const [stashes, setStashes] = useState<{ index: number; message: string }[]>([]);
  const [stashMessage, setStashMessage] = useState('');

  console.log('[GitPage] Rendered with currentProject:', currentProject, 'projectName:', projectName);

  // Check if project is a git repo
  useEffect(() => {
    const checkGitRepo = async () => {
      if (!currentProject) {
        console.log('[GitPage] No currentProject, skipping git check');
        return;
      }
      console.log('[GitPage] Checking git repo at:', currentProject);
      const isRepo = await GitService.isGitRepo(currentProject);
      console.log('[GitPage] isGitRepo:', isRepo);
      setIsGitRepo(isRepo);
      
      if (isRepo) {
        await refreshStatus();
        await refreshHistory();
        await refreshBranches();
        await loadGitConfig();
        await loadRemotes();
        await loadStashes();
        const branch = await GitService.getCurrentBranch(currentProject);
        setCurrentBranch(branch);
      }
    };
    checkGitRepo();
  }, [currentProject]);

  const refreshStatus = useCallback(async () => {
    if (!currentProject) return;
    const status = await GitService.getStatus(currentProject);
    setFiles(status);
  }, [currentProject]);

  const refreshHistory = useCallback(async () => {
    if (!currentProject) return;
    const log = await GitService.getLog(currentProject, 50);
    setCommits(log);
  }, [currentProject]);

  const refreshBranches = useCallback(async () => {
    if (!currentProject) return;
    const branchList = await GitService.listBranches(currentProject);
    setBranches(branchList);
  }, [currentProject]);

  const loadGitConfig = useCallback(async () => {
    if (!currentProject) return;
    const userName = await GitService.getConfig(currentProject, 'user.name');
    const userEmail = await GitService.getConfig(currentProject, 'user.email');
    setGitUserName(userName);
    setGitUserEmail(userEmail);
  }, [currentProject]);

  const loadRemotes = useCallback(async () => {
    if (!currentProject) return;
    const remoteList = await GitService.getRemotes(currentProject);
    setRemotes(remoteList);
  }, [currentProject]);

  const loadStashes = useCallback(async () => {
    if (!currentProject) return;
    const stashList = await GitService.getStashes(currentProject);
    setStashes(stashList);
  }, [currentProject]);

  const handleInitRepo = async () => {
    setLoading(true);
    const result = await GitService.initRepo(currentProject);
    if (result.success) {
      // Create default .gitignore
      await GitService.createDefaultGitignore(currentProject);
      
      setIsGitRepo(true);
      await refreshStatus();
      await refreshBranches();
      const branch = await GitService.getCurrentBranch(currentProject);
      setCurrentBranch(branch || 'main');
    } else {
      alert('Failed to initialize git repository: ' + result.error);
    }
    setLoading(false);
  };

  const handleFileClick = async (file: GitFileStatus) => {
    setSelectedFile(file);
    setLoadingDiff(true);
    setDiff('');
    console.log('Fetching diff for:', file.path, 'staged:', file.staged, 'status:', file.status);
    try {
      const fileDiff = await GitService.getDiff(currentProject, file.path, file.staged);
      console.log('Diff result length:', fileDiff.length);
      setDiff(fileDiff);
    } catch (error) {
      console.error('Error fetching diff:', error);
      setDiff('Error loading diff');
    } finally {
      setLoadingDiff(false);
    }
  };

  const handleStage = async (file: GitFileStatus) => {
    setLoading(true);
    const result = await GitService.stageFile(currentProject, file.path);
    if (result.success) {
      await refreshStatus();
      // Reload diff if this file is selected
      if (selectedFile?.path === file.path) {
        const updatedFile = { ...file, staged: true };
        setSelectedFile(updatedFile);
        setLoadingDiff(true);
        const fileDiff = await GitService.getDiff(currentProject, file.path, true);
        setDiff(fileDiff);
        setLoadingDiff(false);
      }
    } else {
      alert('Failed to stage file: ' + result.error);
    }
    setLoading(false);
  };

  const handleUnstage = async (file: GitFileStatus) => {
    setLoading(true);
    const result = await GitService.unstageFile(currentProject, file.path);
    if (result.success) {
      await refreshStatus();
      // Reload diff if this file is selected
      if (selectedFile?.path === file.path) {
        const updatedFile = { ...file, staged: false };
        setSelectedFile(updatedFile);
        setLoadingDiff(true);
        const fileDiff = await GitService.getDiff(currentProject, file.path, false);
        setDiff(fileDiff);
        setLoadingDiff(false);
      }
    } else {
      alert('Failed to unstage file: ' + result.error);
    }
    setLoading(false);
  };

  const handleStageAll = async () => {
    setLoading(true);
    const result = await GitService.stageAll(currentProject);
    if (result.success) {
      await refreshStatus();
      setSelectedFile(null);
      setDiff('');
    } else {
      alert('Failed to stage all files: ' + result.error);
    }
    setLoading(false);
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      alert('Please enter a commit message');
      return;
    }

    setLoading(true);
    const result = amendMode 
      ? await GitService.amendCommit(currentProject, commitMessage)
      : await GitService.commit(currentProject, commitMessage);
      
    if (result.success) {
      setCommitMessage('');
      setAmendMode(false);
      await refreshStatus();
      await refreshHistory();
      setSelectedFile(null);
      setDiff('');
      alert(amendMode ? 'Commit amended successfully!' : 'Changes committed successfully!');
    } else {
      alert('Failed to commit: ' + result.error);
    }
    setLoading(false);
  };

  const handleDiscard = async (file: GitFileStatus) => {
    if (!confirm(`Are you sure you want to discard changes in ${file.path}? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    const result = await GitService.discardChanges(currentProject, file.path);
    if (result.success) {
      await refreshStatus();
      if (selectedFile?.path === file.path) {
        setSelectedFile(null);
        setDiff('');
      }
    } else {
      alert('Failed to discard changes: ' + result.error);
    }
    setLoading(false);
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      alert('Please enter a branch name');
      return;
    }

    setLoading(true);
    const result = await GitService.createBranch(currentProject, newBranchName);
    if (result.success) {
      await refreshBranches();
      setNewBranchName('');
      alert(`Branch '${newBranchName}' created successfully!`);
    } else {
      alert('Failed to create branch: ' + result.error);
    }
    setLoading(false);
  };

  const handleSwitchBranch = async (branchName: string) => {
    if (branchName === currentBranch) {
      return;
    }

    setLoading(true);
    const result = await GitService.switchBranch(currentProject, branchName);
    if (result.success) {
      setCurrentBranch(branchName);
      await refreshStatus();
      await refreshHistory();
      setShowBranchMenu(false);
      setSelectedFile(null);
      setDiff('');
    } else {
      alert('Failed to switch branch: ' + result.error);
    }
    setLoading(false);
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (branchName === currentBranch) {
      alert('Cannot delete the current branch');
      return;
    }

    if (!confirm(`Are you sure you want to delete branch '${branchName}'?`)) {
      return;
    }

    setLoading(true);
    const result = await GitService.deleteBranch(currentProject, branchName);
    if (result.success) {
      await refreshBranches();
    } else {
      alert('Failed to delete branch: ' + result.error);
    }
    setLoading(false);
  };

  const handleSaveGitConfig = async () => {
    if (!gitUserName.trim() || !gitUserEmail.trim()) {
      alert('Please enter both name and email');
      return;
    }

    setLoading(true);
    const nameResult = await GitService.setConfig(currentProject, 'user.name', gitUserName);
    const emailResult = await GitService.setConfig(currentProject, 'user.email', gitUserEmail);
    
    if (nameResult.success && emailResult.success) {
      alert('Git configuration saved!');
    } else {
      alert('Failed to save configuration');
    }
    setLoading(false);
  };

  const handleAddRemote = async () => {
    if (!newRemoteName.trim() || !newRemoteUrl.trim()) {
      alert('Please enter both remote name and URL');
      return;
    }

    setLoading(true);
    const result = await GitService.addRemote(currentProject, newRemoteName, newRemoteUrl);
    if (result.success) {
      await loadRemotes();
      setNewRemoteName('origin');
      setNewRemoteUrl('');
      alert(`Remote '${newRemoteName}' added successfully!`);
    } else {
      alert('Failed to add remote: ' + result.error);
    }
    setLoading(false);
  };

  const handlePush = async () => {
    if (remotes.length === 0) {
      alert('Please add a remote first');
      return;
    }

    setLoading(true);
    const result = await GitService.pushSetUpstream(currentProject);
    if (result.success) {
      alert('Pushed successfully!');
    } else {
      alert('Failed to push: ' + result.error);
    }
    setLoading(false);
  };

  const handlePull = async () => {
    if (remotes.length === 0) {
      alert('Please add a remote first');
      return;
    }

    setLoading(true);
    const result = await GitService.pull(currentProject);
    if (result.success) {
      await refreshStatus();
      await refreshHistory();
      alert('Pulled successfully!');
    } else {
      alert('Failed to pull: ' + result.error);
    }
    setLoading(false);
  };

  const handleCommitClick = async (commit: GitCommit) => {
    setSelectedCommit(commit);
    setLoading(true);
    const details = await GitService.getCommitDetails(currentProject, commit.hash);
    setCommitDetails(details);
    setLoading(false);
  };

  const handleStashSave = async () => {
    setLoading(true);
    const result = await GitService.stash(currentProject, stashMessage || undefined);
    if (result.success) {
      await refreshStatus();
      await loadStashes();
      setStashMessage('');
      alert('Changes stashed successfully!');
    } else {
      alert('Failed to stash: ' + result.error);
    }
    setLoading(false);
  };

  const handleStashPop = async () => {
    setLoading(true);
    const result = await GitService.stashPop(currentProject);
    if (result.success) {
      await refreshStatus();
      await loadStashes();
      alert('Stash applied successfully!');
    } else {
      alert('Failed to apply stash: ' + result.error);
    }
    setLoading(false);
  };

  const handleStashApply = async (index: number) => {
    setLoading(true);
    const result = await GitService.stashApply(currentProject, index);
    if (result.success) {
      await refreshStatus();
      alert('Stash applied successfully!');
    } else {
      alert('Failed to apply stash: ' + result.error);
    }
    setLoading(false);
  };

  const handleStashDrop = async (index: number) => {
    if (!confirm('Are you sure you want to delete this stash?')) {
      return;
    }

    setLoading(true);
    const result = await GitService.stashDrop(currentProject, index);
    if (result.success) {
      await loadStashes();
      alert('Stash deleted successfully!');
    } else {
      alert('Failed to delete stash: ' + result.error);
    }
    setLoading(false);
  };

  const stagedFiles = files.filter(f => f.staged);
  const unstagedFiles = files.filter(f => !f.staged);

  if (!isGitRepo) {
    return (
      <div className="git-page">
        <div className="git-init-container">
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Version Control</h2>
          <p>This project is not yet under version control.</p>
          <p>Initialize a git repository to track changes to your project files.</p>
          <button 
            onClick={handleInitRepo}
            disabled={loading}
          >
            {loading ? 'Initializing...' : 'Initialize Git Repository'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="git-page">
      <div className="git-header">
        <h2>Version Control - {projectName}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          {currentBranch && (
            <div style={{ position: 'relative' }}>
              <button
                className="branch-button"
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <span>⎇ {currentBranch}</span>
                <span style={{ fontSize: '10px' }}>▾</span>
              </button>
              
              {showBranchMenu && (
                <div className="branch-menu">
                  <div className="branch-menu-section">
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px', fontWeight: 600 }}>
                      BRANCHES
                    </div>
                    {branches.map(branch => (
                      <div key={branch} className="branch-menu-item">
                        <button
                          onClick={() => handleSwitchBranch(branch)}
                          disabled={branch === currentBranch}
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            padding: '6px 8px',
                            background: branch === currentBranch ? 'var(--accent-primary)' : 'transparent',
                            color: branch === currentBranch ? 'white' : 'var(--text-primary)',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: branch === currentBranch ? 'default' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {branch === currentBranch ? '✓ ' : ''}{branch}
                        </button>
                        {branch !== currentBranch && (
                          <button
                            onClick={() => handleDeleteBranch(branch)}
                            className="branch-delete-btn"
                            title="Delete branch"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="branch-menu-section" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px', fontWeight: 600 }}>
                      CREATE NEW BRANCH
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                        placeholder="branch-name"
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          fontSize: '12px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '3px',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <button
                        onClick={handleCreateBranch}
                        disabled={!newBranchName.trim() || loading}
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          background: 'var(--accent-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {remotes.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePull}
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                ↓ Pull
              </button>
              <button
                onClick={handlePush}
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                ↑ Push
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="git-tabs">
        <button 
          className={`git-tab ${activeTab === 'changes' ? 'active' : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          Changes
        </button>
        <button 
          className={`git-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button 
          className={`git-tab ${activeTab === 'stashes' ? 'active' : ''}`}
          onClick={() => setActiveTab('stashes')}
        >
          Stashes
        </button>
        <button 
          className={`git-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {activeTab === 'changes' && (
        <div className="git-content">
          <div className="git-split-view">
            <div className="git-file-list">
              {files.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No changes</p>
                </div>
              ) : (
                <>
                  {stagedFiles.length > 0 && (
                    <div className="git-section">
                      <div className="git-section-header">
                        Staged Changes ({stagedFiles.length})
                      </div>
                      {stagedFiles.map(file => (
                        <div 
                          key={file.path}
                          className={`file-item ${selectedFile?.path === file.path ? 'selected' : ''}`}
                          onClick={() => handleFileClick(file)}
                        >
                          <span className="file-item-name">{file.path}</span>
                          <div className="file-item-actions">
                            <span className={`file-item-status ${file.status}`}>
                              {file.status[0].toUpperCase()}
                            </span>
                            <button 
                              className="file-item-btn"
                              onClick={(e) => { e.stopPropagation(); handleUnstage(file); }}
                              title="Unstage"
                            >
                              −
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {unstagedFiles.length > 0 && (
                    <div className="git-section">
                      <div className="git-section-header">
                        Changes ({unstagedFiles.length})
                        {unstagedFiles.length > 0 && (
                          <button 
                            className="file-item-btn"
                            onClick={handleStageAll}
                            disabled={loading}
                            style={{ marginLeft: 'auto' }}
                          >
                            Stage All
                          </button>
                        )}
                      </div>
                      {unstagedFiles.map(file => (
                        <div 
                          key={file.path}
                          className={`file-item ${selectedFile?.path === file.path ? 'selected' : ''}`}
                          onClick={() => handleFileClick(file)}
                        >
                          <span className="file-item-name">{file.path}</span>
                          <div className="file-item-actions">
                            <span className={`file-item-status ${file.status}`}>
                              {file.status[0].toUpperCase()}
                            </span>
                            {file.status !== 'untracked' && (
                              <button 
                                className="file-item-btn file-item-btn-danger"
                                onClick={(e) => { e.stopPropagation(); handleDiscard(file); }}
                                title="Discard changes"
                              >
                                ↺
                              </button>
                            )}
                            <button 
                              className="file-item-btn"
                              onClick={(e) => { e.stopPropagation(); handleStage(file); }}
                              title="Stage"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {stagedFiles.length > 0 && (
                    <div className="commit-form">
                      <textarea 
                        placeholder="Commit message..."
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        rows={3}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={amendMode}
                            onChange={(e) => setAmendMode(e.target.checked)}
                          />
                          Amend last commit
                        </label>
                        <button 
                          onClick={handleCommit}
                          disabled={loading || !commitMessage.trim()}
                          style={{ marginLeft: 'auto' }}
                        >
                          {loading ? 'Committing...' : amendMode ? 'Amend Commit' : 'Commit'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="diff-viewer">
              {selectedFile ? (
                <>
                  <div style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid var(--border-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'var(--bg-tertiary)'
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{selectedFile.path}</span>
                    <span className={`file-item-status ${selectedFile.status}`}>
                      {selectedFile.status}
                    </span>
                  </div>
                  {loadingDiff ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 'calc(100% - 48px)',
                      color: 'var(--text-secondary)'
                    }}>
                      Loading diff...
                    </div>
                  ) : (
                    <pre style={{
                      margin: 0,
                      padding: '16px',
                      fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                      fontSize: '12px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      color: 'var(--text-primary)'
                    }}>
                      {diff || 'No changes to display'}
                    </pre>
                  )}
                </>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-secondary)'
                }}>
                  Select a file to view changes
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="git-content">
          {commits.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-secondary)'
            }}>
              <p>No commits yet</p>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                Make your first commit to see history here
              </p>
            </div>
          ) : selectedCommit && commitDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid var(--border-primary)',
                background: 'var(--bg-tertiary)'
              }}>
                <button
                  onClick={() => { setSelectedCommit(null); setCommitDetails(null); }}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '3px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginBottom: '8px'
                  }}
                >
                  ← Back to commits
                </button>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                  {selectedCommit.hash.substring(0, 7)} • {selectedCommit.author} • {new Date(selectedCommit.date).toLocaleString()}
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{selectedCommit.message}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                  {commitDetails.files.length} file(s) changed
                </div>
              </div>
              <pre style={{
                margin: 0,
                padding: '16px',
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                fontSize: '12px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                color: 'var(--text-primary)',
                flex: 1,
                overflow: 'auto'
              }}>
                {commitDetails.diff}
              </pre>
            </div>
          ) : (
            <div className="commit-list">
              {commits.map(commit => (
                <div 
                  key={commit.hash} 
                  className="commit-item"
                  onClick={() => handleCommitClick(commit)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    alignItems: 'center',
                    marginBottom: '6px'
                  }}>
                    <span className="commit-hash">{commit.hash.substring(0, 7)}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {commit.author}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                      {new Date(commit.date).toLocaleString()}
                    </span>
                  </div>
                  <div className="commit-message">{commit.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stashes' && (
        <div className="git-content">
          <div style={{ padding: '20px', maxWidth: '800px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Stash Changes</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
              Temporarily save your uncommitted changes to work on something else.
            </p>
            
            {files.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={stashMessage}
                    onChange={(e) => setStashMessage(e.target.value)}
                    placeholder="Stash message (optional)"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    onClick={handleStashSave}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      background: 'var(--accent-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Stash Changes
                  </button>
                </div>
              </div>
            )}

            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Saved Stashes</h3>
            {stashes.length === 0 ? (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center',
                color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px'
              }}>
                No stashes saved
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stashes.map(stash => (
                  <div
                    key={stash.index}
                    style={{
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                        stash@{'{' + stash.index + '}'}
                      </div>
                      <div style={{ fontSize: '13px' }}>{stash.message}</div>
                    </div>
                    <button
                      onClick={() => handleStashApply(stash.index)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => handleStashDrop(stash.index)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: 'transparent',
                        color: 'var(--text-tertiary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {stashes.length > 0 && (
                  <button
                    onClick={handleStashPop}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      background: 'var(--accent-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    Pop Latest Stash
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="git-content">
          <div style={{ padding: '20px', maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Git Configuration</h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                User Name
              </label>
              <input
                type="text"
                value={gitUserName}
                onChange={(e) => setGitUserName(e.target.value)}
                placeholder="Your Name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}
              />
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                User Email
              </label>
              <input
                type="email"
                value={gitUserEmail}
                onChange={(e) => setGitUserEmail(e.target.value)}
                placeholder="your.email@example.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}
              />
              <button
                onClick={handleSaveGitConfig}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save Configuration
              </button>
            </div>

            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Remote Repositories</h3>
            {remotes.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                {remotes.map(remote => (
                  <div
                    key={remote.name}
                    style={{
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      {remote.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                      {remote.url}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                Remote Name
              </label>
              <input
                type="text"
                value={newRemoteName}
                onChange={(e) => setNewRemoteName(e.target.value)}
                placeholder="origin"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}
              />
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                Remote URL
              </label>
              <input
                type="text"
                value={newRemoteUrl}
                onChange={(e) => setNewRemoteUrl(e.target.value)}
                placeholder="https://github.com/username/repo.git"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}
              />
              <button
                onClick={handleAddRemote}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add Remote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitPage;
