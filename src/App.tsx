/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { GameBoard } from './components/GameBoard';

export default function App() {
  const levelNumber = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const lvl = params.get('level');
      if (lvl) {
        const num = parseInt(lvl, 10);
        if (!isNaN(num) && num > 0) return num;
      }
    }
    return 35;
  }, []);

  return (
    <main
      className="fixed inset-0 w-full h-full bg-[#56A9B4] flex items-center justify-center overflow-hidden"
      data-state="playing"
    >
      <GameBoard levelNumber={levelNumber} />
    </main>
  );
}
