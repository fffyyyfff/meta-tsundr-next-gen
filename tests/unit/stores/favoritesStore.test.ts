import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoritesStore, type FavoriteExecution } from '@/stores/favoritesStore';

const mockExecution: FavoriteExecution = {
  id: 'exec-1',
  agentType: 'design',
  task: 'Generate button component',
  result: 'Success',
  status: 'completed',
  duration: 1200,
  createdAt: '2026-03-31T00:00:00Z',
};

const mockExecution2: FavoriteExecution = {
  id: 'exec-2',
  agentType: 'code-review',
  task: 'Review PR #42',
  result: 'No issues found',
  status: 'completed',
  duration: 800,
  createdAt: '2026-03-31T01:00:00Z',
};

describe('favoritesStore', () => {
  beforeEach(() => {
    useFavoritesStore.setState({ favorites: [] });
  });

  it('should start with empty favorites', () => {
    expect(useFavoritesStore.getState().favorites).toEqual([]);
  });

  it('should add a favorite', () => {
    useFavoritesStore.getState().add(mockExecution);
    expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    expect(useFavoritesStore.getState().favorites[0].id).toBe('exec-1');
  });

  it('should prepend new favorites', () => {
    useFavoritesStore.getState().add(mockExecution);
    useFavoritesStore.getState().add(mockExecution2);
    const favorites = useFavoritesStore.getState().favorites;
    expect(favorites[0].id).toBe('exec-2');
    expect(favorites[1].id).toBe('exec-1');
  });

  it('should not add duplicate favorites', () => {
    useFavoritesStore.getState().add(mockExecution);
    useFavoritesStore.getState().add(mockExecution);
    expect(useFavoritesStore.getState().favorites).toHaveLength(1);
  });

  it('should remove a favorite', () => {
    useFavoritesStore.getState().add(mockExecution);
    useFavoritesStore.getState().add(mockExecution2);
    useFavoritesStore.getState().remove('exec-1');
    const favorites = useFavoritesStore.getState().favorites;
    expect(favorites).toHaveLength(1);
    expect(favorites[0].id).toBe('exec-2');
  });

  it('should check if an item is a favorite', () => {
    useFavoritesStore.getState().add(mockExecution);
    expect(useFavoritesStore.getState().isFavorite('exec-1')).toBe(true);
    expect(useFavoritesStore.getState().isFavorite('exec-999')).toBe(false);
  });

  it('should clear all favorites', () => {
    useFavoritesStore.getState().add(mockExecution);
    useFavoritesStore.getState().add(mockExecution2);
    useFavoritesStore.getState().clear();
    expect(useFavoritesStore.getState().favorites).toEqual([]);
  });
});
