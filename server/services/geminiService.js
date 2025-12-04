// Service to analyze CSV data using Google Gemini AI
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI (get API key from environment variable)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Function to analyze CSV rows and create component objects
async function analyzeCSVData(csvRows) {
  try {
    // Step 1: First extract basic data from CSV using our mapping function
    console.log('Step 1: Extracting data from CSV...');
    const extractedComponents = mapCSVToComponents(csvRows);
    
    console.log(`Extracted ${extractedComponents.length} components from CSV`);
    if (extractedComponents.length > 0) {
      console.log('Sample extracted component:', extractedComponents[0]);
    }

    // Step 2: If no Gemini API key, return the extracted data as-is
    if (!process.env.GEMINI_API_KEY) {
      console.log('No Gemini API key found, returning extracted data without enrichment');
      return extractedComponents;
    }

    // Step 3: Use Gemini to enrich the extracted components
    console.log('Step 2: Enriching components with Gemini AI...');
    const enrichedComponents = await enrichComponentsWithGemini(extractedComponents);
    
    return enrichedComponents;

  } catch (error) {
    console.error('Error in analyzeCSVData:', error);
    // Fallback to basic mapping if anything fails
    console.log('Falling back to basic CSV mapping');
    return mapCSVToComponents(csvRows);
  }
}

// Function to enrich components using Gemini AI
async function enrichComponentsWithGemini(components) {
  try {
    // Get the Gemini model (use Gemini 2.5 Flash)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create a prompt for Gemini to enrich the components
    const prompt = `You are helping to enrich IoT component inventory entries with missing information.

Here are the components extracted from a CSV file:
${JSON.stringify(components, null, 2)}

For each component, enrich it by:
1. **Category**: If category is missing, empty, or "Other", intelligently determine the correct category based on the component name. 
   Valid categories: Microcontroller, SBC, Sensor, Actuator, Display, Power, Communication, Other
   Examples:
   - "Arduino Uno" → "Microcontroller"
   - "Raspberry Pi" → "SBC"
   - "DHT22" → "Sensor"
   - "Servo Motor" → "Actuator"
   - "LCD Display" → "Display"
   - "Battery" → "Power"
   - "WiFi Module" → "Communication"

2. **Tags**: If tags are missing or empty, generate 3-5 relevant tags based on the component name and category.
   Tags should be lowercase, single words or short phrases (e.g., ["arduino", "microcontroller", "iot", "atmega328p"])

3. **Description**: If description is missing or empty, generate a brief, informative description (1-2 sentences) about what the component is and its common use cases.

4. **Keep existing data**: Don't change fields that already have values (name, quantity, etc.). Only fill in missing or empty fields.

Return ONLY a valid JSON array of enriched component objects. No explanations, no markdown, just the JSON array.
Each component should have all fields filled in properly.

Example:
Input: { "name": "Arduino Uno", "category": "Other", "description": "", "tags": [], "totalQuantity": 10 }
Output: {
  "name": "Arduino Uno",
  "category": "Microcontroller",
  "description": "Popular open-source microcontroller board based on ATmega328P, commonly used for IoT projects and prototyping.",
  "tags": ["arduino", "microcontroller", "iot", "atmega328p", "prototyping"],
  "totalQuantity": 10
}`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
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
    let enrichedComponents;
    try {
      enrichedComponents = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', jsonText);
      throw new Error('Gemini returned invalid JSON. Using extracted data without enrichment.');
    }

    console.log(`Gemini AI successfully enriched ${enrichedComponents.length} components`);
    if (enrichedComponents.length > 0) {
      console.log('Sample enriched component:', enrichedComponents[0]);
    }

    // Validate and clean up each component
    return enrichedComponents.map(comp => cleanComponent(comp));

  } catch (error) {
    console.error('Gemini AI enrichment error:', error);
    // If enrichment fails, return the original extracted components
    console.log('Using extracted data without Gemini enrichment');
    return components;
  }
}

// ===== PROCUREMENT CSV HELPERS =====

