import { test, expect } from '@jest/globals'
import { PaddedScheduleManager } from '..';

test(
    'first test',
    async () => {
        let x = 0;
      

        const manager = new PaddedScheduleManager(200,0, { logger: console });

        // this happens instantly, because there's no task on queue
        manager.add(
            () => { // 1
                x++;
            }
        );

        // but from here on, it will happen once every 200ms
        manager.add(
            () => {
                x++; // 2
            }
        );
        // afte 200 ms
        manager.add(
            () => {
                x+=2; // 4
            }
        );
        manager.add(
            () => {
                x++;
                
            }
        );
        manager.add(
            () => {
                x+=5; // 10
                return Bun.sleep(2000); // the task took 2 seconds to finish
            }
        );
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

        expect(x).toBe(1);

        await Bun.sleep(205);

        expect(x).toBe(2);

        
        await Bun.sleep(200);
        
        expect(x).toBe(4);

        await Bun.sleep(200);

        expect(x).toBe(5);

        await Bun.sleep(200);

        expect(x).toBe(10);

        await Bun.sleep(200);

        expect(x).toBe(10);

        await Bun.sleep(1800);

        expect(x).toBe(10);        

        await Bun.sleep(200);
        
        expect(x).toBe(11);


    }
);
