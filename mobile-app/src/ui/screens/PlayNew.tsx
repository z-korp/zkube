/**
 * PlayNew - Thin route guard for the PixiJS play screen.
 *
 * All game logic now lives inside PlayScreen → usePlayGame (Pixi tree).
 * This component only parses the URL param and provides navigation callbacks.
 */

import { useCallback } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { PlayScreen } from '@/pixi/components/pages';

export const PlayNew = () => {
  const navigate = useNavigate();
  const { gameId: gameIdParam } = useParams<{ gameId: string }>();
  const gameId = gameIdParam ? parseInt(gameIdParam, 10) : 0;

  const handleGoHome = useCallback(() => navigate('/'), [navigate]);
  const handlePlayAgain = useCallback(() => navigate('/', { state: { openLoadout: true } }), [navigate]);

  if (!gameIdParam) return <Navigate to="/" replace />;

  return (
    <PlayScreen gameId={gameId} onGoHome={handleGoHome} onPlayAgain={handlePlayAgain} />
  );
};

export default PlayNew;
