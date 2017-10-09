---
title: How to Easily Scrape Yahoo Finance for Historical Quotes.
date: 2017-10-05
layout: post
---
### Introduction
Here I tell you how to easily obtain historical stock quotes from Yahoo Finance for all currently listed Nasdaq sequrities. [At the end of this post](#example-dataset) I included the data scraped on October 05, 2017 so that you can see the final output.

The total time required to run the scraping script is about 2 hours. Before you proceed, you'll need to have the following dependencies installed:

* I tested the code on MacOS Sierra Version 10.12.3. If you're using Windows you might need to deviate from the instructions and figure out some things on your own. However, the instructions in this post generally apply to other operating systems too.
* Python 3.6 or more recent.
* Python [Selenium](http://www.seleniumhq.org/) module. It can be installed by `pip install selenium`.
* [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/) installed and added to the path. That means you must be able to run `chromedriver` in your terminal from any location.

### Scraping Strategy

First of all let's go over the things our script will need to do before writing the code.

We'll use the following internet resources:
* [Yahoo Finance](https://finance.yahoo.com/) - the source of historical quotes
* [Nasdaq](http://www.nasdaq.com/) - the source of Nasdaq tickers.

We'll download Nasdaq tickers [here](http://www.nasdaq.com/screening/company-list.aspx) and then for each ticker we'll download historical quotes from Yahoo Finance.

Let's talk about Yahoo Finance. Navigate to [AAPL's historical quotes](https://finance.yahoo.com/quote/AAPL/history?p=AAPL) at Yahoo Finance. You'll see the "Download Data" link. Let's copy the URL in order to investigate its structure. As of the time of this writing the link is `https://query1.finance.yahoo.com/v7/finance/download/AAPL?period1=1504380409&period2=1506972409&interval=1d&events=history&crumb=wWX5yfidB0d`.

We see that the URL path ends in `AAPL` which is the ticker. Also we see that the link has the following query parameters and values: 
* `period1` equals `1504380409` which is Unix time stamp for the start of the period: Sat, 02 Sep 2017 19:26:49
* `period2` equals `1506972409` which is Unix time stamp for the end of the period: Mon, 02 Oct 2017 19:26:49
* `crumb` will be user-specific. It's a cookie which Yahoo uses to identify users. If you delete this parameter or modify it, you'll see the following message:
```
{
    "finance": {
        "error": {
            "code": "Unauthorized",
            "description": "Invalid cookie"
        }
    }
}
```

We can can modify the URL by changing the ticker and period parameters in order to obtain the data for different tickers and periods. For example, use the following URL to download all historical data for MSFT from `Thu, 01 Jan 1970 00:00:00` to `Wed, 18 May 2033 03:33:20`: `https://query1.finance.yahoo.com/v7/finance/download/MSFT?period1=0&period2=2000000000&interval=1d&events=history&crumb=wWX5yfidB0d`. Don't forget to use your own `crumb` parameter though. In our python script we'll use this URL to download the data.

### Writing the Script

I've broken down the script file into several parts so that it's easier for you to digest them. I'll walk you through each part and you can find the complete script at the end of this page.

#### Part 1. Import Python Modules

We'll use built-in modules: time, urllib.request, csv, shutil, and os.path. And we'll use a third-party module selenium.

Here we also define a utility fuction which converts a date into a Unix timestamp. We'll need it to define the end of the period when querying data from Yahoo Finance. As of the time of this post, the latest complete trading day was 2017-10-04. Therefore, I set `period_end` to 2017-10-04.

{% highlight python %}
from selenium import webdriver
from time import sleep
from urllib.parse import urlparse
from urllib.parse import parse_qs
import csv
from urllib.request import urlopen
import shutil
import os.path
import datetime

period_end = datetime.datetime(2017, 10, 4)


def unix_time_millis(dt):
    dt += datetime.timedelta(days=1)
    return str(int((dt - datetime.datetime.utcfromtimestamp(0)).total_seconds()))

period_end = unix_time_millis(period_end)

{% endhighlight %}

#### Part 2. Download Nasdaq Tickers
The following piece of code downloads the list of tickers of Nasdaq listed securities and saves it as `nasdaq.csv`.  
{% highlight python %}
url = "http://www.nasdaq.com/screening/companies-by-name.aspx?letter=0&exchange=nasdaq&render=download"
file_name = "nasdaq.csv"
with urlopen(url) as response, open(file_name, 'wb') as out_file:
    shutil.copyfileobj(response, out_file)
{% endhighlight %}

#### Part 3. Set up Chromedriver

We set up Chromedriver so that it downloads files automatically without prompting for confirmation. Another noteworthy preference is that the download location for Yahoo Finance data is `yahoo_data`.
{% highlight python %}
options = webdriver.ChromeOptions()
options.add_experimental_option("prefs", {
    "download.default_directory": r"yahoo_data",
    "download.prompt_for_download": False,
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True
})
driver = webdriver.Chrome(chrome_options=options)
{% endhighlight %}

#### Part 4. Get Crumb Value

The following piece of code navigates to [https://finance.yahoo.com/quote/AAPL/history?period1=0&period2=2000000000&interval=1d&filter=history&frequency=1d](https://finance.yahoo.com/quote/AAPL/history?period1=0&period2=2000000000&interval=1d&filter=history&frequency=1d) and obtains the value of the cookie. It tries to obtain the value of the cookie a total of 10 times, and if unsucsessful (e.g. Yahoo Finance is down or unreachable), it throws an exception.

{% highlight python %}
crumb = None


def get_crumb():
    driver.get("https://finance.yahoo.com/quote/AAPL/"
               "history?period1=0&period2=2000000000&interval=1d&filter=history&frequency=1d")
    sleep(10)
    el = driver.find_element_by_xpath("// a[. // span[text() = 'Download Data']]")
    link = el.get_attribute("href")
    a = urlparse(link)
    crumb = parse_qs(a.query)["crumb"][0]
    return crumb

for i in range(10):
    if not crumb:
        crumb = get_crumb()
    else:
        break

if not crumb:
    raise "Crumb Not Set"
{% endhighlight %}

#### Part 5. Download Yahoo Quotes

The following piece of code clears the directory `yahoo_data`. It reads `nasdaq.csv` file line by line and downloads historical quotes for each ticker - it attempts to do this a total of 3 times because sometimes Yahoo Finance may be unreachable.

{% highlight python %}
for file in os.listdir("yahoo_data"):
    file_path = os.path.join("yahoo_data", file)
    os.unlink(file_path)


def download_yahoo_quotes(ticker):
    driver.get("https://query1.finance.yahoo.com/v7/finance/download/"
               "{0}?period1=0&period2={1}&interval=1d&events=history&crumb={2}".format(ticker, period_end, crumb))
    sleep(1)

for t in range(3):
    with open(file_name) as tickers_file:
        tickers_reader = csv.reader(tickers_file)
        next(tickers_reader)
        for line in tickers_reader:
            ticker = line[0].strip()
            if not os.path.isfile("./yahoo_data/{}.csv".format(ticker)):
                download_yahoo_quotes(ticker)
{% endhighlight %}


#### Part 6. Identify Missing Data

This final piece of code checks whether we downloaded the quotes for each ticker in `nasdaq.csv` - if not, it writes the missing tickers and errors into `scraping_errors.csv`. Some tickers may be missing from Yahoo Finance - it's good to keep track of these tickers.



{% highlight python %}
errors = {}
with open(file_name) as tickers_file:
    tickers_reader = csv.reader(tickers_file)
    next(tickers_reader)
    for line in tickers_reader:
        ticker = line[0].strip()
        if not os.path.isfile("./yahoo_data/{}.csv".format(ticker)):
            errors[ticker] = "Quotes not downloaded."

with open("scraping_errors.csv", "w+") as errors_file:
    errors_writer = csv.writer(errors_file)
    errors_writer.writerow(["ticker", "error"])
    for ticker in errors:
        errors_writer.writerow([ticker, errors[ticker]])
{% endhighlight %}

### The Complete Code
Below is the full version of the code for your convenience.
{% highlight python %}
# Part 1. Import Python Modules

from selenium import webdriver
from time import sleep
from urllib.parse import urlparse
from urllib.parse import parse_qs
import csv
from urllib.request import urlopen
import shutil
import os.path
import datetime

period_end = datetime.datetime(2017, 10, 4)


def unix_time_millis(dt):
    dt += datetime.timedelta(days=1)
    return str(int((dt - datetime.datetime.utcfromtimestamp(0)).total_seconds()))

period_end = unix_time_millis(period_end)


# Part 2. Download Nasdaq Tickers

url = "http://www.nasdaq.com/screening/companies-by-name.aspx?letter=0&exchange=nasdaq&render=download"
file_name = "nasdaq.csv"
with urlopen(url) as response, open(file_name, 'wb') as out_file:
    shutil.copyfileobj(response, out_file)

# Part 3. Set up Chromedriver

options = webdriver.ChromeOptions()
options.add_experimental_option("prefs", {
    "download.default_directory": r"yahoo_data",
    "download.prompt_for_download": False,
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True
})
driver = webdriver.Chrome(chrome_options=options)
crumb = None

# Part 4. Get Crumb Value

def get_crumb():
    driver.get("https://finance.yahoo.com/quote/AAPL/"
               "history?period1=0&period2=2000000000&interval=1d&filter=history&frequency=1d")
    sleep(10)
    el = driver.find_element_by_xpath("// a[. // span[text() = 'Download Data']]")
    link = el.get_attribute("href")
    a = urlparse(link)
    crumb = parse_qs(a.query)["crumb"][0]
    return crumb

for i in range(10):
    if not crumb:
        crumb = get_crumb()
    else:
        break

if not crumb:
    raise ValueError("Crumb Not Set")


# Part 5. Download Yahoo Quotes

for file in os.listdir("yahoo_data"):
    file_path = os.path.join("yahoo_data", file)
    os.unlink(file_path)


def download_yahoo_quotes(ticker):
    driver.get("https://query1.finance.yahoo.com/v7/finance/download/"
               "{0}?period1=0&period2={1}&interval=1d&events=history&crumb={2}".format(ticker, period_end, crumb))
    sleep(1)

for t in range(3):
    with open(file_name) as tickers_file:
        tickers_reader = csv.reader(tickers_file)
        next(tickers_reader)
        for line in tickers_reader:
            ticker = line[0].strip()
            if not os.path.isfile("./yahoo_data/{}.csv".format(ticker)):
                download_yahoo_quotes(ticker)

# Part 6. Identify Missing Data

errors = {}
with open(file_name) as tickers_file:
    tickers_reader = csv.reader(tickers_file)
    next(tickers_reader)
    for line in tickers_reader:
        ticker = line[0].strip()
        if not os.path.isfile("./yahoo_data/{}.csv".format(ticker)):
            errors[ticker] = "Quotes not downloaded."

with open("scraping_errors.csv", "w+") as errors_file:
    errors_writer = csv.writer(errors_file)
    errors_writer.writerow(["ticker", "error"])
    for ticker in errors:
        errors_writer.writerow([ticker, errors[ticker]])
{% endhighlight %}

# Example Dataset

In this section I [link to a zip file with the quotes scraped on October 5, 2017](/data/scraping_yahoo_finance/yahoo_quotes.zip). The zip file also contains the list of Nasdaq tickers (a total of 3,271) and the list of tickers  which were not downloaded (a total of 183).




