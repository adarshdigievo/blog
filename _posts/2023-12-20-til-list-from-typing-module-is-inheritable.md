---
title: List from Typing module is inheritable
date: 2023-12-20 11:55:00 +05:30
categories: [Python, TIL, List, Typing]
tags: [python, til, list, typing]     # TAG names should always be lowercase
---

> TIL - "Today I learned" series of Posts are short notes of new things I encounter with Python.

While browsing the source of SQLAlchemy, I came across a [custom list class](https://github.com/sqlalchemy/sqlalchemy/blob/b12b7b120559d07a6f24fb2d6d29c7049084b4a5/lib/sqlalchemy/ext/orderinglist.py#L231)

The custom class is created by inheriting from `List` from `typing`, rather than the builtin `list` or the `UserList` class provided by [collections](https://docs.python.org/3/library/collections.html#userlist-objects)

It works.

```python
from typing import List


class CustomList(List):
    pass


print(CustomList.__mro__)

# (<class '__main__.CustomList'>, <class 'list'>, <class 'typing.Generic'>, <class 'object'>)
```

The builtin `list` can be seen as a parent class of CustomList.

Normal list operations also work as expected.

```python
from typing import List


class CustomList(List):
    pass


c = CustomList()
c.append("foo")
print(c)

# ['foo']
```

Now, what if we try to instantiate `List` directly?

```python
list_obj1 = list()  # Works
list_obj2 = List()  # TypeError: Type List cannot be instantiated; use list() instead
```

Let's see why this happens.

The `List` class is defined in typing as an alias of the `list` class.

```python
# CPython - typing.py (https://github.com/python/cpython/blob/4afa7be32da32fac2a2bcde4b881db174e81240c/Lib/typing.py#L2609)

List = _alias(list, 1, inst=False, name='List')
```

This `_alias` creates `List` as a child instance of `_BaseGenericAlias`. See that the `inst` attribute is set to False above.


Now, let's take a look at the `_BaseGenericAlias` class:
```python
# CPython - typing.py (https://github.com/python/cpython/blob/4afa7be32da32fac2a2bcde4b881db174e81240c/Lib/typing.py#L1107)

class _BaseGenericAlias(_Final, _root=True):
    """The central part of internal API.

    This represents a generic version of type 'origin' with type arguments 'params'.
    There are two kind of these aliases: user defined and special. The special ones
    are wrappers around builtin collections and ABCs in collections.abc. These must
    have 'name' always set. If 'inst' is False, then the alias can't be instantiated,
    this is used by e.g. typing.List and typing.Dict.
    """
    def __init__(self, origin, *, inst=True, name=None):
        self._inst = inst
        self._name = name
        self.__origin__ = origin
        self.__slots__ = None  # This is not documented.

    def __call__(self, *args, **kwargs):
        if not self._inst:
            raise TypeError(f"Type {self._name} cannot be instantiated; "
                            f"use {self.__origin__.__name__}() instead")
        ...
```

The call dunder is overridden to raise a type error if the `_inst` attribute of the alias is False. The `__call__` function gets invoked when we call the children of the `_BaseGenericAlias` class, in our case, the `List`.

As you can see in the docstring of `_BaseGenericAlias`:

> If 'inst' is False, then the alias can't be instantiated, this is used by e.g. typing.List and typing.Dict.

Summarizing, 
- `typing.List` behaves like a `list` when used for inheritance 
- But can't be used directly, just like the `list` for instantiation.
