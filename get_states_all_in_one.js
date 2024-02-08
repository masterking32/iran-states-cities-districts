const axios = require("axios");
const fs = require("fs");
const csv = require("csv-writer").createObjectCsvWriter;

let url =
  "https://gnaf2.post.ir/sina/editor/tables/province/rows?%24top=100&%24orderby=name";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  Referer: "https://gnaf2.post.ir/proposal",
  "x-api-key": "Your X-API-KEY here",
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
      coordinates: item.geocoded_point.coordinates,
      type: "province",
      province: 0,
    }));

    console.log("Provinces fetched successfully");

    all_counties = []; // شهرستان ها
    await Promise.all(
      states.map(async (element) => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        url = `https://gnaf2.post.ir/sina/editor/tables/county/rows?%24top=2000&%24orderby=name&%24filter=province_id+eq+${element.id}`;
        const response = await axios.get(url, { headers });

        response.data.value.forEach((item) => {
          const coordinates = item.geocoded_point
            ? item.geocoded_point.coordinates
            : [56.47, 32.01];

          all_counties.push({
            id: item.id,
            name: item.name.trim().trimEnd().replace(".", ""),
            coordinates: coordinates,
            type: "county",
            province: element.id,
          });
        });
      })
    );

    console.log("Counties fetched successfully");

    all_cities = []; // شهر ها
    await Promise.all(
      all_counties.map(async (element) => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        try {
          url = `https://gnaf2.post.ir/sina/editor/tables/rural_city/rows?%24top=2000&%24orderby=name&%24filter=province_id+eq+${element.province}+and+county_id+eq+${element.id}+and+is_rural+eq+false`;
          const response = await axios.get(url, { headers });

          response.data.value.forEach((item) => {
            const coordinates = item.geocoded_point
              ? item.geocoded_point.coordinates
              : [56.47, 32.01];

            all_cities.push({
              id: item.id,
              name: item.name.trim().trimEnd().replace(".", ""),
              coordinates: coordinates,
              type: "city",
              province: element.province,
            });
          });
        } catch (error) {
          // Missing information for some cities in Post.ir
          if (element.id == 1267) {
            all_cities.push({
              id: 18800,
              name: "فرخ شهر",
              coordinates: [50.9825, 32.2706],
              type: "city",
              province: element.province,
            });
          } else if (element.id == 1266) {
            all_cities.push({
              id: 18801,
              name: "میرآباد",
              coordinates: [45.3762, 36.405],
              type: "city",
              province: element.province,
            });
          } else if (element.id == 31) {
            all_cities.push({
              id: 18802,
              name: "چهاربرج",
              coordinates: [45.9777, 37.1232],
              type: "city",
              province: element.province,
            });
          } else {
            console.log(error);
          }
        }
      })
    );

    console.log("Cities fetched successfully");

    let all_cities_concat = all_counties.concat(all_cities);

    const uniqueCities = all_cities_concat.reduce((acc, city) => {
      const existingCity = acc.find(
        (c) =>
          c.name.trim().trimEnd().replace(".", "").replace(/\s+/g, "") ===
            city.name.trim().trimEnd().replace(".", "").replace(/\s+/g, "") &&
          c.province === city.province
      );
      if (!existingCity) {
        acc.push(city);
      }

      return acc;
    }, []);

    console.log("Duplicates removed from all cities");

    new_cities = uniqueCities.sort((a, b) => a.name.localeCompare(b.name));

    let final_data = states.concat(new_cities);

    // const duplicateIds = final_data.reduce((acc, city, index) => {
    //   const duplicateIndex = final_data.findIndex(
    //     (c, i) => c.id === city.id && i !== index
    //   );
    //   if (duplicateIndex !== -1 && !acc.includes(city.id)) {
    //     acc.push(city.id);
    //   }
    //   return acc;
    // }, []);

    // console.log("Just know that there are duplicate IDs in the data");
    // console.log(duplicateIds);

    fs.writeFileSync("data_states_all_in_one.json", JSON.stringify(final_data));
    console.log("JSON file created successfully");

    const csvStatesWriter = csv({
      path: "data_provinces.csv",
      header: [
        { id: "id", title: "ID" },
        { id: "name", title: "Name" },
        { id: "coordinates", title: "Coordinates" },
      ],
    });

    csvStatesWriter
      .writeRecords(
        states.map((item) => ({
          id: item.id,
          name: item.name,
          coordinates: item.coordinates,
        }))
      )
      .then(() => {
        console.log("data_provinces.csv file created successfully");
      });

    const csvCitiesWriter = csv({
      path: "data_cities_all_in_one.csv",
      header: [
        { id: "id", title: "ID" },
        { id: "name", title: "Name" },
        { id: "coordinates", title: "Coordinates" },
        { id: "province", title: "Province" },
      ],
    });

    csvCitiesWriter
      .writeRecords(
        new_cities.map((item) => ({
          id: item.id,
          name: item.name,
          coordinates: item.coordinates,
          province: item.province,
        }))
      )
      .then(() => {
        console.log("data_cities_all_in_one.csv file created successfully");
      });

    const csvWriter = csv({
      path: "data_all_in_one.csv",
      header: [
        { id: "id", title: "ID" },
        { id: "name", title: "Name" },
        { id: "coordinates", title: "Coordinates" },
        { id: "type", title: "Type" },
        { id: "province", title: "Province" },
      ],
    });

    csvWriter
      .writeRecords(
        final_data.map((item) => ({
          id: item.id,
          name: item.name,
          coordinates: item.coordinates,
          type: item.type,
          province: item.province,
        }))
      )
      .then(() => {
        console.log("data_all_in_one.csv file created successfully");
      });

    let sql = `CREATE TABLE table_name (
      id INT PRIMARY KEY,
      type VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      coordinates VARCHAR(255),
      province INT
    );\n\n`;

    sql += final_data
      .map((item) => {
        const { id, type, name, coordinates, province } = item;
        return `\nINSERT INTO table_name (id, type, name, coordinates, province) VALUES (${id}, '${type}', '${name}', '${coordinates}', ${province});`;
      })
      .join("\n");

    fs.writeFileSync("data_all_in_one.sql", sql);
    console.log("data_all_in_one.sql file created successfully");

    console.log("All files created successfully");
  } catch (error) {
    console.log(error);
  }
}

fetchData();
