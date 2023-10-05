---
title: When I met Guido van Rossum
date: 2023-10-05 18:00:00 +05:30
categories: [Python, Conferences]
tags: [python, conferences, guido]     # TAG names should always be lowercase
---

![With Guido](/assets/img/posts/when-i-met-guido-van-rossum/with_guido.jpg){: w="400"}

This is my account of meeting Guido Van Rossum and his advice on becoming a Python Core Developer.

This interaction is a few months old and happened during Pycascades in Vancouver (18-19 March 2023). Yesterday a random thought about this interaction crossed my mind and I thought I should write a blog post on this.


## Pycascades & Python Conferences

I flew from India to Vancouver to Speak at Pycascades to speak on "Metaprogramming in Python using Metaclasses"

<details>
<summary>My Talk</summary>

If you are interested in the talk, take this digression.

Slides: https://speakerdeck.com/adarshd/metaprogramming-in-python-using-metaclasses

Talk Video: https://www.youtube.com/watch?v=-js0K7Q878c

Pardon my lack of preparation, I was busy exploring Vancouver the previous day.

</details>

---

I would broadly classify tech conferences into two types: Busy vs. Relaxed conferences.

A typical busy conference will have a large number of attendees, multiple parallel tracks, and a whole lot of things going around at the same time. Relaxed conferences have a maximum of a few hundred attendees, there is only a single track and everything occurs at a relaxed pace.

I would classify Pycascades '23 as a relaxed conference. In a typical busy conference, you will have to line up to meet your favorite tech rockstar. But here that was not the case. This was the first "relaxed" conference I have been to and was a bit surprising.


## Meeting Guido

I had my presentation at 3 PM on day 1 of the conference. I mostly spend my day in the speaker-ready room doing some last-minute preparations. After completing my talk I went on to get some snacks during the evening break.

There he was. I did a quick Google image search and to double-check, I even asked a volunteer to confirm if that was Guido himself.


I don't exactly remember when I heard about Guido for the first time. This might be from my high school where our computer teacher instilled in us a love for programming or in the first semester of my Bachelors where we had an introductory course in Python.

I mustered up enough courage to talk to him and thanks to Pycascades being a relaxed conference, there was no one around waiting to talk to him. He told me that he listened to the last few slides of my talk and wanted to know how I got into metaprogramming.

This was a part of his character. He always asks 'Why'. Before answering a question, he wanted to know the motive or the origin of the question. I guess this curiosity is one factor that sets apart great developers from good developers.

---

Here is a brief of the conversation we had on that day(reworded and mostly taken from my memory).

Guido: I missed the initial parts of your talk. I came when you reached slide X(a slide towards the end). How did you get into the idea of metaprogramming?

Me: We have a knowledge-sharing session in our company. I presented an initial version of this talk there. Also, I love teaching others and I explore new topics from Realpython and blogs.

Guido: At your day job, what are you currently working on? Are you using Python?

Me: Yes. I am building a GraphQL API powering the backend of a travel application.

Guido: GraphQL? Is that the Facebook library?

Me: Yes. We are using the Graphene-Python library.

Guido: I see. So there are Python wrappers around it.

<details>
<summary>Python is vast</summary>
I met a lot of experts at the conference and everyone has their areas of expertise. Also, I had a similar discussion with Sarah Kaiser from Microsoft where she talked about the vastness of Python. There are experts in Web (API devs), PyData, ML, etc. and in most cases, everyone has an exclusive area of expertise. From my conversation with Guido, I was surprised to see that he was unaware of GraphQL libraries, but considering the fact that his expertise is in core development, this is nothing surprising.
</details>

---

Then I asked him a few questions which came to my mind:

Q1: I asked a question regarding alternate Python implementations. Something along the lines of "Do you see Pypy overtaking CPython anytime in the future?"

Guido: PyPy or any other implementations won't be replacing CPython. Alternate implementations are always trying to catch up with the CPython releases.
With the Faster CPython Project, future releases have improved performance reducing the need for alternative implementations, if speed is the concern.
Jit compiler


Q2: Will you be coming to India for our Pycon event (Pycon India)

Guido: I most probably won't be there since I am not able to travel that long. (I don't exactly remember the wording)


Q3: I work in a young team of Backend devs using Python. Do you have any advice for getting better at Python Programming?

(I only remember a part of this answer)

Guido:
1. Be a part of local Python communities
2. Read more code than you write

Expanding on point 2, reading good code is a great way to learn new patterns and expand our thinking approaches towards problems.

