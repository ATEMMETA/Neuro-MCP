// src/services/TmuxOrchestrator.test.ts
import { TmuxOrchestrator } from './TmuxOrchestrator';
import { exec } from 'child_process';
import { promisify } from 'util';

// Jest needs to be told to mock the `exec` function from 'child_process'
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

const mockExec = exec as jest.MockedFunction<typeof exec>;

describe('TmuxOrchestrator', () => {
  let orchestrator: TmuxOrchestrator;

  beforeEach(() => {
    orchestrator = new TmuxOrchestrator();
    // Reset the mock before each test
    mockExec.mockClear();
  });

  it('should create a new tmux session', async () => {
    // Mock the shell command to succeed
    mockExec.mockImplementationOnce((command, callback) => callback(null, { stdout: '', stderr: '' }));

    await orchestrator.createSession('test-session');
    
    // Assert that the correct shell command was called
    expect(mockExec).toHaveBeenCalledWith('tmux new-session -d -s test-session', expect.any(Function));
  });

  it('should run an AI task in a session and capture output', async () => {
    // Mock the two shell commands that will be called
    mockExec.mockImplementationOnce((command, callback) => callback(null, { stdout: '', stderr: '' })); // tmux send-keys
    mockExec.mockImplementationOnce((command, callback) => callback(null, { stdout: 'Mocked AI response', stderr: '' })); // tmux capture-pane

    const result = await orchestrator.runAITask('test-session', { prompt: 'What is the capital of France?' });

    // Assert that the command for sending keys was called correctly
    expect(mockExec).toHaveBeenCalledWith('tmux send-keys -t test-session:0 \'echo "What is the capital of France?" | mock-ai\' C-m', expect.any(Function));
    
    // Assert that the result is what we mocked
    expect(result.output).toBe('Mocked AI response');
  });

  it('should throw an error if tmux session creation fails', async () => {
    // Mock the shell command to fail
    mockExec.mockImplementationOnce((command, callback) => callback(new Error('tmux command not found'), { stdout: '', stderr: '' }));

    await expect(orchestrator.createSession('fail-session')).rejects.toThrow('Failed to create session: tmux command not found');
  });
});
