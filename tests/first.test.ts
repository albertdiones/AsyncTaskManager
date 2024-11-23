import { test, expect } from '@jest/globals'
import { PaddedScheduleManager } from '..';

test(
    'first test',
    async () => {
        let x = 0;
      

        const manager = new PaddedScheduleManager(200,0, { logger: console });

        // this happens instantly, because there's no task on queue
        manager.add(
            () => {
                x++;
            }
        );

        // but from here on, it will happen once every 200ms
        manager.add(
            () => {
                x++;
            }
        );
        manager.add(
            () => {
                x+=2; // 3
            }
        );
        manager.add(
            () => {
                x++; // 4
            }
        );
        manager.add(
            () => {
                x+=5; // 9
            }
        );
        manager.add(
            () => {
                x++; // 10
            }
        );
        manager.add(
            () => {
                x++; // 11
            }
        );

        expect(x).toBe(1);

        //await Bun.sleep(200);

        //expect(x).toBe(3);

    }
);
