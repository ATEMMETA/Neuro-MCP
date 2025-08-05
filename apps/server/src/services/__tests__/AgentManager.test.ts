import { AgentManager } from '../AgentManager';

describe('AgentManager', () => {
  it('should list registered agents', () => {
    const manager = new AgentManager();
    const agents = manager.listAgents();
    expect(agents).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'claude-agent' }),
      expect.objectContaining({ name: 'tmux-agent' }),
    ]));
  });
});
