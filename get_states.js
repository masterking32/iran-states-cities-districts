const axios = require("axios");
const fs = require("fs");
const { X_API_TOKEN, persianToFinglish } = require("./global.js");

let url =
  "https://gnaf2.post.ir/sina/editor/tables/province/rows?%24top=100&%24orderby=name";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  Referer: "https://gnaf2.post.ir/proposal",
  "x-api-key": X_API_TOKEN,
  "Content-Type": "application/json",
  Connection: "keep-alive",
  Cookie: "",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};

async function fetchData() {
  try {
    const response = await axios.get(url, { headers });
    const states = response.data.value.map((item) => ({
      id: item.id,
      name: item.name.trim().trimEnd().replace(".", ""),
      cities: {},
    }));

    await Promise.all(
      states.map(async (element) => {
        url = `https://gnaf2.post.ir/sina/editor/tables/county/rows?%24top=200&%24orderby=name&%24filter=province_id+eq+${element.id}`;
        const response = await axios.get(url, { headers });
        const cities = response.data.value.map((item) => ({
          id: item.id,
          name: item.name.trim().trimEnd().replace(".", ""),
          districts: [],
        }));
        element.cities = cities;
      })
    );

    await Promise.all(
      states.map(async (element) => {
        await Promise.all(
          element.cities.map(async (city) => {
            try {
              url = `https://gnaf2.post.ir/sina/editor/tables/rural_city/rows?%24top=200&%24orderby=name&%24filter=province_id+eq+${element.id}+and+county_id+eq+${city.id}+and+is_rural+eq+false`;
              const response = await axios.get(url, { headers });
              const districts = response.data.value.map((item) => ({
                id: item.id,
                name: item.name.trim().trimEnd().replace(".", ""),
              }));
              city.districts = districts;
            } catch (error) {}
          })
        );
      })
    );

    await Promise.all(states.map((element) => Promise.all(element.cities)));

    function writeToFile(data) {
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFile("data_states_districts.json", jsonData, (err) => {
        if (err) {
          console.error("Error writing to file:", err);
        } else {
          console.log("Data written to data_states_districts.json file");
        }
      });
    }

    function writeProvincesToCSV(data) {
      let csvContent = "id,name\n";
      data.forEach((province) => {
        csvContent += `${province.id},${province.name}\n`;
      });

      fs.writeFile("data_provinces.csv", csvContent, (err) => {
        if (err) {
          console.error("Error writing to data_provinces.csv file:", err);
        } else {
          console.log("Data written to data_provinces.csv file");
        }
      });
    }

    function writeCitiesToCSV(data) {
      let csvContent = "id,name,province_id,city_id\n";
      data.forEach((province) => {
        province.cities.forEach((city) => {
          csvContent += `${city.id},${city.name},${province.id},0\n`;
          city.districts.forEach((district) => {
            csvContent += `${district.id},${district.name},${province.id},${city.id}\n`;
          });
        });
      });

      fs.writeFile("data_cities_districts.csv", csvContent, (err) => {
        if (err) {
          console.error(
            "Error writing to data_cities_districts.csv file:",
            err
          );
        } else {
          console.log("Data written to data_cities_districts.csv file");
        }
      });
    }

    writeProvincesToCSV(states);
    writeCitiesToCSV(states);
    writeToFile(states);
  } catch (error) {}
}

fetchData();
