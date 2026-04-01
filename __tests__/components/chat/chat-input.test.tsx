import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '@/components/chat/chat-input';

describe('ChatInput', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  it('renders textarea and send button', () => {
    render(<ChatInput onSend={mockOnSend} />);
    expect(screen.getByPlaceholderText(/Ask the AI expert/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    render(<ChatInput onSend={mockOnSend} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('send button is disabled when isLoading is true', () => {
    render(<ChatInput onSend={mockOnSend} isLoading />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls onSend with message on button click', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);
    const textarea = screen.getByPlaceholderText(/Ask the AI expert/i);
    await user.type(textarea, 'Hello AI');
    const button = screen.getByRole('button');
    await user.click(button);
    expect(mockOnSend).toHaveBeenCalledWith('Hello AI');
  });

  it('calls onSend on Enter key', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);
    const textarea = screen.getByPlaceholderText(/Ask the AI expert/i);
    await user.type(textarea, 'Test message{Enter}');
    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('does not send on Shift+Enter', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);
    const textarea = screen.getByPlaceholderText(/Ask the AI expert/i);
    await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}');
    expect(mockOnSend).not.toHaveBeenCalled();
  });
});