I recently came across "death and gravity" blog with two great resources for the same.

[Learn by reading code: Python standard library design decisions explained](https://death.andgravity.com/stdlib) and [Struggling to structure code in larger programs? Great resources a beginner might not find so easily](https://death.andgravity.com/aosa)

---

I stopped when I ran out of questions to ask.

Initially I had told him that I love teaching. He asked me to connect with the RealPython team (who were present at the conference) and collaborate with them on some tutorials.

Then we took a selfie (The cover image of this post). Also, I was surprised no one else was doing the same (relaxed conference!).

I noted down important points of the conversation to share with my teammates, which became useful when writing this.

## How to be a CPython Core Developer

On day 2, the final day of the conference, I arrived at the venue (SFU Vancouver campus) with a resolve not to miss any of the talks like I did yesterday owing to my talk preparation.


On the morning break, I saw Guido talking to a volunteer regarding Pycon. I was ready with my new set of questions.

I was looking to advance my Python knowledge and was looking to go deeper into CPython implementation. I had my copy of [Cpython Internal Book](https://realpython.com/products/cpython-internals-book/) and have taken a peek into the [Python Devguide](https://devguide.python.org/) and wanted to get an idea of the next steps to take from the creator himself.

---

If you are new to the below terms, please refer to the listed resources

<details>
<summary>What is CPython</summary>

Read this guide: https://realpython.com/cpython-source-code-guide/ by Realpython team

</details>

<details>

<summary>Who are CPython core developers</summary>

Talk by Mariatta: https://speakerdeck.com/mariatta/what-is-a-python-core-developer and Devguide page: https://devguide.python.org/core-developers/become-core-developer/

</details>

---

I went ahead and asked Guido, "How can I become a core developer"?

The hall was a bit crowded and noisy at that time. Guido insisted we move to a quieter side and talk. He grabbed a snack, went to a quiet corner overlooking the Vancouver harbor and asked:

Why?

Why do you want to be a core dev? Becoming one is a decision many would regret.

I didn't quite understand this at that time. It made sense recently when I was reading the BDFL retirement mail thread from the Python mailing list archive at 3 AM. Also see this article from Brett Cannon: [The social contract of Open source](https://snarky.ca/the-social-contract-of-open-source/)


Going back to the topic:

I somehow evaded his whys and got the answer from him.

Here are some of the points he mentioned as a part of his answer:

- Be active in discussion forums.


[Python mailing lists](https://www.python.org/community/lists/)

[Python Discourse](https://discuss.python.org/)

- Look for issues or new features to be added to the standard library

Since I was already using Python, he asked me to identify bugs/improvements and try to work on those.

> Fun fact: Currently, more than 63% of [CPython source](https://github.com/python/cpython/tree/3.12) is written in Python. Knowledge of C is not required to contribute to CPython.
{: .prompt-tip }


- There are little bugs everywhere
He said that there is a lack of expert contributors. Even core developers won't know all parts of the code and there are parts everyone is afraid of.

I was happy and relieved hearing this (There are little bugs everywhere, even in CPython). Maybe because I can justify the bugs I create using this statement.

- Never give up

Once started, we should go on taking up issues and continue contributing.

- Multiple Ways to Contribute:

Along with contributing code, we can also take part in discussions, writing docs, or reviewing PRs.

---

Then came the surprising move. He wanted to check how ChatGPT would answer this (no I am not making this up). He pulled in his laptop, logged in to ChatGPT, and asked the same question.

I do not remember exactly the answer it gave, I remember it had a link to the dev guide and some other instructions. He found out that there was a mistake in the answer and reported that and ChatGPT responded with a revised(and correct) answer.



## Lessons Learnt

- Go to conferences:

Pycascades was a very enriching experience for me. I would recommend everyone to go to conferences. I connected & exchanged ideas with many great folks (VSCode-Python Team, RealPython Team, Mariatta, and so many more awesome people)

- Be nice:

There were common traits I observed whenever I spoke with most of the experts during relaxed as well as busy conferences.

They all are humble, welcoming, willing to help and genuinely care about others.

---
---

Looking back on this journey, everything was worth it - the 16-hour long flight, taking a week-long leave from work (and handling the production credentials to juniors)

## Thanks to Pysacsades

It isn't fair to end this post without thanking [Pycascades Team](https://2023.pycascades.com/about/team/) for giving me a speaker invite and covering a part of the travel expenses.

Special thanks to Eliza, Ben, Jolene, and the entire Pycascades team for running this awesome conference.
