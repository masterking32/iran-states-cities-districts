const axios = require("axios");
const fs = require("fs");

let url =
  "https://gnaf2.post.ir/sina/editor/tables/province/rows?%24top=100&%24orderby=name";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  Referer: "https://gnaf2.post.ir/proposal",
  "x-api-key": "Get this from https://gnaf2.post.ir/proposal",
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
      name: item.name,
      cities: {},
    }));

    await Promise.all(
      states.map(async (element) => {
        url = `https://gnaf2.post.ir/sina/editor/tables/county/rows?%24top=200&%24orderby=name&%24filter=province_id+eq+${element.id}`;
        const response = await axios.get(url, { headers });
        const cities = response.data.value.map((item) => ({
          id: item.id,
          name: item.name,
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
                name: item.name,
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
      fs.writeFile("states.json", jsonData, (err) => {
        if (err) {
          console.error("Error writing to file:", err);
        } else {
          console.log("Data written to states.json file");
        }
      });
    }

    writeToFile(states);
  } catch (error) {}
}

fetchData();
