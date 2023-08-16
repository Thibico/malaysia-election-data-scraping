import fs from "fs";
import path from "path";
import { parse } from "csv-parse";

const getCurrentDirectory = () => {
  return path.dirname(new URL(import.meta.url).pathname);
};

const writeJSONToFile = (filename, destinationPath, data) => {
  const jsonData = JSON.stringify(data, null, 2);
  const filePath = path.join(destinationPath, `${filename}.json`);

  fs.writeFileSync(filePath, jsonData);
  console.log(`\nWrote ${filename}.json to ${destinationPath}\n`);
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
      parliament_code_digits: `P.${KodParlimen}`,
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

const mergeWithCSVData = (generatedData, csvData) => {
  const mergedData = generatedData.map((generatedItem) => {
    const matchingCSVItem = csvData.find((csvItem) => {
      const csvParliamentCode = csvItem["parlimen"].match(/^P\.\d+/)?.[0] || "";
      const sameParliamentCode =
        csvParliamentCode === generatedItem.parliament_code_digits;
      const sameName =
        csvItem.name.toLowerCase().trim() ===
        generatedItem.name.toLowerCase().trim();
      const sameState =
        csvItem.state.toLowerCase().trim() ===
        generatedItem.state.toLowerCase().trim();

      return sameParliamentCode && sameName && sameState;
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
        constituency,
        state,
        total_votes: 0,
        gender: sex,
        results_added: 1,
        spr_id: "",
        winner: result === "won" ? 1.0 : 0.0,
      };
    }

    return generatedItem;
  });

  return mergedData;
};

const loadData = async () => {
  try {
    const candidatesPath = path.join(
      getCurrentDirectory(),
      "raw",
      "candidates.json"
    );
    const dpprPath = path.join(getCurrentDirectory(), "raw", "dppr.json");
    const candidatesPRN15Path = path.join(
      getCurrentDirectory(),
      "raw",
      "candidates_prn15.csv"
    );

    const candidatesJSON = fs.readFileSync(candidatesPath, "utf8");
    const candidates = JSON.parse(candidatesJSON);

    const dpprJSON = fs.readFileSync(dpprPath, "utf8");
    const dppr = JSON.parse(dpprJSON);

    const candidatesPRN15CSV = fs.readFileSync(candidatesPRN15Path, "utf8");
    const candidatesPRN15Array = await new Promise((resolve, reject) => {
      parse(
        candidatesPRN15CSV,
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

    // if (candidatesPRN15Array) {
    //   writeJSONToFile("candidatesPRN15Array", "./raw/", candidatesPRN15Array);
    // }

    if (candidates) {
      const candidateData = candidates.map(formatCandidate);
      writeJSONToFile("candidate", "./data/", candidateData);
    }

    if (candidates && dppr && candidatesPRN15Array) {
      const generatedData = generateCombinedData(candidates, dppr);
      const combinedResults = mergeWithCSVData(
        generatedData,
        candidatesPRN15Array
      );
      // writeJSONToFile("combinedresults", "./data/", generatedData);
      writeJSONToFile("combinedresults15", "./data/", combinedResults);
    }
  } catch (error) {
    console.error("Error reading or processing data:", error);
  }
};

loadData();
