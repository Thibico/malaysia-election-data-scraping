import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import axios from "axios";

const getCurrentDirectory = () => {
  return path.dirname(new URL(import.meta.url).pathname);
};

const writeJSONToFile = (filename, destinationPath, data) => {
  const jsonData = JSON.stringify(data, null, 2);
  const filePath = path.join(destinationPath, `${filename}.json`);

  fs.writeFileSync(filePath, jsonData);
  console.log(`\nWrote ${filename}.json to ${destinationPath}\n`);
};

const parseCSVFromURL = async (url) => {
  try {
    const response = await axios.get(url);
    const csvData = response.data;

    return new Promise((resolve, reject) => {
      parse(
        csvData,
        {
          columns: true,
          skip_empty_lines: true,
        },
        (err, records) => {
          if (err) {
            reject(err);
          } else {
            resolve(records);
          }
        }
      );
    });
  } catch (error) {
    throw new Error(`Error fetching or parsing CSV data: ${error.message}`);
  }
};

const formatCandidate = (eachItem) => {
  const {
    NamaCalon,
    Parti,
    NamaSingkatanParti,
    KodParlimen,
    Negeri,
    NamaParlimen,
  } = eachItem;

  return {
    parliament_type: "",
    state: Negeri,
    seat_name: NamaParlimen,
    seat_id: "",
    parliament_code: KodParlimen,
    name: NamaCalon,
    party: `${Parti} (${NamaSingkatanParti})`,
  };
};

const generateCombinedData = (candidates, dppr) => {
  return candidates.map((eachCandidate) => {
    const {
      NamaCalon,
      NamaUndiCalon,
      NoCalon,
      KodParti,
      NamaSingkatanParti,
      KodParlimen,
      KodDun,
      Negeri,
      NamaParlimen,
      MasaSah,
    } = eachCandidate;

    const date = new Date(MasaSah);
    const year = date.getFullYear();

    const matchingDPPR = dppr.find((eachDp) => eachDp.KodDun === KodDun);
    const total_votes = matchingDPPR ? matchingDPPR["Jumlah"] : 0;

    return {
      year,
      name: NamaCalon,
      name_ballot: NamaUndiCalon,
      ballot_order_x: NoCalon,
      coalition: NamaSingkatanParti,
      party_code: KodParti,
      votes: "",
      vote_share: "",
      parliament_code: `P.${KodParlimen}`,
      parliament_code_digits: KodParlimen,
      dun_code: KodDun,
      constituency: NamaParlimen,
      state: Negeri,
      total_votes,
      gender: "",
      results_added: "",
      spr_id: "",
      winner: "",
    };
  });
};

const mergeWithCSVData = (generatedData, csvData, totalVotes) => {
  const mergedData = generatedData.map((generatedItem) => {
    let totalVote = 0;
    let fullDunCode = "";
    let csvDunCode = "";
    const { parliament_code_digits, dun_code } = generatedItem;

    const matchingCSVItem = csvData.find((csvItem) => {
      const csvParliamentCodeRaw =
        csvItem["parlimen"].match(/^P\.\d+/)?.[0] || "";
      const csvDunCodeRaw = csvItem["dun"].match(/^N\.\d+/)?.[0] || "";
      const csvParliamentCode = csvParliamentCodeRaw.replace("P.", "");
      csvDunCode = csvDunCodeRaw.replace("N.", "");
      fullDunCode = csvParliamentCode + csvDunCode;

      console.log("csvDunCode", csvDunCode);

      totalVote = totalVotes[fullDunCode] ?? 0;

      const sameDunCode = fullDunCode === dun_code;
      const sameName =
        csvItem.name.toLowerCase().trim() ===
        generatedItem.name.toLowerCase().trim();

      return sameDunCode && sameName;
    });

    if (matchingCSVItem) {
      const {
        year,
        name,
        coalition,
        parliament_code_digits,
        constituency,
        state,
      } = generatedItem;

      const { party, acronym, sex, votes, votes_perc, result } =
        matchingCSVItem;

      return {
        year,
        name,
        coalition,
        party,
        party_code: acronym,
        votes,
        vote_share: votes_perc,
        parliament_code_digits,
        dunCode: fullDunCode,
        threeDunCode: `0${csvDunCode}`,
        constituency,
        state,
        total_votes: totalVote,
        gender: sex === "male" ? "M" : "F",
        results_added: 1,
        spr_id: "",
        winner: result === "won" ? 1.0 : 0.0,
      };
    }

    return generatedItem;
  });

  // console.log('voteHost', voteHost)

  return mergedData;
};

const calculateTotalVotes = (csvData) => {
  let totalVotesHost = {};
  csvData.forEach((eachItem) => {
    const csvParliamentCodeRaw =
      eachItem["parlimen"].match(/^P\.\d+/)?.[0] || "";
    const csvDunCodeRaw = eachItem["dun"].match(/^N\.\d+/)?.[0] || "";
    const csvParliamentCode = csvParliamentCodeRaw.replace("P.", "");
    const csvDunCode = csvDunCodeRaw.replace("N.", "");
    const fullDunCode = csvParliamentCode + csvDunCode;

    if (totalVotesHost[fullDunCode]) {
      totalVotesHost[fullDunCode] += parseInt(eachItem.votes);
    } else {
      totalVotesHost[fullDunCode] = parseInt(eachItem.votes);
    }
  });
  return totalVotesHost;
};

const loadData = async () => {
  try {
    const candidatesPath = path.join(
      getCurrentDirectory(),
      "raw",
      "candidates.json"
    );
    const dpprPath = path.join(getCurrentDirectory(), "raw", "dppr.json");
    // const candidatesPRN15Path = path.join(
    //   getCurrentDirectory(),
    //   "raw",
    //   "candidates_prn15.csv"
    // );

    const candidatesJSON = fs.readFileSync(candidatesPath, "utf8");
    const candidates = JSON.parse(candidatesJSON);

    const dpprJSON = fs.readFileSync(dpprPath, "utf8");
    const dppr = JSON.parse(dpprJSON);

    // const candidatesPRN15CSV = fs.readFileSync(candidatesPRN15Path, "utf8");
    // const candidatesPRN15Array = await new Promise((resolve, reject) => {
    //   parse(
    //     candidatesPRN15CSV,
    //     {
    //       columns: true,
    //       skip_empty_lines: true,
    //     },
    //     (err, records) => {
    //       if (err) {
    //         reject(err);
    //       } else {
    //         resolve(records);
    //       }
    //     }
    //   );
    // });

    const candidatesPRN15URL =
      "https://raw.githubusercontent.com/Thevesh/analysis-election-msia/main/data/candidates_prn15.csv";
    const candidatesPRN15Array = await parseCSVFromURL(candidatesPRN15URL);

    // if (candidatesPRN15Array) {
    //   writeJSONToFile("candidatesPRN15Array", "./raw/", candidatesPRN15Array);
    // }

    if (candidates) {
      const candidateData = candidates.map(formatCandidate);
      writeJSONToFile("candidate", "./data/", candidateData);
    }

    if (candidates && dppr && candidatesPRN15Array) {
      const generatedData = generateCombinedData(candidates, dppr);
      const total_votes = calculateTotalVotes(candidatesPRN15Array);
      const combinedResults = mergeWithCSVData(
        generatedData,
        candidatesPRN15Array,
        total_votes
      );
      // writeJSONToFile("combinedresults", "./data/", generatedData);
      writeJSONToFile("combinedresults15", "./data/", combinedResults);
    }
  } catch (error) {
    console.error("Error reading or processing data:", error);
  }
};

loadData();
