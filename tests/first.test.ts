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
                return Promise.resolve();
            }
        );

        // but from here on, it will happen once every 200ms
        manager.add(
            () => {
                x++;
                return Promise.resolve();
            }
        );
        manager.add(
            () => {
                x+=2; // 3
                return Promise.resolve();
            }
        );
        manager.add(
            () => {
                x++; // 4
                return Promise.resolve();
            }
        );
        manager.add(
            () => {
                x+=5; // 9
                return Promise.resolve();
            }
        );
        manager.add(
            () => {
                x++; // 10
                return Promise.resolve();
            }
        );
        manager.add(
            () => {
                x++; // 11
                return Promise.resolve();
            }
        );

        expect(x).toBe(1);

        //await Bun.sleep(200);

        //expect(x).toBe(3);

    }
);
