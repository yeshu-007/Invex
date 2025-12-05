// Service to identify components from images using Google Gemini Vision API
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI (get API key from environment variable)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Function to identify component from image
async function identifyComponentFromImage(imageBuffer, imageMimeType, allComponents) {
  try {
    // If no API key, return empty results
    if (!process.env.GEMINI_API_KEY) {
      console.log('No Gemini API key found, cannot identify component from image');
      return [];
    }

    // Get the Gemini model with vision support (use gemini-2.5-flash for vision)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Convert image buffer to base64
    const imageBase64 = imageBuffer.toString('base64');

    // Create a list of available components for context
    const componentsList = allComponents.map(comp => ({
      name: comp.name,
      category: comp.category,
      description: comp.description || '',
      tags: comp.tags || []
    }));

    // Create a prompt for Gemini
    const prompt = `Look at this image of an IoT/electronics component. 

I have a database of components with these items:
${JSON.stringify(componentsList, null, 2)}

Your task:
1. Identify what component is shown in the image (e.g., "Arduino Uno", "Raspberry Pi 4", "DHT22 Sensor", etc.)
2. Match it to the closest component(s) from the database above
3. Return a JSON array of matched components, sorted by confidence (most likely match first)

For each match, provide:
- name: The component name from the database
- confidence: A number from 0-100 indicating how confident you are this is a match
- reason: Brief explanation of why this matches

If you cannot identify the component or find no matches, return an empty array [].

Return ONLY valid JSON, no markdown, no explanations outside the JSON.
Example format:
[
  {
    "name": "Arduino Uno R3",
    "confidence": 95,
    "reason": "The image shows the characteristic blue PCB with USB port and pin headers matching Arduino Uno R3"
  },
  {
    "name": "Arduino Nano",
    "confidence": 60,
    "reason": "Similar microcontroller board but smaller form factor"
  }
]`;

    // Call Gemini Vision API
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType || 'image/jpeg'
        }
      },
      prompt
    ]);

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Parse JSON response
    let matches;
    try {
      matches = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', jsonText);
      return [];
    }

    // If matches is not an array, wrap it
    if (!Array.isArray(matches)) {
      matches = [matches];
    }

    // Filter out matches with very low confidence (< 30)
    const filteredMatches = matches.filter(match => match.confidence >= 30);

    console.log(`Image recognition found ${filteredMatches.length} potential matches`);
    
    // Find full component data for each match
    const matchedComponents = filteredMatches.map(match => {
      const component = allComponents.find(comp => comp.name === match.name);
      if (component) {
        // Convert Mongoose document to plain object to ensure all properties are preserved
        const componentObj = component.toObject ? component.toObject() : component;
        return {
          ...componentObj,
          componentId: componentObj.componentId || componentObj._id?.toString(),
          matchConfidence: match.confidence,
          matchReason: match.reason
        };
      }
      return null;
    }).filter(comp => comp !== null);

    return matchedComponents;

  } catch (error) {
    console.error('Image recognition error:', error);
    // Return empty array on error
    return [];
  }
}

module.exports = {
  identifyComponentFromImage
};

