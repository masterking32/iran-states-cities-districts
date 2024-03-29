# Iran Location Data Scraper

This project is a simple and efficient tool for fetching updated states, cities, and districts data from the [Iranian Post official website](https://post.ir). The data is saved as JSON and CSV file, which can be easily integrated into your projects.

## Features

- Fetches updated location data (states, cities, districts) from the [Iranian Post official website](https://post.ir).
- Saves the data in JSON and CSV format for easy use in other projects.
- Uses Axios for making HTTP requests.

## Installation

1. Clone this repository to your local machine.
2. Run `npm install axios` to install the necessary dependencies.

## Usage

1. Go to [https://gnaf2.post.ir/proposal](https://gnaf2.post.ir/proposal).
2. Use the inspect element tool in your browser to get the [`x-api-key`](https://github.com/masterking32/iran-states-cities-districts/blob/b0c2c8558b2d437ee3a2ca00085fa842f869d412/get_states.js#L13).
3. Insert the `x-api-key` into the `global.js` file.
4. Run `npm install`.
5. Run `node get_states_full_with_villages.js` or `node get_states.js` or `node get_states_all_in_one.js` in your terminal to start the data fetching process.

## Author

This project is created and maintained by [masterking32](https://github.com/masterking32).

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/masterking32/iran-states-cities-districts/issues) if you want to contribute.

## Show your support

Give a ⭐️ if this project helped you!
