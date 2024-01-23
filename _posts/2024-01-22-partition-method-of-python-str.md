---
title: Partition method of Python strings
date: 2024-01-22 16:55:00 +05:30
categories: [Python, Snippets, str]
tags: [python, str]     # TAG names should always be lowercase
---

The partition method of str covers a niche use case - It is useful when a string needs to be split into exactly two parts based on a separator. It returns a three-membered tuple containing the part before, the separator itself, and the part after the separator.
The split method is commonly used for splitting strings, which returns a list whose length can change based on the number of times the separator is present.

```python
host = "localhost:8000"
print(host.split(":"))  # Output: ['localhost', '8000']

host = "localhost"
print(host.split(":"))  # Output:['localhost']

host = ""
print(host.split(":"))  # Output: ['']

```

`partition` is helpful when we need to get precisely two parts from a string using a separator.

```python
server_name = "localhost:5000"
print(server_name.partition(":"))  # Output: ('localhost', ':', '5000')

server_name = "localhost"
print(server_name.partition(":"))  # Output: ('localhost', '', '')

server_name = ""
print(server_name.partition(":"))  # Output: ('', '', '')
```

Using `partition` instead of `split` saves us from additional checks on the result's length when exactly two parts are required.

Flask uses the `partition` method to determine the host and port to use when running the Flask app. You can see the [source code here](https://github.com/pallets/flask/blob/7b5e176d1ab23e183d0403573358299ed6562dce/src/flask/app.py#L588). 

A simplified version of the code is added as below:

```python
def run(
    self,
    host: str | None = None,
    port: int | None = None,
    debug: bool | None = None,
    load_dotenv: bool = True,
    **options: t.Any,
) -> None:
    ...

    server_name = self.config.get("SERVER_NAME")
    sn_host = sn_port = None

    if server_name:
        sn_host, _, sn_port = server_name.partition(":")
        # The `partition` method will always return a three-membered tuple

    if not host:
        if sn_host:
            host = sn_host
        else:
            host = "127.0.0.1"

    if port or port == 0:
        port = int(port)
    elif sn_port:
        port = int(sn_port)
    else:
        port = 5000
```

In the example above, the `server_name` string is partitioned into host and port values.

---

I share interesting Python snippets 🐍 like this from open-source projects illustrating Python language features. Subscribe to [my newsletter](https://adarshd.substack.com/) to receive new posts to your email 💌🚀.
