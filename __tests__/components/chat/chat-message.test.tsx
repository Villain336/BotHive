import { render, screen } from '@testing-library/react';
import { ChatMessage } from '@/components/chat/chat-message';
import type { ChatBlock } from '@/components/chat/chat-interface';

// Mock react-markdown since it uses ESM
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown">{children}</div>;
  };
});

jest.mock('remark-gfm', () => () => {});

describe('ChatMessage', () => {
  it('renders user message with text content', () => {
    const blocks: ChatBlock[] = [
      { id: '1', type: 'text', content: 'Hello AI' },
    ];
    render(<ChatMessage role="user" blocks={blocks} projectId="p1" />);
    expect(screen.getByText('Hello AI')).toBeInTheDocument();
  });

  it('renders assistant text block with markdown', () => {
    const blocks: ChatBlock[] = [
      { id: '1', type: 'text', content: 'Here is the fix' },
    ];
    render(<ChatMessage role="assistant" blocks={blocks} projectId="p1" />);
    expect(screen.getByTestId('markdown')).toBeInTheDocument();
    expect(screen.getByText('Here is the fix')).toBeInTheDocument();
  });

  it('renders tool_start block as ToolStatus', () => {
    const blocks: ChatBlock[] = [
      {
        id: '1',
        type: 'tool_start',
        content: '',
        metadata: { tool: 'read_file', input: { file_path: 'index.ts' }, status: 'running' },
      },
    ];
    render(<ChatMessage role="assistant" blocks={blocks} projectId="p1" />);
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('index.ts')).toBeInTheDocument();
  });

  it('renders code_suggestion block as CodeSuggestion', () => {
    const blocks: ChatBlock[] = [
      {
        id: '1',
        type: 'code_suggestion',
        content: 'const x = 1;',
        metadata: { file_path: 'src/test.ts', description: 'Add variable', language: 'typescript' },
      },
    ];
    render(<ChatMessage role="assistant" blocks={blocks} projectId="p1" />);
    expect(screen.getByText('src/test.ts')).toBeInTheDocument();
    expect(screen.getByText('Add variable')).toBeInTheDocument();
  });

  it('renders applied_fix block with success indicator', () => {
    const blocks: ChatBlock[] = [
      {
        id: '1',
        type: 'applied_fix',
        content: '',
        metadata: { file_path: 'src/fix.ts', branch: 'shipready/fix-1', pr_url: 'https://github.com/test/1' },
      },
    ];
    render(<ChatMessage role="assistant" blocks={blocks} projectId="p1" />);
    expect(screen.getByText(/shipready\/fix-1/)).toBeInTheDocument();
    expect(screen.getByText(/View PR/)).toBeInTheDocument();
  });

  it('shows streaming cursor when isStreaming and last block is empty', () => {
    const blocks: ChatBlock[] = [];
    const { container } = render(
      <ChatMessage role="assistant" blocks={blocks} projectId="p1" isStreaming />
    );
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
