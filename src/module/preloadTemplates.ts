export const preloadTemplates = async function() {
	const templatePaths = [
		// Add paths to "modules/foundryvtt-confetti/templates"
	];

	return loadTemplates(templatePaths);
}
