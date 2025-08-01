// WorldBookCard 组件测试用例
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorldBookCard from '../WorldBookCard';
import { WorldBook } from '../../../../types/chat';

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

describe('WorldBookCard', () => {
  const mockWorldBook: WorldBook = {
    id: 'wb1',
    name: 'Test World Book',
    content: 'This is a test world book content that is longer than 100 characters to test the preview functionality and ensure it gets truncated properly.',
    description: 'Test description',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it('should render world book information correctly', () => {
    render(
      <WorldBookCard
        worldBook={mockWorldBook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test World Book')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText(/This is a test world book content/)).toBeInTheDocument();
  });

  it('should truncate long content with ellipsis', () => {
    render(
      <WorldBookCard
        worldBook={mockWorldBook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const previewElement = screen.getByText(/This is a test world book content/);
    expect(previewElement.textContent).toContain('...');
    expect(previewElement.textContent?.length).toBeLessThanOrEqual(103); // 100 chars + "..."
  });

  it('should display character count', () => {
    render(
      <WorldBookCard
        worldBook={mockWorldBook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(`${mockWorldBook.content.length} 字符`)).toBeInTheDocument();
  });

  it('should display creation date', () => {
    render(
      <WorldBookCard
        worldBook={mockWorldBook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/创建于/)).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(
      <WorldBookCard
        worldBook={mockWorldBook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByTitle('编辑');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockWorldBook);
  });

  it('should call onDelete when delete button is clicked and confirmed', () => {
    render(
      <WorldBookCard
        worldBook={mockWorldBook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByTitle('删除');
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith('确定要删除世界书"Test World Book"吗？');
    expect(mockOnDelete).toHaveBeenCalledWith('wb1');
  });

  it('should not call onDelete when delete is cancelled', () => {
    mockConfirm.mockReturnValue(false);

    render(
      <WorldBookCard
        worldBook={mockWorldBook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByTitle('删除');
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should not render description when not provided', () => {
    const worldBookWithoutDescription = { ...mockWorldBook, description: undefined };

    render(
      <WorldBookCard
        worldBook={worldBookWithoutDescription}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  it('should handle short content without truncation', () => {
    const shortContentWorldBook = {
      ...mockWorldBook,
      content: 'Short content'
    };

    render(
      <WorldBookCard
        worldBook={shortContentWorldBook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const previewElement = screen.getByText('Short content');
    expect(previewElement.textContent).not.toContain('...');
  });
});