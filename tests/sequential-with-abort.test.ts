import { test, expect } from '@jest/globals'
import { SequentialTaskManager } from '..';

test(
    'sequential task manager',
    async () => {
        let x = 1;
      

        const manager = new SequentialTaskManager({ logger: console });

        manager.add(
            async () => {
                return Bun.sleep(500).then(
                    () => x+=5
                ); // 500 ms to finish
            }
        ).then(
            (y) => expect(y).toBe(6)
        );
        
        // should be stopped
        manager.add(
            async () => {
                x+=10;
            }
        );
        expect(x).toBe(1);

        manager.abortAll();
        await Bun.sleep(500);
        expect(x).toBe(6);
        manager.add(
            async () => {
                x++;
                return Bun.sleep(200).then(
                    () => x+=100
                ).then(
                    () => Bun.sleep(50)
                )
            }
        );
        manager.add(
            async () => {
                x+=3;
                return Bun.sleep(200).then(
                    () => x+=1000
                );
            }
        );

        // to be aborted
        manager.add(
            async () => {
                x+=5;
                return Bun.sleep(200).then(
                    () => x+=10000
                );
            }
        );
        expect(x).toBe(7);
        await Bun.sleep(200);
        expect(x).toBe(107);
        await Bun.sleep(50);
        expect(x).toBe(110);
        manager.abortAll();
        await Bun.sleep(200);
        expect(x).toBe(1110); // if abort fails, 1115
        await Bun.sleep(200);
        expect(x).toBe(1110); // if abort fails 11115

    }
);
