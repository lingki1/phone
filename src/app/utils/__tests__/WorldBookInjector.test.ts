// WorldBookInjector 测试用例
import { injectWorldBooks, validateWorldBookIds, cleanupInvalidWorldBooks } from '../WorldBookInjector';
import { dataManager } from '../dataManager';
import { WorldBook } from '../../types/chat';

// Mock dataManager
jest.mock('../dataManager', () => ({
  dataManager: {
    getWorldBook: jest.fn()
  }
}));

const mockDataManager = dataManager as jest.Mocked<typeof dataManager>;

describe('WorldBookInjector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('injectWorldBooks', () => {
    it('should return original prompt when no world book IDs provided', async () => {
      const originalPrompt = 'Original prompt content';
      const result = await injectWorldBooks(originalPrompt, undefined);

      expect(result).toBe(originalPrompt);
      expect(mockDataManager.getWorldBook).not.toHaveBeenCalled();
    });

    it('should return original prompt when world book IDs array is empty', async () => {
      const originalPrompt = 'Original prompt content';
      const result = await injectWorldBooks(originalPrompt, []);

      expect(result).toBe(originalPrompt);
    });

    it('should inject world book content when valid world books exist', async () => {
      const originalPrompt = 'Original prompt content';
      const worldBookIds = ['wb1', 'wb2'];

      const mockWorldBook1: WorldBook = {
        id: 'wb1',
        name: 'Fantasy World',
        content: 'This is a fantasy world with magic.',
        category: '奇幻',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockWorldBook2: WorldBook = {
        id: 'wb2',
        name: 'Sci-Fi Setting',
        content: 'This is a futuristic sci-fi setting.',
        category: '科幻',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockDataManager.getWorldBook
        .mockResolvedValueOnce(mockWorldBook1)
        .mockResolvedValueOnce(mockWorldBook2);

      const result = await injectWorldBooks(originalPrompt, worldBookIds);

      expect(result).toContain(originalPrompt);
      expect(result).toContain('# 世界设定');
      expect(result).toContain('## Fantasy World');
      expect(result).toContain('This is a fantasy world with magic.');
      expect(result).toContain('## Sci-Fi Setting');
      expect(result).toContain('This is a futuristic sci-fi setting.');
    });

    it('should filter out null world books', async () => {
      const originalPrompt = 'Original prompt content';
      const worldBookIds = ['wb1', 'wb2'];

      const mockWorldBook1: WorldBook = {
        id: 'wb1',
        name: 'Valid World',
        content: 'This is a valid world.',
        category: '奇幻',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockDataManager.getWorldBook
        .mockResolvedValueOnce(mockWorldBook1)
        .mockResolvedValueOnce(null);

      const result = await injectWorldBooks(originalPrompt, worldBookIds);

      expect(result).toContain('## Valid World');
      expect(result).not.toContain('wb2');
    });

    it('should return original prompt when all world books are null', async () => {
      const originalPrompt = 'Original prompt content';
      const worldBookIds = ['wb1', 'wb2'];

      mockDataManager.getWorldBook
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await injectWorldBooks(originalPrompt, worldBookIds);

      expect(result).toBe(originalPrompt);
    });

    it('should handle errors gracefully and return original prompt', async () => {
      const originalPrompt = 'Original prompt content';
      const worldBookIds = ['wb1'];

      mockDataManager.getWorldBook.mockRejectedValueOnce(new Error('Database error'));

      const result = await injectWorldBooks(originalPrompt, worldBookIds);

      expect(result).toBe(originalPrompt);
    });
  });

  describe('validateWorldBookIds', () => {
    it('should return empty array when no IDs provided', async () => {
      const result = await validateWorldBookIds(undefined);

      expect(result).toEqual([]);
    });

    it('should return valid IDs only', async () => {
      const worldBookIds = ['wb1', 'wb2'];

      const mockWorldBook1: WorldBook = {
        id: 'wb1',
        name: 'Valid World',
        content: 'This is a valid world.',
        category: '奇幻',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockDataManager.getWorldBook
        .mockResolvedValueOnce(mockWorldBook1)
        .mockResolvedValueOnce(null);

      const result = await validateWorldBookIds(worldBookIds);

      expect(result).toEqual(['wb1']);
    });

    it('should handle errors and return empty array', async () => {
      const worldBookIds = ['wb1'];

      mockDataManager.getWorldBook.mockRejectedValueOnce(new Error('Database error'));

      const result = await validateWorldBookIds(worldBookIds);

      expect(result).toEqual([]);
    });
  });

  describe('cleanupInvalidWorldBooks', () => {
    it('should return only valid world book IDs', async () => {
      const worldBookIds = ['wb1', 'wb2'];

      const mockWorldBook1: WorldBook = {
        id: 'wb1',
        name: 'Valid World',
        content: 'This is a valid world.',
        category: '奇幻',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockDataManager.getWorldBook
        .mockResolvedValueOnce(mockWorldBook1)
        .mockResolvedValueOnce(null);

      const result = await cleanupInvalidWorldBooks(worldBookIds);

      expect(result).toEqual(['wb1']);
    });
  });
});