/**
 * Git Service
 * Handles git operations for project version control
 */

const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

export interface GitFileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export class GitService {
  /**
   * Initialize a git repository in the project directory
   */
  static async initRepo(projectPath: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git init`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Check if directory is a git repository
   * We specifically check for a .git folder in the project directory to avoid
   * detecting parent repositories
   */
  static async isGitRepo(projectPath: string): Promise<boolean> {
    if (!isElectron || !window.electronAPI) {
      return false;
    }

    try {
      // Check if .git directory exists in the project folder
      const result = await window.electronAPI.runCommand(`test -d "${projectPath}/.git" && echo "exists" || echo "not exists"`);
      return result.stdout.trim() === 'exists';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get git status (list of modified/staged files)
   */
  static async getStatus(projectPath: string): Promise<GitFileStatus[]> {
    if (!isElectron || !window.electronAPI) {
      return [];
    }

    try {
      // Use porcelain format for easier parsing
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git status --porcelain`);
      
      if (result.exitCode !== 0) {
        console.error('Git status failed:', result.stderr);
        return [];
      }

      const lines = result.stdout.split('\n').filter(line => line.trim());
      const files: GitFileStatus[] = [];

      for (const line of lines) {
        if (line.length < 4) continue;

        const statusCode = line.substring(0, 2);
        const filePath = line.substring(3);

        let status: GitFileStatus['status'] = 'modified';
        let staged = false;

        // Parse git status codes
        const x = statusCode[0]; // staged status
        const y = statusCode[1]; // unstaged status

        if (x === 'A' || y === 'A') status = 'added';
        if (x === 'D' || y === 'D') status = 'deleted';
        if (x === 'R' || y === 'R') status = 'renamed';
        if (x === '?' && y === '?') status = 'untracked';
        if (x === 'M') status = 'modified';

        staged = x !== ' ' && x !== '?';

        files.push({ path: filePath, status, staged });
      }

