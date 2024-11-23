Todos:
 * Copy base class from nonChallantJs
 * Create basic jest test


Issues/Concerns:

#1
When using PaddedScheduleManager, and you queue
task1, task2, task3

and an error occured on task1, I think it will
stop execution of task2 and task3

#2

when using PaddedScheduleManager
and calling manager.add().then(() => )
it won't have any return(??? needs confirmation)
because of the weird promise chain