// Map procurement CSV rows to procurement request objects (no AI)
function mapProcurementCSVToRequests(csvRows) {
  console.log('=== MAPPING PROCUREMENT CSV ROWS ===');
  console.log('Total rows to map:', csvRows.length);

  if (csvRows.length > 0) {
    console.log('Available columns:', Object.keys(csvRows[0]));
    console.log('First row (raw):', JSON.stringify(csvRows[0], null, 2));
  }

  const mapped = csvRows.map((row, index) => {
    console.log(`\n--- Processing procurement row ${index + 1} ---`);
    console.log('Row data:', JSON.stringify(row, null, 2));

    // Item name
    let itemName = findColumnValue(row, [
      'itemName', 'item name', 'item', 'product', 'product name', 'name',
      'component', 'component name'
    ]);

    if (!itemName) {
      // Fallback: first non-empty text column
      const keys = Object.keys(row);
      for (const key of keys) {
        const value = row[key];
        if (value && String(value).trim() !== '' && !String(value).match(/^\\d+$/)) {
          itemName = String(value).trim();
          console.log(`Using first text column "${key}" as itemName: "${itemName}"`);
          break;
        }
      }
    }

    if (!itemName) {
      itemName = `Item ${index + 1}`;
    }

    // Quantity
    let quantityValue = findColumnValue(row, [
      'quantity', 'qty', 'qty.', 'amount', 'units', 'count',
      'quantity needed', 'required quantity', 'required qty'
    ]);
    if (!quantityValue) {
      const keys = Object.keys(row);
      const qtyKey = keys.find((key) => {
        const k = key.toLowerCase().replace(/\\s+/g, '');
        return (
          k.includes('qty') ||
          k.includes('quantity') ||
          k.includes('units') ||
          k.includes('count') ||
          k.includes('pieces') ||
          k.includes('pcs')
        );
      });
      if (qtyKey) {
        quantityValue = row[qtyKey];
        console.log(
          `Using column "${qtyKey}" as quantity source for procurement row ${index + 1}:`,
          quantityValue
        );
      }
    }
    const extractedQty = extractNumber(quantityValue);
    const quantity = extractedQty !== null && extractedQty > 0 ? extractedQty : 1;

    // Priority
    let priorityValue = findColumnValue(row, ['priority', 'prio', 'urgency', 'importance']);
    let priority = 'MEDIUM';
    if (priorityValue) {
      const p = String(priorityValue).toUpperCase();
      if (p.includes('HIGH')) priority = 'HIGH';
      else if (p.includes('LOW')) priority = 'LOW';
      else priority = 'MEDIUM';
    }

    // Category
    const category = findColumnValue(row, ['category', 'type', 'component category', 'component type']) || '';

    // Description
    const description =
      findColumnValue(row, ['description', 'desc', 'details', 'notes']) || '';

    // Remarks
    const remarks =
      findColumnValue(row, ['remarks', 'comments', 'comment', 'extra', 'additional notes']) ||
      '';

    // Optional: componentId if provided
    const componentId = findColumnValue(row, ['componentId', 'component id', 'component_id']) || null;

    const request = {
      itemName: String(itemName).trim(),
      quantity,
      priority,
      componentId,
      category: String(category || '').trim(),
      description: String(description || '').trim(),
      remarks: String(remarks || '').trim(),
    };

    console.log(`✅ Procurement row ${index + 1} mapped:`, request);
    return request;
  });

  console.log('\\n=== PROCUREMENT MAPPING COMPLETE ===');
  console.log(`Mapped ${mapped.length} procurement requests`);
  if (mapped.length > 0) {
    console.log('Sample mapped procurement request:', JSON.stringify(mapped[0], null, 2));
  }

  return mapped;
}

