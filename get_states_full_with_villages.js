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
    // استان ها
    const response = await axios.get(url, { headers });
    const states = response.data.value.map((item) => ({
      id: item.id,
      name: item.name,
      coordinates: item.geocoded_point.coordinates,
      type: "province",
      province: 0,
      county: 0,
      district: 0,
      rural_district: 0,
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
            county: 0,
            district: 0,
            rural_district: 0,
          });
        });
      })
    );

    console.log("Counties fetched successfully");

    all_cities = []; // شهر ها
    all_district = []; // بخش های روستایی
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
              county: element.id,
              district: 0,
              rural_district: 0,
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
              county: element.id,
              district: 0,
              rural_district: 0,
            });
          } else if (element.id == 1266) {
            all_cities.push({
              id: 18801,
              name: "میرآباد",
              coordinates: [45.3762, 36.405],
              type: "city",
              province: element.province,
              county: element.id,
              district: 0,
              rural_district: 0,
            });
          } else if (element.id == 31) {
            all_cities.push({
              id: 18802,
              name: "چهاربرج",
              coordinates: [45.9777, 37.1232],
              type: "city",
              province: element.province,
              county: element.id,
              district: 0,
              rural_district: 0,
            });
          } else {
            console.log(error);
          }
        }

        try {
          await new Promise((resolve) => setTimeout(resolve, 200));
          url = `https://gnaf2.post.ir/sina/editor/tables/zone/rows?%24expand=province%28id%7Cprovince_id%29%2Ccounty%28id%7Ccounty_id%29&%24top=200&%24orderby=name&%24filter=province_id+eq+${element.province}+and+county_id+eq+${element.id}`;
          const response = await axios.get(url, { headers });

          response.data.value.forEach((item) => {
            const coordinates = item.geocoded_point
              ? item.geocoded_point.coordinates
              : [56.47, 32.01];

            all_district.push({
              id: item.id,
              name: item.name.trim().trimEnd().replace(".", ""),
              coordinates: coordinates,
              type: "district",
              province: element.province,
              county: element.id,
              district: 0,
              rural_district: 0,
            });
          });
        } catch (error) {
          // console.log(error);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      })
    );

    console.log("Cities and districts fetched successfully");

    all_rural_district = []; // دهستان ها
    all_rural_district_tmp = []; // دهستان ها
    await Promise.all(
      all_district.map(async (element) => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 200));
          url = `https://gnaf2.post.ir/sina/editor/tables/rural_city/rows?%24top=20&%24orderby=name&%24filter=province_id+eq+${element.province}+and+county_id+eq+${element.county}+and+zone_id+eq+${element.id}+and+is_rural+eq+true`;
          const response = await axios.get(url, { headers });

          response.data.value.forEach((item) => {
            const coordinates = item.geocoded_point
              ? item.geocoded_point.coordinates
              : [56.47, 32.01];

            all_rural_district.push({
              id: item.id,
              name: item.name.trim().trimEnd().replace(".", ""),
              coordinates: coordinates,
              type: "rural_district",
              province: element.province,
              county: element.county,
              district: element.id,
              rural_district: 0,
            });

            all_rural_district_tmp.push({
              id: item.id,
              province: element.province,
              county: element.county,
              district: element.id,
              rural_district: 0,
              rural_id: item.rural_id,
            });
          });
        } catch (error) {
          // Some districts information is missing in Post.ir and returned 404
          // console.log(error);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      })
    );

    console.log("Rural districts fetched successfully");

    all_villages = []; // روستاها
    await Promise.all(
      all_rural_district_tmp.map(async (element) => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const villages = [];
        try {
          url = `https://gnaf2.post.ir/sina/editor/tables/village/rows?%24top=200&%24orderby=name&%24filter=province_id+eq+${element.province}+and+county_id+eq+${element.county}+and+zone_id+eq+${element.district}+and+rural_id+eq+${element.rural_id}`;
          const response = await axios.get(url, { headers });

          response.data.value.forEach((item) => {
            const coordinates = item.geocoded_point
              ? item.geocoded_point.coordinates
              : [56.47, 32.01];

            villages.push({
              id: item.id,
              name: item.name.trim().trimEnd().replace(".", ""),
              coordinates: coordinates,
              type: "village",
              province: element.province,
              county: element.county,
              district: element.district,
              rural_district: element.id,
            });
          });
        } catch (error) {
          // Some villages information is missing in Post.ir and returned 404
          // console.log(error);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        all_villages = all_villages.concat(villages);
      })
    );

    console.log("Villages fetched successfully");
    console.log("Data fetched successfully");

    let final_data = states.concat(
      all_counties,
      all_cities,
      all_district,
      all_rural_district,
      all_villages
    );

    fs.writeFileSync(
      "data_full_with_villages.json",
      JSON.stringify(final_data)
    );

    console.log("JSON file created successfully");

    const csvWriter = csv({
      path: "data_full_with_villages.csv",
      header: [
        { id: "id", title: "ID" },
        { id: "name", title: "Name" },
        { id: "coordinates", title: "Coordinates" },
        { id: "type", title: "Type" },
        { id: "province", title: "Province" },
        { id: "county", title: "County" },
        { id: "district", title: "District" },
        { id: "rural_district", title: "Rural District" },
      ],
    });

    csvWriter.writeRecords(final_data).then(() => {
      console.log("CSV file created successfully");
    });

    csvWriter
      .writeRecords(
        final_data.map((item) => ({
          id: item.id,
          name: item.name,
          coordinates: item.coordinates,
          type: item.type,
          province: item.province,
          county: item.county,
          district: item.district,
          rural_district: item.rural_district,
        }))
      )
      .then(() => {
        console.log("CSV file created successfully");
      });
  } catch (error) {
    console.log(error);
  }
}

fetchData();
