import "dotenv/config";
import axios from "axios";
import { Response } from "./types";
import { sendAlert } from "./twilio";
import { DateTime } from "luxon";

// The list of USPS locations (FBDIDS) to search for.
const FBDIDS = {
  "Taylor": "1384326",
  "Georgetown": "1364651",
  "Round Rock": "1379976",
  "Pflugerville": "1377348",
};

// The maximum date to search for.
const MAX_DATE = DateTime.local().plus({ days: 30 });

// Number of milliseconds to wait before calling the USPS API again.
const SLEEP_TIME = 1000 * 10;

/**
 * Entry point for the application.
 *
 * @returns void
 */
const findPassportAppointment = async () => {
  let i = 0;

  const run = true;

  while (run) {
    try {
      console.log(`Run #${i} - Sending requests...`);

      const promises = Object.entries(FBDIDS).map(([name, fdbId]) =>
        callUSPS(name, fdbId)
      );

      const responses = await Promise.all(promises);

      for (const response of responses) {
        const { name, data } = response;
        const availableDates = data.dates?.filter(
          (date) => DateTime.fromFormat(date, "yyyyMMdd") < MAX_DATE
        );
        if (availableDates?.length > 0) {
          console.log(
            `Run #${i} - ${name} - Found dates: ${availableDates.join(", ")}`
          );
          const messageBody = `Found dates - ${name} - ${availableDates.join(
            ", "
          )}`;
          await sendAlert(messageBody);
          return;
        } else {
          console.log(`Run #${i} - ${name} - No dates found`);
        }
      }

      console.log(`Sleeping for ${SLEEP_TIME / 1000} seconds...`, "\n");
      await sleep(SLEEP_TIME);
      i++;
    } catch (error) {
      console.log(error);
      return;
    }
  }
};

/**
 * Sleep for the given number of milliseconds.
 *
 * @param ms - The number of milliseconds to sleep
 * @returns Promise<void>
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call the USPS API to get the available dates for the given FBDID.
 *
 * @param name - The name of the location
 * @param fdbId - USPS's internal ID of the location
 * @returns Promise<{name: string, data: Response}>
 */
const callUSPS = async (name: string, fdbId: string) => {
  console.log(`Calling USPS for location - ${name}`);
  const url =
    "https://tools.usps.com/UspsToolsRestServices/rest/v2/appointmentDateSearch";

  const headers = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
  };

  const body = {
    numberOfAdults: "0",
    numberOfMinors: "1",
    fdbId,
    productType: "PASSPORT",
  };

  const response = await axios.post<Response>(url, body, { headers });
  return {
    name,
    data: response.data,
  };
};

findPassportAppointment();