// Enrich procurement requests with Gemini (priority/category/description)
async function enrichProcurementsWithGemini(requests) {
  try {
    // If no API key, just return original
    if (!process.env.GEMINI_API_KEY) {
      console.log('No Gemini API key for procurement enrichment, returning original requests');
      return requests;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are helping to enrich procurement requests for an IoT lab inventory system.

Here are the procurement requests (JSON array):
${JSON.stringify(requests, null, 2)}

For each request, enrich it by:
1. If category is empty, guess a suitable category based on itemName. Use these categories when possible:
   Microcontroller, SBC, Sensor, Actuator, Display, Power, Communication, Other.
2. If description is empty, write a short 1-2 sentence description of what is being procured.
3. If priority is missing or not one of HIGH, MEDIUM, LOW, set it based on urgency implied by the name/description:
   - HIGH for critical parts or very low stock / urgent needs
   - MEDIUM for normal restocking
   - LOW for nice-to-have items
4. Keep itemName and quantity exactly as they are.

Return ONLY a valid JSON array of enriched procurement request objects.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith('```json')) {
      text = text.replace(/```json\\n?/g, '').replace(/```\\n?/g, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/```\\n?/g, '');
    }

    let enriched;
    try {
      enriched = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse enriched procurement JSON:', text);
      throw new Error('Gemini returned invalid JSON for procurement enrichment');
    }

    console.log(`Gemini enriched ${enriched.length} procurement requests`);
    if (enriched.length > 0) {
      console.log('Sample enriched request:', enriched[0]);
    }

    // Basic cleanup: ensure required fields
    return enriched.map((req, index) => ({
      itemName: String(req.itemName || requests[index]?.itemName || `Item ${index + 1}`).trim(),
      quantity: extractNumber(req.quantity) || requests[index]?.quantity || 1,
      priority: ['HIGH', 'MEDIUM', 'LOW'].includes(String(req.priority || '').toUpperCase())
        ? String(req.priority).toUpperCase()
        : requests[index]?.priority || 'MEDIUM',
      componentId: req.componentId || requests[index]?.componentId || null,
      category: String(req.category || requests[index]?.category || '').trim(),
      description: String(req.description || requests[index]?.description || '').trim(),
      remarks: String(req.remarks || requests[index]?.remarks || '').trim(),
    }));
  } catch (error) {
    console.error('Gemini procurement enrichment error:', error);
    return requests;
  }
}

// Helper function to find column value (case-insensitive, handles spaces/underscores)
function findColumnValue(row, possibleNames) {
  // First try exact matches
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  
  // Then try case-insensitive matches
  const rowKeys = Object.keys(row);
  for (const name of possibleNames) {
    const foundKey = rowKeys.find(key => 
      key.toLowerCase().trim() === name.toLowerCase().trim() ||
      key.toLowerCase().replace(/[\s_]/g, '') === name.toLowerCase().replace(/[\s_]/g, '')
    );
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
      return row[foundKey];
    }
  }
  
  return null;
}

// Helper to extract a number from a value like "10", "10 pcs", "x 5 units"
function extractNumber(value) {
  if (value === null || value === undefined) return null;
  const text = String(value);
  const match = text.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  return parseInt(match[0], 10);
}

// Fallback function to map CSV rows to components without AI
function mapCSVToComponents(csvRows) {
  // Log what we're working with
  console.log('=== MAPPING CSV ROWS ===');
  console.log('Total rows to map:', csvRows.length);
  
  if (csvRows.length > 0) {
    console.log('Available columns:', Object.keys(csvRows[0]));
    console.log('First row (raw):', JSON.stringify(csvRows[0], null, 2));
    console.log('All column names:', Object.keys(csvRows[0]));
    
    // Log all rows for debugging
    csvRows.forEach((row, idx) => {
      console.log(`Row ${idx + 1}:`, JSON.stringify(row));
    });
  }

  const mapped = csvRows.map((row, index) => {
    console.log(`\n--- Processing row ${index + 1} ---`);
    console.log('Row data:', JSON.stringify(row, null, 2));
    console.log('Row keys:', Object.keys(row));
    // Try to find name column with many variations (case-insensitive)
    let name = findColumnValue(row, [
      'name', 'component', 'component name', 'componentname', 
      'item', 'item name', 'itemname', 'product', 'product name',
      'title', 'component_name', 'item_name'
    ]);

    // If still no name found, try using the first column that has text data
    if (!name || name === `Component ${index + 1}`) {
      const rowKeys = Object.keys(row);
      for (const key of rowKeys) {
        const value = row[key];
        if (value && String(value).trim() !== '' && !String(value).match(/^\d+$/)) {
          // Use first non-empty, non-numeric column as name
          name = String(value).trim();
          console.log(`Using first text column "${key}" as name: "${name}"`);
          break;
        }
      }
    }

    // Final fallback
    if (!name || name === '') {
      name = `Component ${index + 1}`;
    }

    // Try to find category
    const category = findColumnValue(row, [
      'category', 'type', 'cat', 'component type', 'componenttype',
      'component_category', 'component_category'
    ]) || 'Other';

    // Try to find quantity (total quantity) with many variations
    let quantityValue = findColumnValue(row, [
      'quantity',
      'qty',
      'amount',
      'stock',
      'totalquantity',
      'total_quantity',
      'qty.',
      'stock quantity',
      'stockquantity',
      'total stock',
      'total_stock',
      'total',
    ]);

    // If not found directly, try any column whose name contains qty/quantity/stock (very forgiving)
    if (!quantityValue) {
      const lowerKeys = Object.keys(row);
      const qtyKey = lowerKeys.find((key) => {
        const k = key.toLowerCase().replace(/\s+/g, '');
        return (
          k.includes('qty') ||
          k.includes('quantity') ||
          k.includes('stock') ||
          k.includes('count') ||
          k.includes('pieces') ||
          k.includes('pcs')
        );
      });
      if (qtyKey) {
        quantityValue = row[qtyKey];
        console.log(
          `Using column "${qtyKey}" as quantity source for row ${index + 1}:`,
          quantityValue
        );
      }
    }

    // Extract numeric value from the quantity (handles "10", "10 pcs", etc.)
    const extractedQuantity = extractNumber(quantityValue);
    const quantity = extractedQuantity !== null ? extractedQuantity : 0;

    // Try to find description
    const description = findColumnValue(row, [
      'description', 'desc', 'details', 'component description',
      'componentdescription', 'desc.', 'notes'
    ]) || '';

    // Try to find tags
    const tagsValue = findColumnValue(row, ['tags', 'tag', 'keywords', 'keyword']);
    const tags = tagsValue 
      ? (Array.isArray(tagsValue) ? tagsValue : String(tagsValue).split(',').map(t => t.trim()).filter(t => t.length > 0))
      : [];

    // Try to find datasheet link
    const datasheetLink = findColumnValue(row, [
      'datasheet', 'datasheetlink', 'datasheet_link', 'link', 'url',
      'datasheet url', 'datasheeturl', 'datasheet_link'
    ]) || '';

    // Try to find condition
    const conditionValue = findColumnValue(row, ['condition', 'status', 'state', 'quality']);
    const condition = conditionValue && ['excellent', 'good', 'fair', 'poor'].includes(String(conditionValue).toLowerCase())
      ? String(conditionValue).toLowerCase()
      : 'good';

    // Try to find remarks
    const remarks = findColumnValue(row, [
      'remarks', 'notes', 'comment', 'comments', 'additional notes',
      'additional_notes', 'additionalnotes'
    ]) || '';

    // Try to find purchase date
    const purchaseDate = findColumnValue(row, [
      'purchasedate', 'purchase_date', 'date', 'purchase date',
      'purchased', 'purchase_date', 'date purchased'
    ]) || null;

    // Try to find threshold
    const thresholdValue = findColumnValue(row, ['threshold', 'low_stock_threshold', 'low stock threshold', 'min_stock']);
    const threshold = thresholdValue ? parseInt(thresholdValue) : 5;

    const component = {
      name: String(name).trim(),
      category: String(category).trim(),
      description: String(description).trim(),
      totalQuantity: isNaN(quantity) ? 0 : quantity,
      threshold: isNaN(threshold) ? 5 : threshold,
      tags: tags,
      datasheetLink: String(datasheetLink).trim(),
      condition: condition,
      remarks: String(remarks).trim(),
      purchaseDate: purchaseDate || null
    };

    // Log if we're using fallback name
    if (component.name === `Component ${index + 1}`) {
      console.log(`⚠️ Warning: Row ${index + 1} - Could not find name column. Available columns:`, Object.keys(row));
      console.log(`Row values:`, Object.values(row));
    } else {
      console.log(`✅ Row ${index + 1} mapped successfully:`, component.name);
    }

    return component;
  });
  
  console.log(`\n=== MAPPING COMPLETE ===`);
  console.log(`Mapped ${mapped.length} components`);
  if (mapped.length > 0) {
    console.log('Sample mapped component:', JSON.stringify(mapped[0], null, 2));
  }
  
  return mapped;
}

// Clean and validate component object
function cleanComponent(comp) {
  // Ensure required fields
  if (!comp.name || !comp.category) {
    throw new Error(`Missing required fields: name and category are required`);
  }

  // Validate category
  const validCategories = ['Microcontroller', 'SBC', 'Sensor', 'Actuator', 'Display', 'Power', 'Communication', 'Other'];
  if (!validCategories.includes(comp.category)) {
    comp.category = 'Other';
  }

  // Ensure numbers are valid
  comp.totalQuantity = parseInt(comp.totalQuantity) || 0;
  comp.threshold = parseInt(comp.threshold) || 5;

  // Ensure tags is an array
  if (typeof comp.tags === 'string') {
    comp.tags = comp.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
  } else if (!Array.isArray(comp.tags)) {
    comp.tags = [];
  }

  // Validate condition
  const validConditions = ['excellent', 'good', 'fair', 'poor'];
  if (!validConditions.includes(comp.condition)) {
    comp.condition = 'good';
  }

  // Clean strings
  comp.name = String(comp.name).trim();
  comp.description = String(comp.description || '').trim();
  comp.datasheetLink = String(comp.datasheetLink || '').trim();
  comp.remarks = String(comp.remarks || '').trim();

  // Handle purchase date
  if (comp.purchaseDate && typeof comp.purchaseDate === 'string') {
    // Try to parse date, if invalid set to null
    const date = new Date(comp.purchaseDate);
    comp.purchaseDate = isNaN(date.getTime()) ? null : comp.purchaseDate;
  } else {
    comp.purchaseDate = null;
  }

  return comp;
}

module.exports = {
  analyzeCSVData,
  enrichComponentsWithGemini,
  mapCSVToComponents
};

