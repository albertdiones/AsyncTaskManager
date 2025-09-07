import { test, expect } from '@jest/globals'
import { PaddedScheduleManager, SequentialTaskManager } from '..';

test(
    'padded task manager',
    async () => {
        let x = 0;
      

        const manager = new PaddedScheduleManager(100, 0, { logger: console });


        // this happens instantly, because there's no task on queue
        manager.add(
            async () => { // 1
                x++;
            }
        );

        expect(x).toBe(1);

        manager.add(
            async () => {
                x++; // 2
                return Bun.sleep(1000).then(
                    () => 321
                );
            }
        ).then(
            (result) => {
                x+=4; // 6
                expect(result).toBe(321);
            }
        );
        manager.add(
            async () => {
                x+=2; // 8
                return 111;
            }
        ).then(
            (result) => {
                x+=8; // 16
                expect(result).toBe(111);
            }
        );
        await Bun.sleep(102);
        expect(x).toBe(2); // +1
        await Bun.sleep(1002);
        expect(x).toBe(6); // +4
        await Bun.sleep(102);
        expect(x).toBe(16); // + 10

    }
);
