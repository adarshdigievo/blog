---
title:  Building a Python REPL Themed Portfolio Website
date: 2023-08-17 15:00:11 +05:30
categories: [Python, portfolio]
tags: [python, metaprogramming, repl, portfolio]     # TAG names should always be lowercase
---
# Building a Python REPL Themed Portfolio Website


Launched the initial version of my Python REPL-themed portfolio website (with an ASCII art photo gallery) 🚀.

![site home page](/assets/img/posts/building-a-portfolio-REPL/portfolio-repl-home.png)
_Home Page_


Website: [adarshd.dev](https://adarshd.dev) or [adarsh.pizza](https://adarsh.pizza) 🍕

Source code: [github.com/adarshdigievo/Portfolio-REPL/](https://github.com/adarshdigievo/Portfolio-REPL/)

### Internals

- UI layer and Python layer - both executed in the client browser

The site can be considered to have two components. One is the terminal Ui which is powered by [Xterm.js](https://github.com/xtermjs/xterm.js/). Accepting user input, handling the events, and printing the results are handled using Xterm functions.

The second component is the Python interpreter which runs the code and returns the result to xterm for printing in terminal UI. This is created using Python's built-in InteractiveInterpreter class found in
[code module](https://docs.python.org/3/library/code.html) of stdlib.

- Loading the portfolio data

The portfolio data like skills, experience, etc. are fetched from the free API from [Gitconnected](https://gitconnected.com/) and follow the open [Jsonresume standard](https://jsonresume.org/)

- Metaprogramming

I love metaprogramming and have (over)used some metaprogramming concepts on the site. I wanted the variables storing my portfolio to be dynamic. This is possible with Descriptors where we can call custom getters when an attribute is accessed.

Currently, I have mapped profile data variables passed to the REPL like SKILLS, EXPERIENCE, etc into attributes of the class named `ProfileData` and have created descriptor attributes using `ProfileFetchDescriptor`. This descriptor is responsible for calling Gitconnected API and reloading the data if it is expired.

I have stored all profile data fields in an enum named `ProfileFields` which is used multiple times when I need to list all available pre-loaded variables in the REPL.

```python
attrs = {
        field.name.lower(): ProfileFetchDescriptor(field) for field in ProfileFields
    }

    # Dynamically generate a class named ProfileData. Each member attribute of the class is a descriptor
    ProfileData = type("ProfileData", (), attrs)
```

- Redirecting stdout

I needed to get the output of code executed by InteractiveIntrpetor into a string so that it can be printed on the xterm ui. For that, `redirect_stdout` and `redirect_stderr` functions from contextlib were used.

```python

import io
from contextlib import redirect_stdout

with io.StringIO() as buf, redirect_stdout(buf):
    print('redirected')
    output = buf.getvalue()
```

This output is then written on the xterm terminal.

- Ascii Art powered photo Gallery

In the [gallery code](https://github.com/adarshdigievo/Portfolio-REPL/blob/c6857009255847a8bc507e53a0547a8d45b8c286/scripts/py/gallery.py), I have used [ascii magic](https://pypi.org/project/ascii-magic/) library to convert images into colored text and it is printed directly to an xterm terminal.

To store image metadata, I have added a [metadata json file](https://github.com/adarshdigievo/Portfolio-REPL/blob/c6857009255847a8bc507e53a0547a8d45b8c286/images/image_meta.json) which includes the path to image resources and the caption to display on each image. The page then does an infinite iteration over the image data displaying each of them one by one. I have not decided to cache the images in Python due to memory worries.

- Opening links

To open links to my blog, photo gallery, etc, another descriptor is used. The descriptor uses webbrowser.open() to open the corresponding link. This Python functionality is supported out of the box in Pyscript. I have created an object of `ProfileLinks` class named `VISIT` 

[Code here](https://github.com/adarshdigievo/Portfolio-REPL/blob/8698ba2b1ccf630d14986953cf9b97b7d2ae664a/scripts/py/index.py#L193)
```python
link_attrs = {
        field.upper(): ProfileLinkDescriptor(field)
        for field in ProfileLinkDescriptor.link_map
    }
    
    ProfileLinks = type("ProfileLinks", (), link_attrs)

    VISIT = (
        ProfileLinks()
    )  # This class contains descriptor attributes which open corresponding webpages on access. Ex: VISIT.BLOG
    
    interpreter.locals |= {"VISIT": VISIT}  # Load the class to interpreter locals

```


### Learnings

Random new things I learned from this project:

- Eruda - JS debugging on mobile browsers

The website had some weird input issues on Chrome-based Android browsers while testing. While searching for a tool to debug JS on mobile browsers, I found [Eruda](https://github.com/liriliri/eruda). Eruda will emulate the desktop browser dev console with almost all features like js console logs, network requests, etc and this was super helpful to debug on mobile devices.


- Pyscript

[Pyscript](https://pyscript.net/) as their tagline says is 'Programming for the 99%'. Pyscript makes it a lot easier to deploy an application with no manual configuration steps needed like pip installs and can be easily hosted as a static site. It is Python for the front end and will be well-suited for data applications (visualizations, graphics, etc).

- Pyodide

The magic of Pyscript exists thanks to Pyodide and webassembly.
[Pyodide](https://pyodide.org/en/stable/) is a python runtime that runs in Webassembly. Pyscript uses Pyodide internally and it can be seen as a convenient wrapper over pyodide. It gets the python code from \<py-script> tags and sends them to the interpreter (which is Pyodide by default, and can be customized) for execution. Refer [makePyscript()](https://github.com/pyscript/pyscript/blob/be79f70f664467f0074e44309451e8aba6f84798/pyscriptjs/src/components/pyscript.ts#L6) or [pyExec()](https://github.com/pyscript/pyscript/blob/be79f70f664467f0074e44309451e8aba6f84798/pyscriptjs/src/pyexec.ts) in the Pyscript source code to see more on the same. Pyscript exposes the power of Pyodide in a simple and convenient manner.

I found the function and variable interoperability b/w Python and JS super convenient. We can call the functions/variables defined in Python using javascript and vice versa. I have used this in the photo gallery page, to print python ascii-magic library output to xterm terminal.

See the example:

```javascript
// js file

var term = new Terminal({
    cursorBlink: false,
    fontSize:6,
    cols:200,
    rows:150
});

term.open(document.getElementById('terminal'));

```

```python
# python file

from js import term  # the js object is now available in Python
  
# can access all js functions defined in xterm js library from Python!
term.clear()
term.write('some_string')

```

Here is the [C Soruce code of the function to_js()](https://github.com/pyodide/pyodide/blob/1c765db28fe279fc590bd2d12d530bdded7aad74/src/core/python2js.c#L754) which is used to convert Python calls as seen above to js and [this is the function toPy()](https://github.com/pyodide/pyodide/blob/1c765db28fe279fc590bd2d12d530bdded7aad74/src/js/api.ts#L343) used to convert js objects to Python.



### Planned updates for the next versions

Web (frontend) development is hard. There are a lot of layout & compatibility issues across multiple platforms and browsers.

When I tested the home page on mobile devices for the first time, inputs were not working on Chromium-based mobile browsers, but were working fine on Firefox focus. I finally ended up with code like this:

```javascript

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
    // onKey event is not firing on android chromium based browser. This workaround is applied in that case.
    console.log('mobile device') }
```


Other tasks planned for coming versions:

- Support multiline inputs (to support function and class definitions)

I guess I might need to switch to InteractiveConsole class of the code module instead of the currently used InteractiveIntrepretor class.

- Switch to py-terminal

Switch to [py-terminal plugin](https://docs.pyscript.net/latest/reference/plugins/py-terminal.html) of Pyscript and perform all term-related tasks (managing history, xterm events, etc) in Python code itself. I can skip the load and init steps of xterm using js since pyscript now support xterm terminal out of the box.
Looking to implement something along the lines of [this Pyscript plugin(emscripten-shell)](https://github.com/JeffersGlass/emscripten-shell/blob/main/pyxterm/src/interactive.py)

- Use a custom on-screen keyboard using [kioskboard.js](https://github.com/furcan/KioskBoard), in case of mobile devices to support arrow keys, command history, etc.

- Develop a visual version of the website

- Support pastes in REPL

- ast based variable parsing

Currently, the profile data variables are mapped to the descriptor attributes using a simple and hacky `string.contains()` call [here](https://github.com/adarshdigievo/Portfolio-REPL/blob/c6857009255847a8bc507e53a0547a8d45b8c286/scripts/py/index.py#L27). I plan to first parse the input code into AST and replace the areas of variable access to use the descriptors.


### Prior Art

- Terminal UI was Adapted from [this Codepen](https://codepen.io/mwelgharb/pen/qBEpLEe).

---

![photo gallery](/assets/img/posts/building-a-portfolio-REPL/photo-gallery.png)
_Ascii Photo Gallery_

Visit the site: [adarshd.dev](https://adarshd.dev)

Photo gallery: [adarshd.dev/gallery.html](https://adarshd.dev/gallery.html)

Source code: [github.com/adarshdigievo/Portfolio-REPL/](https://github.com/adarshdigievo/Portfolio-REPL/)