      return files;
    } catch (error) {
      console.error('Error getting git status:', error);
      return [];
    }
  }

  /**
   * Get diff for a file
   */
  static async getDiff(projectPath: string, filePath: string, staged: boolean = false): Promise<string> {
    if (!isElectron || !window.electronAPI) {
      return '';
    }

    try {
      console.log('=== getDiff called ===');
      console.log('Project path:', projectPath);
      console.log('File path:', filePath);
      console.log('Staged:', staged);

      // Check file status first
      const statusCmd = `cd "${projectPath}" && git status --porcelain -- "${filePath}"`;
      console.log('Running command:', statusCmd);
      
      const statusResult = await window.electronAPI.runCommand(statusCmd);
      console.log('Status result:', statusResult);
      
      const status = statusResult.stdout.trim();
      console.log('File status:', status);
      
      // For untracked files (??), show full content
      if (status.startsWith('??')) {
        console.log('Untracked file detected, showing full content');
        const contentResult = await window.electronAPI.runCommand(
          `cd "${projectPath}" && cat "${filePath}"`
        );
        if (contentResult.exitCode === 0 && contentResult.stdout) {
          const lines = contentResult.stdout.split('\n');
          return lines.map(line => `+${line}`).join('\n');
        }
        return 'Unable to read file content';
      }
      
      // For added files (A ), show diff --cached
      if (status.startsWith('A ')) {
        console.log('Added file detected, showing cached diff');
        const result = await window.electronAPI.runCommand(
          `cd "${projectPath}" && git diff --cached -- "${filePath}"`
        );
        console.log('Cached diff result:', result);
        if (result.stdout) {
          return result.stdout;
        }
        // If no cached diff, show the file content
        const contentResult = await window.electronAPI.runCommand(
          `cd "${projectPath}" && cat "${filePath}"`
        );
        if (contentResult.exitCode === 0 && contentResult.stdout) {
          const lines = contentResult.stdout.split('\n');
          return lines.map(line => `+${line}`).join('\n');
        }
      }
      
      // For modified files, use appropriate diff command
      const stagedFlag = staged ? '--cached' : '';
      const diffCmd = `cd "${projectPath}" && git diff ${stagedFlag} -- "${filePath}"`;
      console.log('Running diff command:', diffCmd);
      
      const result = await window.electronAPI.runCommand(diffCmd);
      console.log('Diff result:', result);
      console.log('Diff stdout length:', result.stdout?.length || 0);
      console.log('Diff stderr:', result.stderr);
      console.log('Diff exitCode:', result.exitCode);
      
      if (result.stdout && result.stdout.trim()) {
        return result.stdout;
      }
      
      return 'No changes to display (empty diff output)';
    } catch (error) {
      console.error('Error getting diff:', error);
      return 'Error loading diff: ' + (error as Error).message;
    }
  }

  /**
   * Stage a file
   */
  static async stageFile(projectPath: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git add "${filePath}"`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Unstage a file
   */
  static async unstageFile(projectPath: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git reset HEAD "${filePath}"`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Stage all files
   */
  static async stageAll(projectPath: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git add -A`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Commit staged changes
   */
  static async commit(projectPath: string, message: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      // Escape double quotes in commit message
      const escapedMessage = message.replace(/"/g, '\\"');
      const result = await window.electronAPI.runCommand(
        `cd "${projectPath}" && git commit -m "${escapedMessage}"`
      );
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get commit history
   */
  static async getLog(projectPath: string, limit: number = 50): Promise<GitCommit[]> {
    if (!isElectron || !window.electronAPI) {
      return [];
    }

    try {
      // Use custom format for easier parsing
      const format = '%H%n%an%n%ai%n%s%n---END---';
      const result = await window.electronAPI.runCommand(
        `cd "${projectPath}" && git log --format="${format}" -n ${limit}`
      );
      
      if (result.exitCode !== 0) {
        return [];
      }

      const commits: GitCommit[] = [];
      const entries = result.stdout.split('---END---\n').filter(e => e.trim());

      for (const entry of entries) {
        const lines = entry.trim().split('\n');
        if (lines.length >= 4) {
          commits.push({
            hash: lines[0],
            author: lines[1],
            date: lines[2],
            message: lines[3]
          });
        }
      }

      return commits;
    } catch (error) {
      console.error('Error getting git log:', error);
      return [];
    }
  }

  /**
   * Get current branch name
   */
  static async getCurrentBranch(projectPath: string): Promise<string> {
    if (!isElectron || !window.electronAPI) {
      return '';
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git branch --show-current`);
      return result.stdout.trim();
    } catch (error) {
      return '';
    }
  }

  /**
   * Discard changes in a file (restore to last commit)
   */
  static async discardChanges(projectPath: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git checkout -- "${filePath}"`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Amend the last commit with staged changes
   */
  static async amendCommit(projectPath: string, message: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(
        `cd "${projectPath}" && git commit --amend -m "${message.replace(/"/g, '\\"')}"`
      );
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create a default .gitignore file for OakTree projects
   */
  static async createDefaultGitignore(projectPath: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const gitignoreContent = `# Editor directories
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.bak
*~

# Build artifacts (if any)
dist/
build/
`;

      const result = await window.electronAPI.runCommand(
        `cd "${projectPath}" && cat > .gitignore << 'EOF'\n${gitignoreContent}EOF`
      );
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * List all branches
   */
  static async listBranches(projectPath: string): Promise<string[]> {
    if (!isElectron || !window.electronAPI) {
      return [];
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git branch --format="%(refname:short)"`);
      
      if (result.exitCode !== 0) {
        return [];
      }

      return result.stdout
        .split('\n')
        .map(b => b.trim())
        .filter(b => b.length > 0);
    } catch (error) {
      return [];
    }
  }

  /**
   * Create a new branch
   */
  static async createBranch(projectPath: string, branchName: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git branch "${branchName}"`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Switch to a different branch
   */
  static async switchBranch(projectPath: string, branchName: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git checkout "${branchName}"`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete a branch
   */
  static async deleteBranch(projectPath: string, branchName: string, force: boolean = false): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const flag = force ? '-D' : '-d';
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git branch ${flag} "${branchName}"`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get git config value
   */
  static async getConfig(projectPath: string, key: string): Promise<string> {
    if (!isElectron || !window.electronAPI) {
      return '';
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git config ${key}`);
      return result.exitCode === 0 ? result.stdout.trim() : '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Set git config value
   */
  static async setConfig(projectPath: string, key: string, value: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git config ${key} "${value}"`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Add a remote repository
   */
  static async addRemote(projectPath: string, name: string, url: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git remote add ${name} "${url}"`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get list of remotes
   */
  static async getRemotes(projectPath: string): Promise<{ name: string; url: string }[]> {
    if (!isElectron || !window.electronAPI) {
      return [];
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git remote -v`);
      
      if (result.exitCode !== 0) {
        return [];
      }

      const remotes: { name: string; url: string }[] = [];
      const lines = result.stdout.split('\n').filter(line => line.trim());
      const seen = new Set<string>();

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const name = parts[0];
          const url = parts[1];
          const key = `${name}:${url}`;
          
          if (!seen.has(key)) {
            remotes.push({ name, url });
            seen.add(key);
          }
        }
      }

      return remotes;
    } catch (error) {
      return [];
    }
  }

  /**
   * Push to remote
   */
  static async push(projectPath: string, remoteName: string = 'origin', branchName?: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const branch = branchName || await this.getCurrentBranch(projectPath);
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git push ${remoteName} ${branch}`);
      return { success: result.exitCode === 0, error: result.stderr || result.stdout };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Push with upstream tracking
   */
  static async pushSetUpstream(projectPath: string, remoteName: string = 'origin', branchName?: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const branch = branchName || await this.getCurrentBranch(projectPath);
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git push -u ${remoteName} ${branch}`);
      return { success: result.exitCode === 0, error: result.stderr || result.stdout };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Pull from remote
   */
  static async pull(projectPath: string, remoteName: string = 'origin', branchName?: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const branch = branchName || await this.getCurrentBranch(projectPath);
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git pull ${remoteName} ${branch}`);
      return { success: result.exitCode === 0, error: result.stderr || result.stdout };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Fetch from remote
   */
  static async fetch(projectPath: string, remoteName: string = 'origin'): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git fetch ${remoteName}`);
      return { success: result.exitCode === 0, error: result.stderr || result.stdout };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get commit details (files changed in a commit)
   */
  static async getCommitDetails(projectPath: string, commitHash: string): Promise<{ files: string[]; diff: string }> {
    if (!isElectron || !window.electronAPI) {
      return { files: [], diff: '' };
    }

    try {
      // Get list of files
      const filesResult = await window.electronAPI.runCommand(
        `cd "${projectPath}" && git show --pretty="" --name-only ${commitHash}`
      );
      
      const files = filesResult.exitCode === 0 
        ? filesResult.stdout.split('\n').filter(f => f.trim())
        : [];

      // Get full diff
      const diffResult = await window.electronAPI.runCommand(
        `cd "${projectPath}" && git show ${commitHash}`
      );
      
      const diff = diffResult.exitCode === 0 ? diffResult.stdout : '';

      return { files, diff };
    } catch (error) {
      return { files: [], diff: '' };
    }
  }

  /**
   * Stash current changes
   */
  static async stash(projectPath: string, message?: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const cmd = message 
        ? `cd "${projectPath}" && git stash push -m "${message}"`
        : `cd "${projectPath}" && git stash`;
      const result = await window.electronAPI.runCommand(cmd);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Apply most recent stash
   */
  static async stashPop(projectPath: string): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git stash pop`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * List all stashes
   */
  static async getStashes(projectPath: string): Promise<{ index: number; message: string }[]> {
    if (!isElectron || !window.electronAPI) {
      return [];
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git stash list`);
      
      if (result.exitCode !== 0) {
        return [];
      }

      const stashes: { index: number; message: string }[] = [];
      const lines = result.stdout.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const match = line.match(/^stash@\{(\d+)\}:\s*(.+)$/);
        if (match) {
          stashes.push({
            index: parseInt(match[1]),
            message: match[2]
          });
        }
      }

      return stashes;
    } catch (error) {
      return [];
    }
  }

  /**
   * Apply specific stash by index
   */
  static async stashApply(projectPath: string, index: number): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git stash apply stash@{${index}}`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Drop specific stash by index
   */
  static async stashDrop(projectPath: string, index: number): Promise<{ success: boolean; error?: string }> {
    if (!isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const result = await window.electronAPI.runCommand(`cd "${projectPath}" && git stash drop stash@{${index}}`);
      return { success: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
