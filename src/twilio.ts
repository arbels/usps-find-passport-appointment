import { Twilio } from "twilio";

/**
 * Send an SMS alert to the user using Twilio.
 *
 * @param messageBody - The message body to send to the user
 */
export const sendAlert = async (messageBody: string) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
  const myNumber = process.env.MY_NUMBER || "";
  const client = new Twilio(accountSid, authToken);

  const message = await client.messages.create({
    body: messageBody,
    from: twilioNumber,
    to: myNumber,
  });
  console.log(message.sid);
  return;
};
