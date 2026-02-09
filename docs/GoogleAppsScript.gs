/**
 * Google Apps Script - Order Handler
 * ================================
 * Deploy this as a Google Apps Script to handle order submissions
 * 
 * Setup Instructions:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Copy this code into the editor
 * 4. Set up Google Sheet with columns: customer_name, phone, address, order_details, order_price, order_date, frequency
 * 5. Update SHEET_ID below with your actual spreadsheet ID
 * 6. Deploy as a web app (Execute as: Me, Who has access: Anyone)
 * 7. Copy the deployment URL and update SHEETS_API.SCRIPT_URL in config.js
 */

// ============================================
// CONFIGURATION
// ============================================

// Replace with your actual Google Sheet ID
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

// Name of the sheet tab where orders will be stored
const SHEET_NAME = 'Orders';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get or create the orders sheet
 */
function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    // Add headers
    const headers = ['customer_name', 'phone', 'address', 'order_details', 'order_price', 'order_date', 'frequency', 'submission_timestamp'];
    sheet.appendRow(headers);
  }

  return sheet;
}

/**
 * Log order to Google Sheet
 */
function logOrderToSheet(data) {
  try {
    const sheet = getOrCreateSheet();

    const row = [
      data.customer_name || '',
      data.phone || '',
      data.address || '',
      data.order_details || '',
      data.order_price || 0,
      data.order_date || new Date().toLocaleString('ar-EG'),
      data.frequency || 'مرة واحدة',
      new Date().toISOString()
    ];

    sheet.appendRow(row);
    return true;

  } catch (error) {
    Logger.log('Error logging order: ' + error);
    return false;
  }
}

/**
 * Send email notification to admin
 */
function sendAdminNotification(data) {
  try {
    const adminEmail = 'admin@example.com'; // Replace with your email
    const subject = `📦 طلب جديد من ${data.customer_name}`;

    const body = `
طلب جديد:

الاسم: ${data.customer_name}
الهاتف: ${data.phone}
العنوان: ${data.address}

التفاصيل: ${data.order_details}
السعر: ${data.order_price} جنيه
التكرار: ${data.frequency}

---
تاريخ الطلب: ${data.order_date}
    `;

    GmailApp.sendEmail(adminEmail, subject, body);
    return true;

  } catch (error) {
    Logger.log('Error sending email: ' + error);
    return false;
  }
}

/**
 * Send SMS via Twilio (optional - requires Twilio setup)
 */
function sendSMSNotification(data) {
  try {
    // This requires Twilio API setup
    // Implement based on your Twilio account
    return true;

  } catch (error) {
    Logger.log('Error sending SMS: ' + error);
    return false;
  }
}

/**
 * Send WhatsApp notification via Twilio (optional)
 */
function sendWhatsAppNotification(data) {
  try {
    // This requires Twilio API setup
    // Format: +country_code+phone_number
    const customerPhone = `+20${data.phone.slice(-10)}`;

    const message = `
🎉 شكراً لطلبك!
${data.customer_name}

💰 الإجمالي: ${data.order_price} جنيه
⏰ التكرار: ${data.frequency}

سيتم التواصل معك قريباً 📞
    `;

    // Call Twilio API (requires setup)
    // sendWhatsAppViaTwilio(customerPhone, message);

    return true;

  } catch (error) {
    Logger.log('Error sending WhatsApp: ' + error);
    return false;
  }
}

// ============================================
// MAIN HANDLER
// ============================================

/**
 * Handle POST requests from the web app
 */
function doPost(e) {
  try {
    // Parse incoming JSON
    const data = JSON.parse(e.postData.contents);

    // Validate required fields
    const required = ['customer_name', 'phone', 'address'];
    for (let field of required) {
      if (!data[field]) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, message: `Missing field: ${field}` })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Log order to sheet
    const logged = logOrderToSheet(data);
    if (!logged) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: 'Failed to log order' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Send notifications
    sendAdminNotification(data);
    sendWhatsAppNotification(data);

    // Return success response
    return ContentService.createTextOutput(
      JSON.stringify({ 
        success: true, 
        message: 'Order received successfully',
        timestamp: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error: ' + error);
    return ContentService.createTextOutput(
      JSON.stringify({ 
        success: false, 
        message: 'Server error: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ 
      message: 'One Market Order Handler',
      version: '1.0',
      status: 'ready'
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test the script locally (run from editor)
 */
function testHandler() {
  const testData = {
    customer_name: 'محمد أحمد',
    phone: '201001234567',
    address: 'القاهرة - المعادي - شارع النيل',
    order_details: '5 كجم طماطم\n3 كجم بصل',
    order_price: 155,
    order_date: new Date().toLocaleString('ar-EG'),
    frequency: 'أسبوعي'
  };

  const result = logOrderToSheet(testData);
  Logger.log('Test result: ' + result);
}
