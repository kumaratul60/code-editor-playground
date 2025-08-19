import {editor} from "../DOMIndex/domUtils.js";

export function setDefaultCode() {
    const defaultCode = `// A JavaScript Example to Showcase DevInsights

async function fetchAndProcessUsers() {
  console.log("Fetching user data...");
  
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const users = await response.json();
    console.log("Data fetched successfully!");

    // --- Data Processing ---
    // Let's find users from 'South Elvis'
    const targetCity = "South Elvis";
    const usersInCity = users.filter(user => user.address.city === targetCity);
    
    console.log(\`Found \${usersInCity.length} user(s) from \${targetCity}:\`);

    // --- Transformation ---
    // Create a simplified list of names and emails
    const simplifiedUsers = usersInCity.map(user => {
      return { name: user.name, email: user.email };
    });

    console.log("Processed User Data:", simplifiedUsers);

    // --- Performance Anti-Pattern Example ---
    // Unnecessary complex loop to simulate work
    let complexCalculation = 0;
    for (let i = 0; i < simplifiedUsers.length; i++) {
        for (let j = 0; j < 1000; j++) { // Nested loop
            complexCalculation += j;
        }
    }
    console.log("A simulated complex calculation finished.");

  } catch (error) {
    console.error("Failed to fetch or process data:", error);
  }
}

fetchAndProcessUsers();`;
    editor.innerText = defaultCode;
}