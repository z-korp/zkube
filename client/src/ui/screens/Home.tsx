import { Header } from '@/ui/containers/Header';
import { Create } from '../actions/Create';
import { Start } from '../actions/Start';
import GameBoard from '../components/GameBoard';
import BackGroundBoard from '../components/BackGroundBoard';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

import imageBackground from '/assets/theme-2.png';
import imageBackgroundTotem from '/assets/theme-2-totem-2.png';
import palmLeft from '/assets/palmtree-left.png';
import palmRight from '/assets/palmtree-right.png';
import PalmTree from '../components/PalmTree';

export const Home = () => {
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex flex-col">
      <Header />
      <BackGroundBoard imageBackground={imageBackground}>
        <BackGroundBoard
          imageBackground={imageBackgroundTotem}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 0.995, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        >
          <div className="relative flex flex-col gap-8 grow items-center justify-start">
            <div className="absolute top-10 flex flex-col items-center gap-4 w-full p-4 max-w-4xl">
              <GameBoard />
              <Create />
              <Start />
            </div>
          </div>
          <AnimatePresence>
            {!animationDone && (
              <>
                <>
                  <PalmTree
                    image={palmRight}
                    initial="visibleRight"
                    animate="hiddenRight"
                    duration={3}
                    position="right"
                  />
                  <PalmTree image={palmLeft} initial="visibleLeft" animate="hiddenLeft" duration={3} position="left" />
                </>
              </>
            )}
          </AnimatePresence>
        </BackGroundBoard>
      </BackGroundBoard>
    </div>
  );
};
