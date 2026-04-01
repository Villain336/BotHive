jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation((opts) => ({ auth: opts?.auth })),
}));

import { parseGitHubUrl, createGitHubClient } from '@/lib/github';

describe('parseGitHubUrl', () => {
  it('parses a standard GitHub URL into owner and repo', () => {
    expect(parseGitHubUrl('https://github.com/owner/repo')).toEqual({
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('strips .git suffix from repo name', () => {
    expect(parseGitHubUrl('https://github.com/owner/repo.git')).toEqual({
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('handles trailing slash in URL', () => {
    expect(parseGitHubUrl('https://github.com/my-org/my-repo/')).toEqual({
      owner: 'my-org',
      repo: 'my-repo',
    });
  });

  it('returns null for non-GitHub URLs', () => {
    expect(parseGitHubUrl('https://gitlab.com/x/y')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(parseGitHubUrl('invalid-url')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseGitHubUrl('')).toBeNull();
  });

  it('works with http protocol', () => {
    expect(parseGitHubUrl('http://github.com/o/r')).toEqual({
      owner: 'o',
      repo: 'r',
    });
  });
});

describe('createGitHubClient', () => {
  it('returns an object (Octokit instance) with the provided auth token', () => {
    const client = createGitHubClient('test-token');
    expect(client).toBeDefined();
    expect(typeof client).toBe('object');
    expect((client as any).auth).toBe('test-token');
  });
});
