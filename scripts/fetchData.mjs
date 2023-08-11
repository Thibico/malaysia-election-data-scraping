import fs from "fs";
import path from "path";
import https from "https";
import EventSource from "eventsource";
import axios from "axios";

const apiBaseUrl = "https://dashboard.spr.gov.my/api/v1";

const candidates = [
  "2023-01",
  "2023-02",
  "2023-03",
  "2023-04",
  "2023-05",
  "2023-06",
];

const ddprList = [
  "2023-02",
  "2023-03",
  "2023-04",
  "2023-05",
  "2023-06",
  "2023-07",
];

let candidateData = [];
let dpprHost = [];
let statistikumurHost = [];
let statistikjenisHost = [];
let parlimenHost = [];
let dunHost = [];

const writeJSONToFile = (filename, destinationPath, data) => {
  const jsonData = JSON.stringify(data, null, 2);
  const filePath = path.join(destinationPath, `${filename}.json`);

  fs.writeFileSync(filePath, jsonData);
  console.log(`\nWrote ${filename}.json to ${destinationPath}\n`);
};

const fetchDataFromEventSource = async (candidate, slug, dataStore) => {
  const url = `${apiBaseUrl}/${candidate}/${slug}`;
  console.log("Fetching data from:", url);

  return new Promise((resolve, reject) => {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const eventSource = new EventSource(url, { httpsAgent: agent });

    eventSource.onmessage = (event) => {
      const eventData = JSON.parse(event.data);
      if (eventData.data.length > 0) {
        dataStore.push(...eventData.data);
        eventSource.close();
        resolve();
      }
    };

    eventSource.onerror = (error) => {
      reject(
        new Error(`Error fetching SSE data for ${candidate}: ${error.message}`)
      );
    };
  });
};

const fetchDataViaAxios = async (candidate, slug, dataStore) => {
  const url = `${apiBaseUrl}/${candidate}/${slug}`;
  console.log("Fetching data from:", url);

  try {
    const response = await axios.get(url, {
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    dataStore.push(...response.data);
  } catch (error) {
    throw new Error(`Error fetching data for ${candidate}: ${error.message}`);
  }
};

const fetchDataForCandidate = async (candidate) => {
  await fetchDataFromEventSource(candidate, "calondun", candidateData);
  await fetchDataViaAxios(candidate, "statistikumur", statistikumurHost);
  await fetchDataViaAxios(candidate, "statistikjenis", statistikjenisHost);
  await fetchDataViaAxios(candidate, "parlimen", parlimenHost);
  await fetchDataViaAxios(candidate, "dun", dunHost);
};

const fetchDataForDDPR = async (ddpr) => {
  await fetchDataViaAxios(ddpr, "dppr", dpprHost);
};

const loadData = async () => {
  try {
    for (const candidate of candidates) {
      await fetchDataForCandidate(candidate);
    }

    for (const ddpr of ddprList) {
      await fetchDataForDDPR(ddpr);
    }
    writeJSONToFile("candidates", "./raw/", candidateData);
    writeJSONToFile("statistikumur", "./raw/", statistikumurHost);
    writeJSONToFile("statistikjenis", "./raw/", statistikjenisHost);
    writeJSONToFile("parlimen", "./raw/", parlimenHost);
    writeJSONToFile("dun", "./raw/", dunHost);
    writeJSONToFile("dppr", "./raw/", dpprHost);
  } catch (error) {
    console.error("Error reading or processing data:", error);
  }
};

loadData();
