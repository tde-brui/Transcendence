/**
 * Fetches the username from the database based on the user ID.
 * @param id - The ID of the user.
 * @returns A promise that resolves to the username, or "Unknown User" if not found.
 */
export const returnName = async (id: number): Promise<string> => {
	try {
	  // Make an API request to fetch the user by ID
	  const response = await fetch(`http://localhost:8000/users/${id}/`);
  
	  // Check if the response is OK (status code in the range 200-299)
	  if (!response.ok) {
		throw new Error(`Error fetching user: ${response.statusText}`);
	  }
  
	  const data = await response.json();
  
	  // Return the username or "Unknown User" if username is missing
	  return data.username || "Unknown User";
	} catch (error) {
	  console.error("Error fetching user data:", error);
	  return "Unknown User";
	}
  };
  