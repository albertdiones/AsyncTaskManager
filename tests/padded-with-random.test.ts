import { test, expect } from '@jest/globals'
import { PaddedScheduleManager, SequentialTaskManager } from '..';

test(
    'padded sched with randomness task manager',
    async () => {
        let x = 0;
      

        const manager = new PaddedScheduleManager(100, 500, { logger: console });


        // this happens instantly, because there's no task on queue
        manager.add(
            async () => { // 1
                x++;
            }
        );

        expect(x).toBe(1);

        // 100 - 600 ms delay
        manager.add(
            async () => {
                x++; // 2
                return Bun.sleep(1000).then(
                    () => 321
                );
            }
        ).then(
            (result) => {
                expect(result).toBe(321);
            }
        );

        await Bun.sleep(99);

        expect(x).toBe(1);

        await Bun.sleep(501);
        
        expect(x).toBe(2);

    }
);
