// WorldBookInjector 测试用例
import { WorldBookInjector } from '../WorldBookInjector';
import { dataManager } from '../dataManager';

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
      const originalPrompt = 'Test prompt';
      const result = await WorldBookInjector.injectWorldBooks('chat1', originalPrompt, []);
      
      expect(result).toBe(originalPrompt);
      expect(mockDataManager.getWorldBook).not.toHaveBeenCalled();
    });

    it('should return original prompt when world book IDs array is empty', async () => {
      const originalPrompt = 'Test prompt';
      const result = await WorldBookInjector.injectWorldBooks('chat1', originalPrompt, []);
      
      expect(result).toBe(originalPrompt);
    });

    it('should inject world book content when valid world books exist', async () => {
      const originalPrompt = 'Test prompt';
      const worldBook1 = {
        id: 'wb1',
        name: 'Fantasy World',
        content: 'This is a fantasy world with magic.',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const worldBook2 = {
        id: 'wb2',
        name: 'Sci-Fi Setting',
        content: 'This is a futuristic sci-fi setting.',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockDataManager.getWorldBook
        .mockResolvedValueOnce(worldBook1)
        .mockResolvedValueOnce(worldBook2);

      const result = await WorldBookInjector.injectWorldBooks('chat1', originalPrompt, ['wb1', 'wb2']);
      
      expect(result).toContain(originalPrompt);
      expect(result).toContain('# 世界设定');
      expect(result).toContain('## Fantasy World');
      expect(result).toContain('This is a fantasy world with magic.');
      expect(result).toContain('## Sci-Fi Setting');
      expect(result).toContain('This is a futuristic sci-fi setting.');
    });

    it('should filter out null world books', async () => {
      const originalPrompt = 'Test prompt';
      const worldBook1 = {
        id: 'wb1',
        name: 'Valid World',
        content: 'Valid content.',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockDataManager.getWorldBook
        .mockResolvedValueOnce(worldBook1)
        .mockResolvedValueOnce(null);

      const result = await WorldBookInjector.injectWorldBooks('chat1', originalPrompt, ['wb1', 'wb2']);
      
      expect(result).toContain('## Valid World');
      expect(result).not.toContain('wb2');
    });

    it('should return original prompt when all world books are null', async () => {
      const originalPrompt = 'Test prompt';

      mockDataManager.getWorldBook
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await WorldBookInjector.injectWorldBooks('chat1', originalPrompt, ['wb1', 'wb2']);
      
      expect(result).toBe(originalPrompt);
    });

    it('should handle errors gracefully and return original prompt', async () => {
      const originalPrompt = 'Test prompt';

      mockDataManager.getWorldBook.mockRejectedValue(new Error('Database error'));

      const result = await WorldBookInjector.injectWorldBooks('chat1', originalPrompt, ['wb1']);
      
      expect(result).toBe(originalPrompt);
    });
  });

  describe('validateWorldBookIds', () => {
    it('should return empty array when no IDs provided', async () => {
      const result = await WorldBookInjector.validateWorldBookIds([]);
      expect(result).toEqual([]);
    });

    it('should return valid IDs only', async () => {
      const worldBook1 = {
        id: 'wb1',
        name: 'Valid World',
        content: 'Valid content.',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockDataManager.getWorldBook
        .mockResolvedValueOnce(worldBook1)
        .mockResolvedValueOnce(null);

      const result = await WorldBookInjector.validateWorldBookIds(['wb1', 'wb2']);
      
      expect(result).toEqual(['wb1']);
    });

    it('should handle errors and return empty array', async () => {
      mockDataManager.getWorldBook.mockRejectedValue(new Error('Database error'));

      const result = await WorldBookInjector.validateWorldBookIds(['wb1']);
      
      expect(result).toEqual([]);
    });
  });

  describe('cleanupInvalidWorldBooks', () => {
    it('should return only valid world book IDs', async () => {
      const worldBook1 = {
        id: 'wb1',
        name: 'Valid World',
        content: 'Valid content.',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockDataManager.getWorldBook
        .mockResolvedValueOnce(worldBook1)
        .mockResolvedValueOnce(null);

      const result = await WorldBookInjector.cleanupInvalidWorldBooks('chat1', ['wb1', 'wb2']);
      
      expect(result).toEqual(['wb1']);
    });
  });
});