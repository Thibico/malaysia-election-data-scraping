# Malaysian Elections Data Repository

This repository contains data that has been scraped from the following sources:

* Malaysian newspaper [The Star's](https://www.thestar.com.my/) election dashboard <https://election.thestar.com.my/>
* Malaysian newspaper [Malaysiakini's](https://www.malaysiakini.com/) election dashboard <https://undi.info/>

## Cleaned datasets and code books

You can access the CSV files of the cleaned datasets in the [cleaned](./data/cleaned) subfolder under the [data](./data) folder.

The cleaned data is seperated into a folder for the data from [The Star](./data/cleaned/the_star) and one for [undi.info](./data/cleaned/undi_dot_info/).

In each of the sources' respective folders,  there is are files for
* **results**: which contain data about the votes obtained by each candidate
* **constituency_info**: which contains data about each constituency
* **CODEBOOK**: which contains a metadata about the variables in each data file

## Methodology, code and raw data

The data was scraped using python scripts contained in the following jupyter notebooks:
* [notebook for scraping from The Star](./scrape_The_Star.ipynb)
* [notebook for scraping from undi.info](./scrape_UNDI_dot_info.ipynb)

SVG files of the constituency boundaries avaialble from The Star was also scraped (code is in the [same notebook](./scrape_The_Star.ipynb)) and raw SVG files are in the [svgs](./svgs/) folder.

### Scraping and cleaning data from [The Star's election dashboard](https://election.thestar.com.my/)

Data from The Star was scraped from the HTML pages and parsed cleaned using code from [this](./wrangling_and_cleaning_The_Star_2018.ipynb) notebook. Raw data in CSV files can be found [here](./data/raw/the_star/).

Data from The Star was available for the 2018 general elections (GE14) for the parliamentary elections and the state elections.

### Scraping and cleaning data from Malaysiakini's [undi.info](https://undi.info/) site

Data from undi.info was scraped from the website's [API](https://api.undi.info/) using code from [this](./scrape_UNDI_dot_info.ipynb) notebook. Raw data in JSON files can be found [here](./data/raw/undi_dot_info/).

Data from undi.info was available for the 2004, 2008, 2013, and 2018 general elections (GE11, GE12, GE13, GE14) for the parliamentary elections and the state elections.

**Note**: undi.info also contains results of state elections in Sabah (2020), Malacca (2021) and Sarawak (2016, 2021) but this data has not been scraped and added to this repo yet.

## About

This repo is part of a collaborative project by Southeast Asian civic tech groups (including [Thibi](https://site.thibi.co/) and [Data-N](https://www.data-n.com/)) to provide open data and open sourced data visualisations for the Malaysian elections.

We plan to add data for the 2022 General Elections (GE15) as soon as possible after the official results are announced.

All the data used for the data visualisations will be available in this repo and **we will be sharing the website where you can find the data visualisations very soon**.