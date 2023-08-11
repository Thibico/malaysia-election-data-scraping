import fs from "fs";
import path from "path";

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
      coalition: NamaSingkatanParti,
      party_code: KodParti,
      votes: "",
      vote_share: "",
      parliament_code_digits: KodParlimen,
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

const loadData = async () => {
  try {
    const candidatesPath = path.join(
      getCurrentDirectory(),
      "raw",
      "candidates.json"
    );
    const dpprPath = path.join(getCurrentDirectory(), "raw", "dppr.json");

    const candidatesJSON = fs.readFileSync(candidatesPath, "utf8");
    const candidates = JSON.parse(candidatesJSON);

    const dpprJSON = fs.readFileSync(dpprPath, "utf8");
    const dppr = JSON.parse(dpprJSON);

    if (candidates) {
      const candidateData = candidates.map(formatCandidate);
      writeJSONToFile("candidate", "./data/", candidateData);
    }

    if (candidates && dppr) {
      const combinedResults = generateCombinedData(candidates, dppr);
      writeJSONToFile("combinedresults", "./data/", combinedResults);
    }
  } catch (error) {
    console.error("Error reading or processing data:", error);
  }
};

loadData();
