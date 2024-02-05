---
title: Evolution of the `sort` in Python and the Role of `functools.cmp_to_key`
date: 2024-02-05 18:59:00 +05:30
categories: [Python, Snippets, sort]
tags: [python, sort]     # TAG names should always be lowercase
---

In Python, the `sort` method and the `sorted` callable are commonly used for sorting operations. 
`sort` is a list method which modifies the list in-place, whereas `sorted` takes an iterable as its first argument and returns a sorted list containing the iterables elements. 

Both of these use [Timsort algorithm](https://en.wikipedia.org/wiki/Timsort) under the hood, to perform the sorting operation.

In this article, we will explore the evolution of sorting in Python from Python 2 to 3 and will look into the `cmp_to_key` function from `functools`. 

## Background

Below are the type annotations for `sort` and `sorted`, from the [Python typeshed library](https://github.com/python/typeshed/blob/2c295057659d2b8bdfe632012c04497273b002b6/stdlib/builtins.pyi#L1665).

```python
@overload
def sorted(
    __iterable: Iterable[SupportsRichComparisonT],
    *,
    key: None = None,
    reverse: bool = False
) -> list[SupportsRichComparisonT]:
    ...


@overload
def sorted(
    __iterable: Iterable[_T],
    *,
    key: Callable[[_T], SupportsRichComparison],
    reverse: bool = False
) -> list[_T]:
    ...


class list(MutableSequence[_T]):
    @overload
    def sort(
        self: list[SupportsRichComparisonT], *, key: None = None, reverse: bool = False
    ) -> None:
        ...

    @overload
    def sort(
        self, *, key: Callable[[_T], SupportsRichComparison], reverse: bool = False
    ) -> None:
        ...
```

Both `sort` and `sorted` accept an optional keyword-only argument `key`. It should be a callable and if supplied, will be used to calculate the comparison key.

> From Python docs:
> 
> *key* specifies a function of one argument that is used to extract a comparison key from each list element (for example, `key=str.lower`).
> The key corresponding to each item in the list is calculated once and then used for the entire sorting process.

Now lets take a look at the [Python 2 docs for the sorted built-in](https://docs.python.org/2.7/library/functions.html?highlight=sort#sorted):

```text
 sorted(iterable[, cmp[, key[, reverse]]])

    Return a new sorted list from the items in iterable.

    The optional arguments cmp, key, and reverse have the same meaning as those for the list.sort() method (described in section Mutable Sequence Types).

    cmp specifies a custom comparison function of two arguments (iterable elements), 
    which should return a negative, zero or positive number depending on whether the first argument is considered smaller than, equal to, or larger than the second argument.
    
    ...
```

There is an additional argument `cmp` compared to what we have seen in Python 3.

The docs also mentions:
> In general, the key and reverse conversion processes are much faster than specifying an equivalent cmp function. This is because cmp is called multiple times for each list element while key and reverse touch each element only once. Use functools.cmp_to_key() to convert an old-style cmp function to a key function.

The `cmp` argument was removed in Python 3 and the [cmp_to_key helper](https://docs.python.org/3/library/functools.html#functools.cmp_to_key) to convert comparison functions to new-style key functions has been added to the functools module.

## Usage in the Wild

If we have a comparison function (which takes two arguments and returns their comparison result), this can be converted to a sort key by using `cmp_to_key` function, provided in the `functools` module.

The below example from the [pretty_midi](https://github.com/craffel/pretty-midi), a MIDI processing library illustrates the use of `cmp_to_key`.

[Link to source code](https://github.com/craffel/pretty-midi/blob/07f4174ef701c3355fb6d4aa72ae968026d5df10/pretty_midi/pretty_midi.py#L1473)
```python

class PrettyMIDI(object):
    """A container for MIDI data in an easily-manipulable format."""

    ...

    def write(self, filename):
        """Write the MIDI data out to a .mid file."""

        def event_compare(event1, event2): # <--- (1)
            """Compares two events for sorting.

            Events are sorted by tick time ascending. Events with the same tick
            time ares sorted by event type. Some events are sorted by
            additional values. For example, Note On events are sorted by pitch
            then velocity, ensuring that a Note Off (Note On with velocity 0)
            will never follow a Note On with the same pitch.

            Parameters
            ----------
            event1, event2 : mido.Message
               Two events to be compared.
            """

            secondary_sort = {
                "set_tempo": lambda e: (1 * 256 * 256),
                "time_signature": lambda e: (2 * 256 * 256),
                "key_signature": lambda e: (3 * 256 * 256),
                "lyrics": lambda e: (4 * 256 * 256),
                "text_events": lambda e: (5 * 256 * 256),
                "program_change": lambda e: (6 * 256 * 256),
                "pitchwheel": lambda e: ((7 * 256 * 256) + e.pitch),
                "control_change": lambda e: (
                    (8 * 256 * 256) + (e.control * 256) + e.value
                ),
                "note_off": lambda e: ((9 * 256 * 256) + (e.note * 256)),
                "note_on": lambda e: ((10 * 256 * 256) + (e.note * 256) + e.velocity),
                "end_of_track": lambda e: (11 * 256 * 256),
            }
            # If the events have the same tick, and both events have types
            # which appear in the secondary_sort dictionary, use the dictionary
            # to determine their ordering.
            if (
                event1.time == event2.time
                and event1.type in secondary_sort
                and event2.type in secondary_sort
            ):
                return (secondary_sort[event1.type](event1) - 
                        secondary_sort[event2.type](event2))

            # Otherwise, just return the difference of their ticks.
            return event1.time - event2.time

        # Create track 0 with timing information
        timing_track = mido.MidiTrack()

        ...  # Code processing the timing_track

        # Sort the (absolute-tick-timed) events.
        timing_track.sort(key=functools.cmp_to_key(event_compare)) # <--- (2)

        ...
```

The `event_compare` function (pointed in comment (1)) provides a specific comparison logic for MIDI events, ensuring they are sorted correctly by their tick time and type, along with additional criteria for certain event types. 
Then, `functools.cmp_to_key` is used to convert this comparison function into a key function ( (pointed in comment (2))).

## Should You Use It

As `cmp_to_key` was aimed to help transition from Python 2 style `cmp` functions to `key` functions, its usage is not very common in newer projects. However, it can come in handy when we already have a comparison function defined in our code, to compare two objects and need to sort an iterable of these objects. In such a case, cmp_to_key will allow us to reuse our comparison logic (defined in our comparison function) without defining a new key function.   

## Behind the Scenes

Below is the [source code of `cmp_to_key`](https://github.com/python/cpython/blob/87cd20a567aca56369010689e22a524bc1f1ac03/Lib/functools.py#L207) from the functools module

```python
def cmp_to_key(mycmp):
    """Convert a cmp= function into a key= function"""
    class K(object):
        __slots__ = ['obj']
        def __init__(self, obj):
            self.obj = obj
        def __lt__(self, other):
            return mycmp(self.obj, other.obj) < 0
        def __gt__(self, other):
            return mycmp(self.obj, other.obj) > 0
        def __eq__(self, other):
            return mycmp(self.obj, other.obj) == 0
        def __le__(self, other):
            return mycmp(self.obj, other.obj) <= 0
        def __ge__(self, other):
            return mycmp(self.obj, other.obj) >= 0
        __hash__ = None
    return K

```

`cmp_to_key` intelligently maps the original comparison function to a key function suitable for sorting, by implementing all the comparsion dunders. 

It returns a new callable (class K) with all the comparison dunders which will be called during the sorting process to calculate the sort key. Since the sorting process compare each of the calculated keys, the comparison dunders will get invoked, and they will return based on the result from the original comparison function.

For example, during sorting, when `K object` < `another K object` needs to be checked, Python will actually call the `lt` dunder method on K. This method simply calls the original cmp function to compare the `obj` attributes of the two K instances.

---

I share interesting Python snippets 🐍 like this from open-source projects illustrating Python language features in my newsletter, "Python in the Wild". 

Subscribe to the newsletter on [Substack](https://adarshd.substack.com/) or [Linkedin](https://www.linkedin.com/newsletters/python-in-the-wild-7155981512197181440/) to receive new Pythonic posts to your email 💌🚀.
