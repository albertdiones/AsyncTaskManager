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
        // afte 200 ms
        manager.add(
            async () => {
                x+=2; // 4
                return 111;
            }
        ).then(
            (result) => {
                expect(result).toBe(111);
            }
        );
        manager.add(
            async () => {
                x++;
                return Bun.sleep(200).then(
                    () => 123
                )
            }
        ).then(
            (result) => {
                expect(result).toBe(123);
            }
        );

        await Bun.sleep(2000);

        expect(x).toBe(5);

    }
);
