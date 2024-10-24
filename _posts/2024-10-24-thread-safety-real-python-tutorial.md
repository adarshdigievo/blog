---
title: Thread Safety in Python - My first tutorial for Real Python
date: 2024-10-24 18:00:00 +05:30
categories: [ Python, threading ]
tags: [ python, threading ]     # TAG names should always be lowercase
---

My first tutorial for Real Python got published 🎉

"Python Thread Safety: Using a Lock and Other Techniques": [https://realpython.com/python-thread-lock/](https://realpython.com/python-thread-lock/)

### Why thread safety?

Below is a classic example of creating a singleton class is Python:

```python
class SingletonClass(object):
  def __new__(cls):
    if not hasattr(cls, 'instance'):
      cls.instance = super(SingletonClass, cls).__new__(cls)
    return cls.instance
```

The `SingletonClass` is supposed to have only 1 object, but the code can lead to the creation of more than one instances
when executed in a multithreaded environment.

Read the tutorial to spot such race conditions and learn to fix them using Python's synchronization primitives.

Read now at Real Python Website: [https://realpython.com/python-thread-lock/](https://realpython.com/python-thread-lock/)

---
---

I share interesting Python snippets from open-source projects illustrating Python language features in my
newsletter, "Python in the Wild".

Subscribe to the newsletter on [Substack](https://adarshd.substack.com/)
or [Linkedin](https://www.linkedin.com/newsletters/python-in-the-wild-7155981512197181440/) to receive new Pythonic
posts to your email 💌🚀.
