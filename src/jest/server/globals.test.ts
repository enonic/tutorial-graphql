import {describe, expect, it} from '@jest/globals';


describe('server test environment', () => {
  it('provides the mocked XP globals', () => {
    expect(app.name).toBe('com.example.gqltutorial');
    expect(typeof log.info).toBe('function');
  });
});
