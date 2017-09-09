---
layout: post
thumbnail: /data/twitter_network/thumbnail_1m.png
categories: data-visualization
title: Twitter Network Graph
---

Some time ago I was working with a large twitter dataset relating to presidential elections in the US. One of the goals of the analysis was to visualize the relations between 11 million users based on mentions in posts and replies. The data was in the form of a txt file containing serialized [tweet objects](https://dev.twitter.com/overview/api/tweets) (JSON strings) at each line. The total number of tweets was 164 million. Below I present network graphs for the following subsets of the data: 10 thousand tweets, 100 thousand tweets, and finally 1 million tweets. I used canvas and [d3.js](https://d3js.org/) to visualize the networks. I also added the ability to see the user corresponding to each node. When you mouse over a node, you see the twitter name or id of the user in the upper right corner. You can click on the node to see the corresponding twitter account. You'll notice that the most important nodes correpond to twitter accounts of: [Donald J. Trump](https://twitter.com/intent/user?user_id=25073877), [Hillary Clinton](https://twitter.com/intent/user?user_id=1339835893), [Marco Rubio](https://twitter.com/intent/user?user_id=15745368), and [Fox News](https://twitter.com/intent/user?user_id=1367531).

*It takes a long time to calculate the positions of nodes in the last two examples (100 thousand data points and 1 million data points). Therefore, you may be better off if you click on [the first example  (10 thousand data points)](/data/twitter_network/html/10k.html) - **especially if you're browsing from a mobile device**.*

### Network Graph Based on 10 Thousand Tweets
Follow [this link](/data/twitter_network/html/10k.html) to see the network graph of twitter users based on 10 thousand tweets.
[
![Network graph based on 10 thousand tweets](/data/twitter_network/thumbnail_10k.png)
](/data/twitter_network/html/10k.html)

### Network Graph Based on 100 Thousand Tweets
Follow [this link](/data/twitter_network/html/100k.html) to see the network graph of twitter users based on 100 thousand tweets. It takes longer to load this graph than the graph above but this graph is more interesting than the previous one.
[
![Network graph based on 100 thousand tweets](/data/twitter_network/thumbnail_100k.png)
](/data/twitter_network/html/100k.html)

### Network Graph Based on 1 Million Tweets (Slow)
Follow [this link](/data/twitter_network/html/1m.html) to see the network graph of twitter users based on 1 million tweets. It takes a long time (from 5 to 30 minutes depending on your machine) to compute the positions of nodes but this graph is more interesting than the previous two.
[
![Network graph based on 1 millions tweets](/data/twitter_network/thumbnail_1m.png)
](/data/twitter_network/html/1m.html)