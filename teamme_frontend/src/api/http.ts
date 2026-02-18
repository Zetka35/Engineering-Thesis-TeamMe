const BASE_URL = "http://localhost:8080/api";

export async function get<T>(url: string): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${url}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("Fetch failed:", err);
    throw err;
  }
}
