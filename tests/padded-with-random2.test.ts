import { test, expect } from '@jest/globals'
import { PaddedScheduleManager, SequentialTaskManager } from '..';

test(
    'padded sched with randomness task manager 2',
    async () => {
        let x = 0;
      

        const manager = new PaddedScheduleManager(100, 500, { logger: console });

        const getTime = () => Date.now();

        // this happens instantly, because there's no task on queue
        let prevTime = getTime();
        let timeElapsed2:number;
        let timeElapsed3:number;
        
        manager.add(
            async () => { // 1
                x++;
                const currentTime = getTime();
                prevTime = currentTime;
            }
        );

        expect(x).toBe(1);

        manager.add(
            async () => { // 1
                x++;
                const currentTime = getTime();
                timeElapsed2 = prevTime - currentTime;
                prevTime = currentTime;
            }
        );
        

        manager.add(
            async () => { // 1
                x++;
                const currentTime = getTime();
                timeElapsed3 = prevTime - currentTime;
                prevTime = currentTime;
            }
        );

        await Bun.sleep(99);

        expect(x).toBe(1);

        await Bun.sleep(501);
        
        const y = x;
        expect(x).toBeGreaterThanOrEqual(2);

        await Bun.sleep(99)

        expect(x).toBe(y);

        await Bun.sleep(501);

        expect(x).toBe(3);

        expect(timeElapsed2).toBeDefined();
        expect(timeElapsed3).toBeDefined();

        expect(
            Math.abs(
                timeElapsed3 - timeElapsed2
            )
        ).toBeGreaterThan(50)

    }
);
