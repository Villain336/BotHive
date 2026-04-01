import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CodeSuggestion } from '@/components/chat/code-suggestion';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock fetch for apply button
global.fetch = jest.fn();

describe('CodeSuggestion', () => {
  const defaultProps = {
    filePath: 'src/utils.ts',
    content: 'export function add(a: number, b: number) { return a + b; }',
    description: 'Add utility function',
    language: 'typescript',
    projectId: 'proj-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders file path', () => {
    render(<CodeSuggestion {...defaultProps} />);
    expect(screen.getByText('src/utils.ts')).toBeInTheDocument();
  });

  it('renders language badge', () => {
    render(<CodeSuggestion {...defaultProps} />);
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('renders code content', () => {
    render(<CodeSuggestion {...defaultProps} />);
    expect(screen.getByText(/export function add/)).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<CodeSuggestion {...defaultProps} />);
    expect(screen.getByText('Add utility function')).toBeInTheDocument();
  });

  it('copy button copies content to clipboard', async () => {
    render(<CodeSuggestion {...defaultProps} />);
    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.content);
  });

  it('apply fix button exists', () => {
    render(<CodeSuggestion {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Apply Fix/i })).toBeInTheDocument();
  });

  it('shows success state after successful apply', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { branch: 'shipready/fix-123', pr_url: 'https://github.com/test/pr/1' } }),
    });

    render(<CodeSuggestion {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Apply Fix/i }));

    await waitFor(() => {
      expect(screen.getByText(/shipready\/fix-123/)).toBeInTheDocument();
    });
  });

  it('shows error state after failed apply', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'GitHub connection failed' }),
    });

    render(<CodeSuggestion {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Apply Fix/i }));

    await waitFor(() => {
      expect(screen.getByText(/GitHub connection failed/)).toBeInTheDocument();
    });
  });
});
