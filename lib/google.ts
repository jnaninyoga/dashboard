import { google } from 'googleapis';

export const getGoogleClient = (accessToken: string) => {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  return {
    calendar: google.calendar({ version: 'v3', auth }),
    people: google.people({ version: 'v1', auth }),
  };
};
