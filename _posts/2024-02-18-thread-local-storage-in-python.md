---
title: Thread Local Data in Python
date: 2024-02-18 16:59:00 +05:30
categories: [Python, Snippets, threading]
tags: [python, threading]     # TAG names should always be lowercase
---
Since threads in Python share the memory space of their parent process, we might need to define thread-specific variables for specific use cases to avoid unintended side effects.

In this article, we will:

1. Explore Thread local storage: Python threading module's solution for thread-specific/thread-private values.
2. See its real-world example from Open-Source ( usage in the Peewee ORM library).
3. Look at the CPython source code to see how thread local storage is implemented under the hood.


## Background

Threads share the memory space of their parent process. 
This will allow us to seamlessly access and share variables, data structures, etc., across threads. 
But this comes with its own challenges. 
There may be scenarios where we need to isolate variables and might need to store data specific to each thread. 
Thread local storage can be leveraged in this case. 

We can use [`local()` found in the `threading` module](https://docs.python.org/3/library/threading.html#thread-local-data) to define thread-local variables.


```python
import threading
import time

# Create a thread-local storage object (1)
thread_local = threading.local()


def init_data(number):
    thread_local.number = number * 100


def show_data():
    print(f"Thread {threading.current_thread().name} has number {thread_local.number}")


def worker(number):
    init_data(number)

    for _ in range(3):
        time.sleep(1)
        show_data()


thread1 = threading.Thread(target=worker, name="A", kwargs={"number": 1})
thread2 = threading.Thread(target=worker, name="B", kwargs={"number": 2})

thread1.start()
thread2.start()

thread1.join()
thread2.join()

```
The program output will be:
```
Thread A has number 100
Thread B has number 200
Thread A has number 100
Thread B has number 200
Thread A has number 100
Thread B has number 200
```

As seen in `comment #(1)`, a thread-local storage object was created and assigned to the variable `thread_local`. 
Arbitrary attributes can be assigned to this variable, which are specific to the thread that performs the assignment and is isolated from others.

In the example, each thread stores its own `number` attribute to the thread_local object and accesses the thread-specific value during their concurrent execution.

## Usage in the Wild

Peewee, a Python ORM, utilizes thread-local data in its `ThreadSafeDatabaseMetadata` to support dynamic database switches at runtime in multithreaded applications.

The source code can be found [here.](https://github.com/coleifer/peewee/blob/01b2d94a4029858b9d2b1bee6fac40eed27ad9ad/playhouse/shortcuts.py#L322)

```python
# File: peewee/playhouse/shortcuts.py

class ThreadSafeDatabaseMetadata(Metadata):
    """
    Metadata class to allow swapping database at run-time in a multi-threaded
    application. To use:

    class Base(Model):
        class Meta:
            model_metadata_class = ThreadSafeDatabaseMetadata
    """

    def __init__(self, *args, **kwargs):
        # The database attribute is stored in a thread-local.
        self._database = None
        self._local = threading.local()
        super(ThreadSafeDatabaseMetadata, self).__init__(*args, **kwargs)

    def _get_db(self):
        return getattr(self._local, "database", self._database)

    def _set_db(self, db):
        if self._database is None:
            self._database = db
        self._local.database = db

    database = property(_get_db, _set_db)
```

In multithreaded applications using `peewee` ORM, database switching at runtime without using `ThreadSafeDatabaseMetada` can lead to errors. 
If multiple threads work in parallel and one thread changes the connection parameters, this can lead to errors such as writing to a wrong DB, inconsistent writes (in case of non-atomic DB operations), etc.

`ThreadSafeDatabaseMetada` solves this by keeping the database attributes in a thread-local object (`self._local`). In this way, dynamic changes to the database will only affect the thread that made the change. Other threads will keep working with their existing databases.


## Should I use it?

Thread-local storage should be used when:

You are writing a multi-threaded application (obviously) and:

- If some variables are used by the current thread only and are not relevant to the main thread/other threads.
- You find out that changes made by one thread can lead to unintended side effects in other concurrent threads.

Generally, if you are working with multiple threads and there is shared mutable data:

You should check if sharing these data across threads is actually needed.

1. If sharing can be avoided, use thread-local storage to make the data specific to each thread.

2. Otherwise, implement locks or other synchronization primitives to enforce thread safety.

**Note**: Context variables from the [contextvars standard library module](https://docs.python.org/3.12/library/contextvars.html#module-contextvars) can be used as an alternative to `threading.local()`. They work with multithreading as well as asyncio to store context-specific information. In the case of asyncio programs, context variables allow each coroutine task to have its own set of variables isolated from other (asyncio) tasks.

## Behind the scenes

The Python implementation of threading.local can be found in the [`/Lib/_threading_local.py` path in CPython source code.](https://github.com/python/cpython/blob/3.12/Lib/_threading_local.py)

The `_localimpl` class is used to store thread-local values.
```python
class _localimpl:
    """A class managing thread-local dicts"""
    __slots__ = 'key', 'dicts', 'localargs', 'locallock', '__weakref__'

    def __init__(self):
        # The key used in the Thread objects' attribute dicts.
        # We keep it a string for speed but make it unlikely to clash with
        # a "real" attribute.
        self.key = '_threading_local._localimpl.' + str(id(self))
        # { id(Thread) -> (ref(Thread), thread-local dict) }
        self.dicts = {}
```
The `dicts` attribute maps the id of a thread to a tuple. The tuple is two-membered, containing a reference to the thread and the actual dictionary storing thread local values (`# { id(Thread) -> (ref(Thread), thread-local dict) }`).

Looking at a few other methods of the class:
```python
class _localimpl:
    """A class managing thread-local dicts"""
    def get_dict(self):
        """Return the dict for the current thread. Raises KeyError if none
        defined."""
        thread = current_thread()
        return self.dicts[id(thread)][1] # (1) returning the local dict of current thread

    def create_dict(self):
        """Create a new dict for the current thread, and return it."""
        localdict = {}
        key = self.key
        thread = current_thread()
        idt = id(thread)
        ...
        wrthread = ref(thread, thread_deleted)
        thread.__dict__[key] = wrlocal
        self.dicts[idt] = wrthread, localdict  # (2) Populating the `dicts` with a new thread
        return localdict
```

The comments `#(1)` & `#(2)` illustrate operations on the `dicts` attribute discussed previously.

`(1)`: Returns the local data dictionary corresponding to the current thread accessing it.

`(2)`: This part initializes the local dict for a new thread.

Then, we have the actual `local` callable, which we call as `threading.local()` to initialize a thread-local object.

```python

@contextmanager
def _patch(self):
    impl = object.__getattribute__(self, '_local__impl')
    try:
        dct = impl.get_dict()  # (3) this will return local dict of current thread -/
                               # see its definition in the above snippet
    except KeyError:
        ...
        # calls _localimpl`s create_dict to create & init a new dict
    with impl.locallock:
        object.__setattr__(self, '__dict__', dct) # (4) <The magic> Temporarily replaces -/
        # the instance's __dict__ attribute with the thread-specific dictionary.
        
        yield


class local:
    __slots__ = '_local__impl', '__dict__'

    def __new__(cls, /, *args, **kw):
        ...

        impl = _localimpl()  # (1) - wraps the _localimpl object in an attribute
        impl.localargs = (args, kw)
        impl.locallock = RLock()  # (2) - Lock for thread safety
        object.__setattr__(self, '_local__impl', impl)
        # We need to create the thread dict in anticipation of
        # __init__ being called, to make sure we don't call it
        # again ourselves.
        impl.create_dict()
        return self

    def __getattribute__(self, name):
        with _patch(self):
            return object.__getattribute__(self, name)

    def __setattr__(self, name, value):
        if name == '__dict__':
            raise AttributeError(
                "%r object attribute '__dict__' is read-only"
                % self.__class__.__name__)
        with _patch(self):
            return object.__setattr__(self, name, value)

    ...
```

Let's look at various parts of the code one by one.

`# (1)`:  An object of `_localimpl` class is created and later stored in `_local__impl` attribute

`# (2)`: RLock() is used on dict operations - Concurrent writes by multiple threads may cause 'lost writes' since dict is not thread-safe.
 
`# (3)`: In the try/except block, the current thread's local data is fetched and assigned to the variable named `dct`.

`# (4)`: The magic happens here. Here is a quick refresher on class attributes before we delve further:
>  A class has a namespace implemented by a dictionary object. Class attribute references are translated to lookups in this dictionary, e.g., C.x is translated to C.__dict__["x"] (although there are a number of hooks which allow for other means of locating attributes).

The `_patch` function we are currently in is a context manager. Using the line marked as `# (4)`, it patches the namespace dictionary of the local class with the `dot` variable (which stores the current-thread specific data).

Since the `__getattribute__` and `__setattr__` dunders of the class `local` use the `_patch` context manager, attribute access performed inside the context will use the thread-local dictionary (`dct`) replacing the class's actual namespace dictionary. 

**Note**: The `Lib/_threading_local.py` starts with the below note:
> Note that this module provides a Python version of the threading.local
 class. Depending on the version of Python you're using, there may be a
 faster one available. You should always import the `local` class from
 `threading`.

The code we looked at might not be the one running in our Python installations. I think newer Pythons versions are using `C` implementations of the thread local functionality for efficiency.

---

I share interesting Python snippets 🐍 like this from open-source projects illustrating Python language features in my newsletter, "Python in the Wild". 

Subscribe to the newsletter on [Substack](https://adarshd.substack.com/) or [Linkedin](https://www.linkedin.com/newsletters/python-in-the-wild-7155981512197181440/) to receive new Pythonic posts to your email 💌🚀.
