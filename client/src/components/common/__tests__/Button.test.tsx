import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders child text correctly', () => {
    render(<Button>Book Room Now</Button>);
    expect(screen.getByText('Book Room Now')).toBeInTheDocument();
  });

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Confirm</Button>);

    fireEvent.click(screen.getByText('Confirm'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button and does not fire clicks when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Action
      </Button>
    );

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(<Button isLoading>Submitting</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });
});
