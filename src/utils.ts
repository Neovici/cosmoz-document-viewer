/**
 * Format a greeting message.
 * @param greeting - The greeting word (e.g., "Hello")
 * @param name - The name to greet (e.g., "World")
 * @returns Formatted greeting string
 */
export const formatGreeting = (greeting: string, name: string): string => {
	if (!greeting && !name) return '';
	if (!greeting) return name;
	if (!name) return greeting;
	return `${greeting}, ${name}!`;
};
