import { createClient } from "@/supabase/server";
import { getGoogleClient } from "@/lib/google";
import { redirect } from "next/navigation";

export default async function TestGooglePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // NOTE: provider_token is NOT always present in getSession().
  // It is usually present immediately after the OAuth callback exchange.
  // If it is missing, we might need to re-login or store it explicitly.
  // For this test, we assume it's available or we might fail.
  const accessToken = session.provider_token;

  let calendarData = null;
  let contactsData = null;
  let error = null;

  if (accessToken) {
    try {
      const google = getGoogleClient(accessToken);

      // 1. Fetch Calendar Events
      const calendarRes = await google.calendar.events.list({
        calendarId: "primary",
        maxResults: 5,
        timeMin: new Date().toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });
      calendarData = calendarRes.data.items;

      // 2. Fetch Contacts
      const peopleRes = await google.people.people.connections.list({
        resourceName: "people/me",
        personFields: "names,emailAddresses,phoneNumbers",
        pageSize: 5,
      });
      contactsData = peopleRes.data.connections;
    } catch (e: any) {
      error = e.message;
    }
  }

  return (
    <div className="p-10 space-y-8">
      <h1 className="text-2xl font-bold">Google Integration Test</h1>

      <div>
        <h2 className="text-xl font-semibold">Session Status</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify({
             user: session.user.email,
             hasAccessToken: !!accessToken
          }, null, 2)}
        </pre>
        {!accessToken && (
          <p className="text-red-500 mt-2">
            No Access Token found in session. Please Logout and Log back in to refresh the session token.
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <h3 className="text-red-800 font-bold">API Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border p-4 rounded shadow">
          <h3 className="font-bold mb-4">Calendar Events (Next 5)</h3>
          {calendarData ? (
            <ul className="list-disc pl-5 space-y-2">
              {calendarData.length === 0 && <li>No upcoming events found.</li>}
              {calendarData.map((event: any) => (
                <li key={event.id}>
                  <span className="font-medium">{event.summary}</span>
                  <br />
                  <span className="text-sm text-gray-500">
                    {event.start.dateTime || event.start.date}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">Loading or No Access...</p>
          )}
        </div>

        <div className="border p-4 rounded shadow">
          <h3 className="font-bold mb-4">Contacts (First 5)</h3>
          {contactsData ? (
            <ul className="list-disc pl-5 space-y-2">
               {contactsData.length === 0 && <li>No contacts found.</li>}
              {contactsData.map((person: any) => (
                <li key={person.resourceName}>
                  {person.names?.[0]?.displayName || "Unknown Name"}
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-gray-400">Loading or No Access...</p>
          )}
        </div>
      </div>
    </div>
  );
}
