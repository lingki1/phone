// WorldBookEditor 组件测试用例
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorldBookEditor from '../WorldBookEditor';
import { WorldBook } from '../../../../types/chat';

describe('WorldBookEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render create mode correctly', () => {
    render(
      <WorldBookEditor
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('创建世界书')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入世界书名称')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入世界书内容，这些内容将作为AI聊天的背景设定...')).toBeInTheDocument();
  });

  it('should render edit mode correctly', () => {
    const mockWorldBook: WorldBook = {
      id: 'wb1',
      name: 'Test World Book',
      content: 'Test content',
      category: '科幻',
      description: 'Test description',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    render(
      <WorldBookEditor
        worldBook={mockWorldBook}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('编辑世界书')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test World Book')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
    expect(screen.getByDisplayValue('科幻')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(
      <WorldBookEditor
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('世界书名称不能为空')).toBeInTheDocument();
      expect(screen.getByText('世界书分类不能为空')).toBeInTheDocument();
      expect(screen.getByText('世界书内容不能为空')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should show validation error for name too long', async () => {
    render(
      <WorldBookEditor
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByPlaceholderText('请输入世界书名称');
    fireEvent.change(nameInput, { target: { value: 'a'.repeat(51) } });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('世界书名称不能超过50个字符')).toBeInTheDocument();
    });
  });

  it('should show validation error for content too long', async () => {
    render(
      <WorldBookEditor
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByPlaceholderText('请输入世界书名称');
    const contentInput = screen.getByPlaceholderText('请输入世界书内容，这些内容将作为AI聊天的背景设定...');
    
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });
    fireEvent.change(contentInput, { target: { value: 'a'.repeat(10001) } });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('世界书内容不能超过10000个字符')).toBeInTheDocument();
    });
  });

  it('should call onSave with correct data when form is valid', async () => {
    mockOnSave.mockResolvedValue(undefined);

    render(
      <WorldBookEditor
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByPlaceholderText('请输入世界书名称');
    const contentInput = screen.getByPlaceholderText('请输入世界书内容，这些内容将作为AI聊天的背景设定...');
    const descriptionInput = screen.getByPlaceholderText('简短描述这个世界书的用途（可选）');

    fireEvent.change(nameInput, { target: { value: 'Test World Book' } });
    fireEvent.change(contentInput, { target: { value: 'Test content' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test World Book',
          content: 'Test content',
          description: 'Test description'
        })
      );
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <WorldBookEditor
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show character count for inputs', () => {
    render(
      <WorldBookEditor
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('0/50')).toBeInTheDocument(); // Name character count
    expect(screen.getByText('0/100')).toBeInTheDocument(); // Description character count
    expect(screen.getByText('0/10000')).toBeInTheDocument(); // Content character count
  });

  it('should update character count when typing', () => {
    render(
      <WorldBookEditor
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByPlaceholderText('请输入世界书名称');
    fireEvent.change(nameInput, { target: { value: 'Test' } });

    expect(screen.getByText('4/50')).toBeInTheDocument();
  });

  it('should show saving state when save is in progress', async () => {
    let resolveSave: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    mockOnSave.mockReturnValue(savePromise);

    render(
      <WorldBookEditor
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByPlaceholderText('请输入世界书名称');
    const contentInput = screen.getByPlaceholderText('请输入世界书内容，这些内容将作为AI聊天的背景设定...');

    fireEvent.change(nameInput, { target: { value: 'Test' } });
    fireEvent.change(contentInput, { target: { value: 'Test content' } });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('保存中...')).toBeInTheDocument();
    });

    resolveSave!();
  });
});