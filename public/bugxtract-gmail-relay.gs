/**
 * BugXtract.com Gmail relay for Contact Us inquiries.
 * Deploy as a Web App, executing as your Google account, with access set to Anyone.
 * Keep the Web App URL private and save it in the BugXtract.com admin panel.
 */
function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) {
      return jsonReply({ ok: false, message: "Missing inquiry data." });
    }

    var inquiry = JSON.parse(event.postData.contents);
    var recipient = String(inquiry.to || "").trim();
    var replyTo = String(inquiry.replyTo || "").trim();
    var subject = String(inquiry.subject || "BugXtract.com — New project inquiry")
      .replace(/[\r\n\t]+/g, " ").slice(0, 180);
    var body = String(inquiry.text || "").slice(0, 20000);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) || !body) {
      return jsonReply({ ok: false, message: "The recipient or inquiry details are invalid." });
    }

    var options = {};
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) options.replyTo = replyTo;
    MailApp.sendEmail(recipient, subject, body, options);
    return jsonReply({ ok: true });
  } catch (error) {
    console.error("Could not send the BugXtract inquiry", error);
    return jsonReply({ ok: false, message: "Gmail could not send the inquiry. Check the script authorization and daily sending quota." });
  }
}

function jsonReply(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
