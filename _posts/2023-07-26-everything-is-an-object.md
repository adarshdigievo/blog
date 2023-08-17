---
title:  It is said that, in Python everything is an object. I took that literally.
date: 2023-07-26 22:27:11 +05:30
categories: [Python, meta]
tags: [python, metaprogramming, object]     # TAG names should always be lowercase
---
You must have heard the saying that *"In Python everything is an object"*. Let's take that statement literally and test it.

### Let's check:

> The code in the below examples works as-is. No additional imports are required.
{: .prompt-info }

We will be using isinstance function to check if 'everything' is an object.
> From [Python Docs](https://docs.python.org/3/library/functions.html#isinstance):
>  
> builtin function **isinstance(object, classinfo)**:
> 
>  Return True if the object argument is an instance of the classinfo argument, or of a (direct, indirect, or virtual) subclass thereof. If object is not an object of the given type, the function always returns False

#### 1. int
```python
>>> dummy_int = 3
>>> isinstance(dummy_int, object)
True
```

Testing the class 'int' itself
```python
>>> isinstance(int, object)
True
```
#### 2. Testing a user defined class

```python
>>> class DummyClass:
... 	pass

>>> dummy_obj = DummyClass()
>>> isinstance(dummy_obj, object)
True
>>> isinstance(DummyClass, object)
True

```
#### 3. list

```python
>>> l = [1, 2, 3, 4]
>>> isinstance(l, object)
>>> True
```
#### 4. Functions

```python
>>> def dummy_function():
...     pass
...
>>> isinstance(dummy_function, object)
True
```

Testing the 'isinstance' function
```python
>>> isinstance(isinstance, object)
True
```

#### 5. Exceptions and tracebacks
```python
>>> import sys
>>> try:
...     raise Exception()
... except Exception as e:
...     exc = e
...     traceback = sys.exc_info()[2]
...

>>> isinstance(traceback, object)
True
>>> isinstance(exc, object)
True
```

#### 6. Modules

```python
>>> import math
>>> math
<module 'math' (built-in)>
>>> isinstance(math, object)
True
```

### Why:

>From [Python docs](https://docs.python.org/3/library/functions.html?highlight=object#object):
>
> **class object**:
>
> Return a new featureless object. object is a base for all classes. It has methods that are common to all instances of Python classes. This function does not accept any arguments.


The object class is the base class for all other classes in Python. This means that all Python classes inherit from the object class, either directly or indirectly. The object class provides a number of methods that are common to all objects in Python, such as the __init__() method, and the __setattr__() method. These methods allow objects to be created, accessed, and modified.

We can verify that 'object' is the base class of other classes by using the base dunder.
```python
>>> import math
>>> math
<module 'math' (built-in)>
>>> type(math).__base__
<class 'object'>
```
```python
>>> dummy_int = 10_000
>>> type(dummy_int)
<class 'int'>
>>> type(dummy_int).__base__
<class 'object'>
```
```python
>>> type(type)
<class 'type'>
>>> type.__base__
<class 'object'>
```
