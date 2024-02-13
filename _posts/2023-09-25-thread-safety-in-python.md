---
title:  Thread Safety in Python
date: 2023-09-25 19:00:11 +05:30
categories: [Python, threading, GIL]
tags: [python, gil, threading]     # TAG names should always be lowercase
---

# Thread Safety in Python

Before getting started with Thread safety, let's look into race conditions.

## Race Conditions

From Wikipedia:
> A race condition or race hazard is the condition of an electronics, software, or other system where the system's substantive behavior is dependent on the sequence or timing of other uncontrollable events. It becomes a bug when one or more of the possible behaviors is undesirable.

>Race conditions can occur especially in logic circuits, multithreaded, or distributed software programs.


For an example of a race condition on a real-world web app, see this disclosed security bug: [https://hackerone.com/reports/759247](https://hackerone.com/reports/759247)

Here the hacker could redeem a gift card (intended for single use) multiple times.

A developer may think of implementing a gift card redemption flow like below:
1. Get a gift card code from the user
2. Validate the code: Check if it exists in DB, is not expired, and is not used.
3. If validation succeeds, add the gift card value to the user's wallet and mark the gift card as used in the DB.

Think of the case where a user sends multiple requests at the same time. All parallel requests arriving before the execution of step 3, could succeed and can result in adding the gift card amount to the user's wallet once per request. This might have happened in the case of the above bug.

## Threading in Python

Threading is a method to implement concurrency in Python programs. Due to the presence of CPython's GIL, threading is helpful in the case of I/O Bound programs.

threading module and concurrent.future's ThreadPoolExecutor helper is commonly used to implement multithreading in Python.

Let's dive into some Python examples after exploring the levels of thread safety.

### Levels of thread safety

From Wikipedia, levels of thread safety:

> Thread safe: Implementation is guaranteed to be free of race conditions when accessed by multiple threads simultaneously.

> Conditionally safe: Different threads can access different objects simultaneously, and access to shared data is protected from race conditions.

> Not thread-safe: Data structures should not be accessed simultaneously by different threads.


### Race conditions in Python Threaded Programs

#### Example 1: Incrementing a counter

```python
import concurrent.futures

count = 0


def increase_counter():
    global count
    for i in range(1000):
        count += 1

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    for _ in range(10_000):
        executor.submit(increase_counter)

print(F"{count=}")
```

The expected value of the count is 10,000 * 1000.

Running with Python 3.9, the program output varies per execution and gives outputs like below:
1. `count=2163149`
2. `count=5642376`

From this, we can conclude that the program is not thread-safe, since it gives unexpected results when run using multiple threads.

In the above examples, there are at most 10 parallel threads working since we have given `max_workers=10`

On adjusting max_workers value,

When `max_workers=3`, the output varies like below:
1. `count=10000000`
2. `count=9999000`

On reducing max_workers, which is the number of threads running in parallel, there is a visible reduction in errors, and at times, the expected output is also returned.

Consider the above scenario where each thread reads a variable and increments its value with 1. Between reads and writes, context switches to different threads can happen.
With multiple threads, the following scenario may be possible:
1. Thread_1 reads the value of count, gets 0
2. At the same time thread 2 reads count, and gets 0
3. Thread_1 sets count=count+1, as 1.
4. Thread_3 reads count, gets 1.
5. Thread_3 sets count=count+1, as 2
6. Thread_2 sets count=count+1, as 1 (since thread_2 holds a stale value of count, i.e., 0)

This explains the counter value being far less than expected.

#### Example 2: Singleton class in Python

Let's take an example of a Singleton class created using Python.
Singleton pattern is used to make sure that only one instance is created for a class. This can be used in cases where the class initialization performs some steps which should be performed exactly once. Singletons are useful in cases where there are restrictions on certain resource usage such as concurrent connection limits.

Below is a commonly used example for a Singleton class in Python:

```python
class SingletonClass:
    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = super(SingletonClass, cls).__new__(cls)
        return cls.instance


obj1 = SingletonClass()
obj2 = SingletonClass()

print(obj1 is obj2) # True
print(id(obj1)) # 2402721138768
print(id(obj2)) # 2402721138768
```

In the above example, it is possible because two threads can evaluate the `if` check for instance (`if not hasattr(cls, 'instance')`) at near similar times and proceed to create two new objects.

#### Example 3: The print function

```python
from concurrent import futures

def printer():
    print('testing thread safety of print')


with futures.ThreadPoolExecutor(max_workers=10) as executor:
    for _ in range(10):
        executor.submit(printer)
```

Output can vary from expected:

```
testing thread safety of print
testing thread safety of print
testing thread safety of printtesting thread safety of print
testing thread safety of print

testing thread safety of printtesting thread safety of print
testing thread safety of print
testing thread safety of print

testing thread safety of print
```

Before printing ending newlines, context switches happen sometimes printing output from another thread.

## Making programs thread-safe

#### Synchronization primitives

The below synchronization primitives can be used to make a program thread safe.

##### Lock

A lock can be used for exclusive access to a resource. Once a thread acquires a lock, no other threads can acquire it (and proceed further) unless the lock is released.

##### RLock

RLock is a re-entrant lock. It allows when a holding thread requests the lock again.
The simple lock is not aware of the current locking thread and this can lead to deadlocks.

```python
import threading

num = 0
lock = threading.Lock()

lock.acquire()
num += 1
lock.acquire() # This will block. The program goes into a deadlock after this.
num += 2
lock.release()
```

```python

# With RLock, that problem doesn't happen.
lock = threading.RLock()

lock.acquire()
num += 3
lock.acquire() # This won't block.
num += 4
lock.release()
lock.release() # We need to call release once for each call to acquire

```

For brevity, let's skip the other primitives (Semaphore & Barrier, Events & Conditions).


Lock acquisition and release can be managed using context managers.

```python
lock = threading.Lock()

lock.acquire()
num += 1
lock.release()
```

is equivalent to:

```python
lock = threading.Lock()

with lock:
    num += 1
```

#### Thread safe counter implementation

We can use a lock at places of code where race conditions(simultaneous modifications in this case) should be avoided.

```python
import concurrent.futures
from threading import Lock

count = 0
lock = Lock()


def increase_counter():
    global count
    for i in range(1000):

        lock.acquire()
        count += 1
        lock.release()

        """
        or:
        with lock:
            count += 1
        """


with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    for _ in range(10_000):
        executor.submit(increase_counter)

print(F"{count=}") # count=10000000, for all executions
```


#### Thread-safe singleton implementation

```python
import threading


class Singleton:
  _instance = None
  _lock = threading.Lock()

  def __new__(cls):
      if cls._instance is None:
        with cls._lock:
          if cls._instance is None:
              cls._instance = super().__new__(cls)
          
      return cls._instance
```

After acquiring the lock (using `with`), we are rechecking the presence of an instance to prevent the below-race condition.

Consider two threads thread1 and thread2.

1. Both execute `new` dunder of singleton class at the same time.
2. `cls_.instance` is currently None, so both thread tries to acquire the lock
3. thread1 gets the lock while thread2 is blocked waiting.
4. thread1 creates the singleton instance and completes execution inside the context manager. Once it exits the `with block, the lock (`cls._lock`) is released.
5. Now, thread2 is unblocked and enters the context manager body by acquiring the lock. Since the None check for cls._instance fails, thread2 leaves execution and the already existing instance is returned.

#### Thread safe print implementation

Similar to the previous examples, we can use a lock here.

```python
from concurrent import futures
from threading import Lock

lock = Lock()

def printer():
    with lock:
        print('testing thread safety of print')


with futures.ThreadPoolExecutor(max_workers=10) as executor:
    for _ in range(100):
        executor.submit(printer)

```


## Context switching & Thread switch interval

The switch interval in Python specifies how long the Python interpreter will allow a Python thread to run, after which it is forced for a context switch.

Since only one thread runs at a time due to GIL, the interpreter tries to switch threads after this interval.

The default interval is 5 milliseconds.

```
>>> import sys
>>> sys.getswitchinterval()
0.005
```

We can set custom thread switch interval using [sys.setswitchinterval](https://docs.python.org/3/library/sys.html#sys.setswitchinterval)



If the threads are waiting (e.g.: for IO operations) this switching allows for a parallel execution-like effect. If threads are running any CPU-bound operations, this context switch causes a performance penalty.


Eg: Network IO blocked tasks:

```python
import time

import requests

start = time.perf_counter()
req1 = requests.get("https://reqres.in/api/users?delay=3")
req2 = requests.get("https://reqres.in/api/users?delay=3")
end = time.perf_counter()

print(end-start, " seconds") # 6.9710999 seconds
```

Using threads:
```python
import threading
import time
import requests


def make_request():
    return requests.get("https://reqres.in/api/users?delay=3")


start = time.perf_counter()

t1 = threading.Thread(target=make_request)
t2 = threading.Thread(target=make_request)

t1.start()
t2.start()

t1.join()
t2.join()

end = time.perf_counter()

print(end-start, " seconds") # 3.494618 seconds
```

In case of CPU Blocked tasks:

```python
import time

start = time.perf_counter()

s1 = sum(range(100000000))
s2 = sum(range(100000000))

end = time.perf_counter()

print(end-start, " seconds") # 3.8891145 seconds
```

Using threads:

```python
import threading
import time


def perform_computation(): 
    return sum(range(100000000))


start = time.perf_counter()

t1 = threading.Thread(target=perform_computation)
t2 = threading.Thread(target=perform_computation)

t1.start()
t2.start()

t1.join()
t2.join()

end = time.perf_counter()

print(end-start, " seconds") # 3.9622078999999997 seconds
```

As expected, the use of threading slowed down this CPU-bound operation.


## Revisiting the increment_counter example

On running the non-thread-safe increment_counter() used above using Python 3.11 always gives the expected result and race conditions are not seen.

We can use dis module to inspect the Python bytecode for the increase_counter function

```python
import dis

count = 0


def increase_counter():
    global count
    for i in range(1000):
        count += 1

dis.dis(increase_counter)
```

Python 3.9 output:
```
9 0 LOAD_GLOBAL 0 (range)
2 LOAD_CONST 1 (1000)
4 CALL_FUNCTION 1
6 GET_ITER
>> 8 FOR_ITER 12 (to 22)
10 STORE_FAST 0 (i)

10 12 LOAD_GLOBAL 1 (count)
14 LOAD_CONST 2 (1)
16 INPLACE_ADD
18 STORE_GLOBAL 1 (count)
20 JUMP_ABSOLUTE 8
>> 22 LOAD_CONST 0 (None)
24 RETURN_VALUE
```

Python 3.11 output:
```
7 0 RESUME 0

9 2 LOAD_GLOBAL 1 (NULL + range)
14 LOAD_CONST 1 (1000)
16 PRECALL 1
20 CALL 1
30 GET_ITER
>> 32 FOR_ITER 12 (to 58)
34 STORE_FAST 0 (i)

10 36 LOAD_GLOBAL 2 (count)
48 LOAD_CONST 2 (1)
50 BINARY_OP 13 (+=)
54 STORE_GLOBAL 1 (count)
56 JUMP_BACKWARD 13 (to 32)

9 >> 58 LOAD_CONST 0 (None)
60 RETURN_VALUE
```
We can see that INPLACE_ADD opcode has been replaced with BINARY_OP in Python 3.11. I guess that the BINARY_OP is now a thread-safe operation.


## References

[Medium article by Jordan Gillard](https://medium.com/analytics-vidhya/how-to-create-a-thread-safe-singleton-class-in-python-822e1170a7f6)

[RealPython Article on Threading](https://realpython.com/intro-to-python-threading/#working-with-many-threads)

[Article by Saurabh Chaturvedi](https://betterprogramming.pub/synchronization-primitives-in-python-564f89fee732)

[Superfastpython - Thread Safe print](https://superfastpython.com/thread-safe-print-in-python/)

