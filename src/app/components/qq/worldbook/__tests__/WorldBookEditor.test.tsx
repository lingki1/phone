// WorldBookEditor 组件测试用例
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
        isOpen={true}
        onClose={mockOnCancel}
        onSave={mockOnSave}
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
      description: 'Test description',
      category: '科幻', // 添加缺失的category字段
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    render(
      <WorldBookEditor
        isOpen={true}
        onClose={mockOnCancel}
        onSave={mockOnSave}
        worldBook={mockWorldBook}
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
        isOpen={true}
        onClose={mockOnCancel}
        onSave={mockOnSave}
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
        isOpen={true}
        onClose={mockOnCancel}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByPlaceholderText('请输入世界书名称');
    const longName = 'a'.repeat(51);
    fireEvent.change(nameInput, { target: { value: longName } });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('世界书名称不能超过50个字符')).toBeInTheDocument();
    });
  });

  it('should show validation error for content too long', async () => {
    render(
      <WorldBookEditor
        isOpen={true}
        onClose={mockOnCancel}
        onSave={mockOnSave}
      />
    );

    const contentInput = screen.getByPlaceholderText('请输入世界书内容，这些内容将作为AI聊天的背景设定...');
    const longContent = 'a'.repeat(10001);
    fireEvent.change(contentInput, { target: { value: longContent } });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('世界书内容不能超过10000个字符')).toBeInTheDocument();
    });
  });

  it('should call onSave with correct data when form is valid', async () => {
    render(
      <WorldBookEditor
        isOpen={true}
        onClose={mockOnCancel}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByPlaceholderText('请输入世界书名称');
    const categorySelect = screen.getByDisplayValue('请选择分类');
    const contentInput = screen.getByPlaceholderText('请输入世界书内容，这些内容将作为AI聊天的背景设定...');
    const descriptionInput = screen.getByPlaceholderText('请输入世界书描述（可选）');

    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    fireEvent.change(categorySelect, { target: { value: '科幻' } });
    fireEvent.change(contentInput, { target: { value: 'Test Content' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Name',
          category: '科幻',
          content: 'Test Content',
          description: 'Test Description'
        })
      );
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <WorldBookEditor
        isOpen={true}
        onClose={mockOnCancel}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show character count for inputs', () => {
    render(
      <WorldBookEditor
        isOpen={true}
        onClose={mockOnCancel}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('0/50')).toBeInTheDocument(); // Name character count
    expect(screen.getByText('0/100')).toBeInTheDocument(); // Description character count
    expect(screen.getByText('0/10000')).toBeInTheDocument(); // Content character count
  });

  it('should update character count when typing', () => {
    render(
      <WorldBookEditor
        isOpen={true}
        onClose={mockOnCancel}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByPlaceholderText('请输入世界书名称');
    fireEvent.change(nameInput, { target: { value: 'Test' } });

    expect(screen.getByText('4/50')).toBeInTheDocument();
  });

  it('should show saving state when save is in progress', async () => {
    const mockOnSaveAsync = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <WorldBookEditor
        isOpen={true}
        onClose={mockOnCancel}
        onSave={mockOnSaveAsync}
      />
    );

    const nameInput = screen.getByPlaceholderText('请输入世界书名称');
    const categorySelect = screen.getByDisplayValue('请选择分类');
    const contentInput = screen.getByPlaceholderText('请输入世界书内容，这些内容将作为AI聊天的背景设定...');

    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    fireEvent.change(categorySelect, { target: { value: '科幻' } });
    fireEvent.change(contentInput, { target: { value: 'Test Content' } });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('保存中...')).toBeInTheDocument();
    });
  });
});