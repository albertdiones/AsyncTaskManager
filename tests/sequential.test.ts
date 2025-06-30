import { test, expect } from '@jest/globals'
import { SequentialTaskManager } from '..';

test(
    'sequential task manager',
    async () => {
        let x = 0;
      

        const manager = new SequentialTaskManager({ logger: console });


        // this happens instantly, because there's no task on queue
        manager.add(
            async () => { // 1
                x++;
            }
        );

        expect(x).toBe(1);

        // but from here on, it will happen once every 200ms
        manager.add(
            async () => {
                x++; // 2
            }
        );
        // afte 200 ms
        manager.add(
            async () => {
                x+=2; // 4
            }
        );
        manager.add(
            async () => {
                x++;
            }
        );

        await Bun.sleep(1);

        expect(x).toBe(5);
        
        manager.add(
            () => {
                x+=5; // 10
                return Bun.sleep(2000); // the task took 2 seconds to finish
            }
        );
        Bun.sleep(1);
        expect(x).toBe(10);

        manager.add(
            () => {
                x++; // 11
            }
        );
        manager.add(
            () => {
                x++; // 12
            }
        );

        await Bun.sleep(2005);

        expect(x).toBe(12);

    }
);
