import { render, screen, fireEvent } from '@testing-library/react';
import { ToolStatus } from '@/components/chat/tool-status';

describe('ToolStatus', () => {
  it('shows spinner when status is running', () => {
    render(<ToolStatus tool="read_file" status="running" />);
    // Loader2 renders as an SVG with animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows check icon when status is done', () => {
    render(<ToolStatus tool="read_file" status="done" result="file contents" />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeInTheDocument();
  });

  it('displays tool name', () => {
    render(<ToolStatus tool="read_file" status="running" />);
    expect(screen.getByText('Reading')).toBeInTheDocument();
  });

  it('displays input summary for file path', () => {
    render(
      <ToolStatus
        tool="read_file"
        status="running"
        input={{ file_path: 'src/index.ts' }}
      />
    );
    expect(screen.getByText('src/index.ts')).toBeInTheDocument();
  });

  it('displays input summary for search query', () => {
    render(
      <ToolStatus
        tool="search_code"
        status="running"
        input={{ query: 'useAuth' }}
      />
    );
    expect(screen.getByText('useAuth')).toBeInTheDocument();
  });

  it('result is collapsible - hidden by default, shown on click', () => {
    render(
      <ToolStatus
        tool="read_file"
        status="done"
        result="const x = 1;"
      />
    );
    // Result should be hidden by default
    expect(screen.queryByText('const x = 1;')).not.toBeInTheDocument();
    // Click to expand
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });
});
