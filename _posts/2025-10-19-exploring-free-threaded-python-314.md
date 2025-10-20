---
title: Goodbye GIL - Exploring Free Threaded Python 3.14
date: 2025-10-19 15:20:00 +05:30
categories: [ GIL, Talk ]
tags: [ python, stdlib, gil ]     # TAG names should always be lowercase
---

I compared execution time of code - which included CPU & I/O bound scripts and a WSGI app using the default and
free-threaded Python 3.14 interpreters. This was for my talk: "Goodbye GIL - Exploring Free Threaded Mode in Python"
at [PyCon JP 2025](https://2025.pycon.jp/ja/timetable/talk/KLCT8T).

The talk involved a demo running CPU & I/O bound workloads (standalone script and flask endpoints) with GIL
enabled and disabled, and comparing the performance.

> The benchmarking was done using Python 3.14 RC2 (the talk was before Python 3.14 released).
{: .prompt-info }

I originally presented this at PyCascades 2025, using Python 3.13. This time, I updated the benchmarks to Python 3.14
RC2, and added few updates regarding free threaded mode. This post is a recreation of the talk content in text format.

> [Access Presentation Slides Here](https://speakerdeck.com/adarshd/goodbye-gil-exploring-the-free-threaded-mode-in-python) · [Benchmarking Scripts](https://github.com/adarshdigievo/pycon_jp_goodbye_gil_talk)
{: .prompt-tip }

## GIL

[GIL (Global Interpreter Lock)](https://realpython.com/python-gil/) is a mutex that protects access to Python objects,
preventing multiple threads from executing Python bytecodes at once.

GIL simplified CPython's internals such as memory management. This is because code can be written with the assumption
that at any single point in time, only one thread
will be executing Python bytecode.

### The Problem: Impact on Multithreading

The GIL can be a bottleneck in CPU-bound and multithreaded code. In CPU-bound multithreaded programs, threads often
compete for the GIL, leading to context switching and reduced
performance. I/O bounded programs are less affected, as threads can release the GIL during I/O operations.

Historically, multiprocessing was the primary way to achieve parallelism in
Python for CPU-bound tasks, but with inter-process communication overhead.

## PEP 703: Making the GIL Optional in CPython

PEP 703 proposed making the Global Interpreter Lock optional in CPython. It introduces "free-threaded build" of Python
where the GIL is disabled. The PEP aims to unlock true parallel execution for Python threads, especially for
CPU-bound workloads.

It was experimental in Python 3.13, eventually evolving into an optional (or possibly
default-disabled) feature in future releases.

### Challenges of Free-Threaded Python

- Backward Compatibility: Many C extensions are written assuming the GIL will
  exist. These extensions may not be thread-safe without the GIL, leading to potential crashes or data corruption.
- Performance Overhead: Free-threaded builds may run single-threaded code
  slower. This is due to the need for additional locking mechanisms to ensure thread safety (since multiple threads will
  be executing at a single point in time).

## PEP 779 – Criteria for supported status for free-threaded Python:

The PEP outlines criteria for when free-threaded Python can be considered a supported feature. This included
requirements that the free threaded build needs to meet across performance, stability, etc.

PEP 779 evaluated the free-threaded build against these criteria in Python 3.13 and the criteria were satisfied.

> “The free-threaded build of Python is now supported and no longer
> experimental. This is the start of phase II where free-threaded Python is
> officially supported but still optional." - Python 3.14 Release Notes

The performance penalty on single-threaded code in free-threaded mode is now
roughly 5-10%.

## Setting Up Free Threaded Python

The official guide to set-up free-threaded Python is
available [here](https://py-free-threading.github.io/installing_cpython).


Windows/macOS users can use the installers from Python.org that include free-threaded builds.


For Ubuntu, free-threaded Python 3.14 can be installed from the deadsnakes PPA:

```bash
sudo add-apt-repository ppa:deadsnakes
sudo apt-get update
sudo apt-get install python3.14-nogil
```

## Benchmarks

This section presents benchmarks comparing performance of standard Python 3.14 (with GIL) and free-threaded Python
3.14 (without GIL).

- For benchmarking, I created two virtual environments:
  - One with standard Python 3.14 (with GIL)
  - Another with free-threaded Python 3.14 (3.14t, without GIL, `python3.14t -m venv .venv`)

Different workloads were benchmarked. When running the benchmarks, the GIL status was checked to ensure the correct
interpreter was used.

- GIL status can be checked using any of the following methods:

```python
import sys

print(sys._is_gil_enabled())  # True if GIL is enabled, False otherwise
```

OR:

```python
import sysconfig

sysconfig.get_config_var("Py_GIL_DISABLED")  # True if GIL is disabled, False otherwise
```

- The above is wrapped in check_gil.py file (used in benchmarks):

---
<details  markdown="1">

<summary><strong>View `check_gil.py` code</strong></summary>

```python
import sys
import sysconfig


def show_gil_status():
  gil_status = sys._is_gil_enabled()

  print(F"{sys._is_gil_enabled()=}")

  if gil_status:
    print("\nRunning in default interpreter - GIL is enabled\n")
  else:
    print("\nRunning in Free threaded interpreter - GIL is disabled\n")


def check_free_threading_support():
  print(f"\n{sysconfig.get_config_vars().get('Py_GIL_DISABLED')=}\n")


if __name__ == '__main__':
  check_free_threading_support()

  show_gil_status()
```

</details>

---

### First benchmark - Single Threaded Program

The first benchmark involves running a single threaded program that sums numbers from 1 to 1 million, repeated 100 times
and timed using `timeit` module.

---

<details  markdown="1">

<summary><strong>View benchmarking code</strong></summary>

```python

import timeit

from check_gil import show_gil_status


def single_threaded_benchmark():
  show_gil_status()

  # Sum of numbers from 1 to 1 million
  code_to_test = """

total = 0
for i in range(1_000_000):
    total += i

"""

  # Use timeit to measure execution time - Run the code 100 times
  execution_time = timeit.timeit(code_to_test, number=100)

  print(f"Execution time: {execution_time:.6f} seconds")


if __name__ == '__main__':
  single_threaded_benchmark()
```

</details>

---


> Benchmark Results: In my system, the free threaded execution was ~15% slower than default interpreter. Default
> interpreter
> completed in ~3s, while free-threaded took ~3.5s.
{: .prompt-info }

Execution time of individual runs are added in the next section, in the `Observations` table.

### I/O Bound Program

Next, let's benchmark an I/O bound program that performs file write and read operations.

We execute the code in single threaded mode as well as multi-threaded mode using `ThreadPoolExecutor` and repeat both
with GIL enabled and disabled.

The code creates a temporary file, writes data to it in chunks, forces `flush` and `fsync` to ensure data is committed
to disk,
then reads the data back in chunks. This simulates a realistic I/O workload.

---

<details  markdown="1">

<summary><strong>View benchmarking code</strong></summary>

```python

import os
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, wait, ALL_COMPLETED

from check_gil import show_gil_status

FILE_MB = 24  # total temp file size per op

CHUNK_KB = 64  # write/read granularity

SINGLE_OPS = 8  # Single threaded executions

MULTI_OPS = 12  # Multi-threaded executions
THREADS = 6

# ===== Derived =====
_CHUNK_BYTES = CHUNK_KB * 1024
_TOTAL_CHUNKS = (FILE_MB * 1024 * 1024) // _CHUNK_BYTES
BUF = b"A" * _CHUNK_BYTES


def _write_pass(f, buf):
  """Write the buffer repeatedly across the file, forcing flush+fsync each time to ensure data is committed to disk."""
  f.seek(0)

  # make sure each write is flushed and synced to disk - to increase IO load.
  for _ in range(_TOTAL_CHUNKS):
    f.write(buf)
    f.flush()
    os.fsync(f.fileno())


def _read_pass(f):
  """Read the entire file back chunk by chunk to simulate sequential disk read workload."""
  f.seek(0)
  remaining = _TOTAL_CHUNKS
  while remaining > 0:
    data = f.read(_CHUNK_BYTES)
    if not data:
      break
    remaining -= 1


def io_bound():
  """Perform one full write+read cycle on a temporary file with forced disk syncs, then clean up the file."""
  tmp = tempfile.NamedTemporaryFile(prefix="io_bench_", delete=False)
  tmp_name = tmp.name
  tmp.close()
  try:
    with open(tmp_name, "wb", buffering=0) as f0:
      f0.truncate(FILE_MB * 1024 * 1024)

    flags = os.O_RDWR | os.O_CREAT

    fd = os.open(tmp_name, flags, 0o600)
    f = os.fdopen(fd, "r+b", buffering=0)

    try:
      _write_pass(f, BUF)
      _read_pass(f)
    finally:
      f.close()

  finally:
    try:
      os.remove(tmp_name)
    except Exception:
      pass
  return "IO task done!"


def single_threaded():
  for _ in range(SINGLE_OPS):
    io_bound()


def multi_threaded():
  with ThreadPoolExecutor(max_workers=THREADS) as executor:
    futs = [executor.submit(io_bound) for _ in range(MULTI_OPS)]
    wait(futs, return_when=ALL_COMPLETED)


def run_benchmark():
  t0 = time.time()
  single_threaded()
  print(f"Single thread Exec Time: {time.time() - t0:.2f}s")

  t1 = time.time()
  multi_threaded()
  print(f"Multi thread Exec Time: {time.time() - t1:.2f}s")


if __name__ == '__main__':
  show_gil_status()
  print(f"[Config] FILE_MB={FILE_MB}, CHUNK_KB={CHUNK_KB} "
        f"SINGLE_OPS={SINGLE_OPS}, MULTI_OPS={MULTI_OPS}, THREADS={THREADS}")
  run_benchmark()
```

</details>

---


> Benchmark Results: In case of this I/O bound operation, both interpreters performed comparably. Single threaded
> execution took ~2.9s in both interpreters. Multi-threaded execution took ~2.4s in both interpreters.
{: .prompt-info }

### CPU Bound Program

The task involves performing a computationally intensive operation. We calculate primes upto the upper limit of 2
million.

The task is done using two modes:

1. Single-threaded mode: The prime counting function is executed in a single thread.
2. Multi-threaded mode: The prime counting function is divided into chunks, and each chunk is processed in a separate
   thread using `ThreadPoolExecutor`. This way, we can see the multi-threading related performance changes.

---

<details  markdown="1">

<summary><strong>View benchmarking code</strong></summary>

```python

import math
import time
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

# CPU bound task: count primes up to UPPER

# Upper limit for prime search - 2 Million
UPPER = 2_000_000

# Chunk size for multithreading
CHUNK_SIZE = 50_000


def is_prime(n: int) -> bool:
  if n < 2:
    return False
  if n % 2 == 0:
    return n == 2
  r = int(math.isqrt(n))

  # check if number is divisible by any odd number up to sqrt(n)
  for f in range(3, r + 1, 2):
    if n % f == 0:
      return False
  return True


def count_primes_range(a: int, b: int) -> int:
  # Count primes in [a, b)
  cnt = 0
  # handle 2 explicitly, then iterate odds
  if a <= 2 < b:
    cnt += 1
  start = max(a, 3)
  if start % 2 == 0:
    start += 1
  for n in range(start, b, 2):
    if is_prime(n):
      cnt += 1
  return cnt


# Calculate primes in single-threaded mode - 3 - 2 Million in a single thread
def single_threaded(upper: int) -> tuple[int, float]:
  t0 = time.perf_counter()
  cnt = count_primes_range(2, upper)
  dt = time.perf_counter() - t0
  return cnt, dt


# Calculate primes in multi-threaded mode using threads. Each thread processes a chunk of 50,000 (CHUNK_SIZE).
def multithreaded_threads(upper: int, max_workers: int | None = None) -> tuple[int, float, int]:
  # Split [2, upper) into chunks and process with threads.

  if max_workers is None:
    max_workers = max(2, os.cpu_count() or 4)

  # Build chunks
  chunks = []
  lo = 2
  while lo < upper:
    hi = min(lo + CHUNK_SIZE, upper)
    chunks.append((lo, hi))
    lo = hi

  t0 = time.perf_counter()
  total = 0
  with ThreadPoolExecutor(max_workers=max_workers) as ex:
    futures = [ex.submit(count_primes_range, a, b) for a, b in chunks]
    for fut in as_completed(futures):
      total += fut.result()
  dt = time.perf_counter() - t0
  return total, dt, max_workers


def main():
  print(f"Computing prime count in [2, {UPPER})")
  cnt1, t1 = single_threaded(UPPER)
  print(f"[Single-threaded] primes={cnt1:,}  time={t1:.2f}s")

  cnt2, t2, k = multithreaded_threads(UPPER)
  print(f"[Multithreaded (threads={k})] primes={cnt2:,}  time={t2:.2f}s")

  # Sanity check: both modes should count the same
  print("Results equal:", cnt1 == cnt2)


if __name__ == "__main__":
  main()
```

</details>

---


> Benchmark Results: In single threaded mode, default interpreter completed in ~2.7s, while free-threaded took ~3.1s.
> For multi-threaded
> execution, default interpreter took ~2.7s, while free-threaded completed in ~0.8s - a significant improvement.
{: .prompt-info }

When using free-threaded Python, we got performance penalty in single-threaded code, but significant performance in
multi-threaded mode.

### WSGI App with Flask

Flask app is run in development mode with Flask's built-in server (multi-threaded by default). So the WSGI server can be
thought of as a multi-threaded server.

We have two API Endpoints defined - 1 running I/O bound operation & other running CPU bound task.

We benchmark the endpoints using load testing tool [k6](https://k6.io/). k6 creates multiple virtual users (VUs)
simulating real-users of the application and makes requests to the endpoints.

---

<details  markdown="1">

<summary><strong>View Flask `app.py`</strong></summary>

```python

import threading

from flask import Flask

import tempfile
import os

from check_gil import show_gil_status

app = Flask(__name__)


# CPU-bound task
def heavy_computation():
  # sum of squares from 0 to 10 million
  return sum(i * i for i in range(10 ** 7))


# Routes
@app.route('/')
def root():
  return f"{threading.active_count()=}"


# Routes
@app.route('/cpu')
def cpu_bound():
  print(threading.active_count())
  heavy_computation()
  return "CPU task done!"


@app.route('/io')
def io_bound():
  print(threading.active_count())

  with tempfile.TemporaryFile() as f:
    f.write(b"Hello, World!" * 10000000)
    f.seek(0)
    f.read()
    os.remove(f.name)  # Added for more IO work

  with tempfile.TemporaryFile() as f:
    f.write(b"Hello, World!" * 10000000)
    f.seek(0)
    f.read()
    os.remove(f.name)  # Added for more IO work

  with tempfile.TemporaryFile() as f:
    f.write(b"Hello, World!" * 10000000)
    f.seek(0)
    f.read()
    os.remove(f.name)  # Added for more IO work

  return "IO task done!"


if __name__ == '__main__':
  show_gil_status()

  # By default, Flask's built-in server is multi-threaded.
  # This can be verified by visiting the root endpoint (/).
  app.run()
```

</details>

---


Benchmarks were done using the k6. The benchmark scripts used are
available [here](https://github.com/adarshdigievo/pycon_jp_goodbye_gil_talk/tree/master/flask_app/benchmark)

I configured k6 to run for 20 seconds with 15 virtual users (VUs) making requests to the Flask app endpoints. The
benchmark was done using `k6 run benchmark_io.js` and `k6 run benchmark_cpu.js` commands.


> Results: For I/O bound endpoint, both interpreters performed comparably - ~31-32 requests completed in 20 seconds. For
> CPU bound endpoint, free-threaded Python showed significant improvement - ~91 requests completed in 20 seconds,
> compared to ~47 requests with GIL enabled.
{: .prompt-info }

The results indicate that in our WSGI app, free-threaded Python can handle CPU-bound endpoints more efficiently in a
multi-threaded
environment, while I/O-bound workloads remain largely unaffected by the presence or absence of the GIL.

## Observations

The below table shows the consolidated benchmark results:

| File                      | GIL Enabled | Free Threaded |
|---------------------------|-------------|---------------|
| 1_single_threaded.py      | ~3.0s       | ~3.5s         |
| 2_io_bound_single_thread  | ~2.9s       | ~2.9s         |
| 2_io_bound_multithread    | ~2.4s       | ~2.4s         |
| 3_cpu_bound_single_thread | ~2.7s       | ~3.1s         |
| 3_cpu_bound_multithread   | ~2.7s       | ~0.8s         |
| flask_app_io_bound        | 31 req/20s  | 32 reqs/20s   |
| flask_app_cpu_bound       | 47 req/20s  | 91 req/20s    |

For flask app, the benchmark lists the number of requests completed in 20 seconds (higher the better).

Summary of benchmarks:

- Single threaded - Worse performance in free-threaded mode.
- I/O Bound programs - Minimal/no impact. Both interpreters perform comparably.
- For **CPU Bound, Multi-threaded** Programs, free-threaded Python shows significant performance improvements.

## The future of Free Threaded Python

1. In 2024, CPython 3.13 was released with support for a --disable-gil build time flag.
   There are two ABIs for CPython, one with the GIL and one without. Extension authors
   target both ABIs.
2. We are here now (PEP 779 Acceptance): “The free-threaded build of Python is now supported
   and no longer experimental".
3. After 2–3 releases, (i.e., in 2026–2027), CPython is released with the GIL controlled by a
   runtime environment variable or flag. The GIL is enabled by default. There is only a single
   ABI.
4. After another 2–3 release (i.e., 2028–2030), CPython switches to the GIL being disabled
   by default. The GIL can still be enabled at runtime via an environment variable or
   command line flag.

## Migration Checklist

Free-threaded Python:

- Great for CPU bound Tasks + Threading
- Great for scenarios where parallelisation is needed - but multiprocessing is too
  complex / not suitable

Precautions:

- Always benchmark using your own workload before making a switch.
- Watch out for library compatibility issues/bugs. Proper testing is needed before production adoption with your
  workloads.

## Conclusion

- Free-threaded Python in 3.14 shows significant performance improvements for CPU-bound multithreaded workloads,
  while maintaining comparable performance for I/O-bound tasks. A new
  concurrency mode is unlocked for CPU bound programs without overhead
  of inter-process communication

- Single-threaded performance sees a slight decrease in performance. The default interpreter works best for
  single-threaded programs. The performance penalty will be reduced further in future releases.

- Performance is comparable for I/O-bound workloads in both modes.

---

PS: I published my book "Deep Dive Python" last month. [Get the book](https://deepdivepython.com) to learn Python
concepts straight from real open-source code.
